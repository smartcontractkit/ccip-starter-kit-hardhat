/**
 * CCIP send with message + token.
 *
 * Command to run:
 *   npx hardhat example03 --network <NETWORK_NAME> --source-router <SOURCE_ROUTER> --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> --receiver <RECEIVER> --message-text <MESSAGE_TEXT> --token-to-send <TOKEN_ADDRESS> --amount <AMOUNT> [--gas-limit 200000] [--block-confirmations 1] [--fee-token-address <FEE_TOKEN_ADDRESS>]
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { decodeEventLog, encodeAbiParameters } from "viem";
import { encodeV3Basic, EncodeV3Params } from "../scripts/CallEncodeExtraArgsOffchain.js";

export interface Example03TaskArguments {
  sourceRouter: string;
  destinationChainSelector: bigint;
  receiver: string;
  messageText: string;
  tokenToSend: string;
  amount: bigint;
  gasLimit: number;
  blockConfirmations: number;
  feeTokenAddress: string;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

function extractMessageIdFromReceipt(
  receipt: { logs: { topics: readonly `0x${string}`[]; data: `0x${string}` }[] },
  eventAbi: readonly unknown[]
): `0x${string}` | undefined {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: eventAbi,
        data: log.data,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
      });
      if (decoded.eventName === "CCIPMessageSent" && decoded.args && "messageId" in decoded.args) {
        return decoded.args.messageId as `0x${string}`;
      }
    } catch {
      /* skip */
    }
  }
  return undefined;
}

export default async function example03Action(
  taskArguments: Example03TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const args = taskArguments;
  const sourceRouter = toAddress(args.sourceRouter);
  const receiver = toAddress(args.receiver);
  const tokenToSend = toAddress(args.tokenToSend);
  const feeTokenAddress = toAddress(args.feeTokenAddress);
  const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

  if (sourceRouter === ZERO || args.destinationChainSelector === 0n || receiver === ZERO) {
    throw new Error("sourceRouter, destinationChainSelector, receiver required");
  }

  const [routerArtifact, erc20Artifact, onRampArtifact] = await Promise.all([
    hre.artifacts.readArtifact("Router"),
    hre.artifacts.readArtifact("ERC20"),
    hre.artifacts.readArtifact("OnRamp"),
  ]);

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  if (!publicClient) throw new Error("No public client");

  const chainId = publicClient.chain?.id ?? 0n;
  console.log("[INFO] Example03: Programmable token transfer (data + token) + Faster Than Finality (EOA sender)");
  console.log("[INFO] Source chain ID:", chainId.toString());
  console.log("[INFO] Source router:", sourceRouter);
  console.log("[INFO] Destination selector:", args.destinationChainSelector.toString());
  console.log("[INFO] Receiver:", receiver);
  console.log("[INFO] Message:", args.messageText);
  console.log("[INFO] Token:", tokenToSend);
  console.log("[INFO] Amount:", args.amount.toString());
  console.log("[INFO] Gas limit:", args.gasLimit);
  console.log("[INFO] Block confirmations:", args.blockConfirmations);
  console.log("[INFO] Fee token:", feeTokenAddress);
  console.log("[WARN] Executor may enforce a minimum block confirmation value and revert if too low.");
  console.log("[WARN] If requested confirmations exceed chain finality, default finality is used.");

  const params: EncodeV3Params = { gasLimit: args.gasLimit, blockConfirmations: args.blockConfirmations };
  const extraArgs = await encodeV3Basic(params);
  const tokenAmounts = [{ token: tokenToSend, amount: args.amount }];
  const receiverEncoded = encodeAbiParameters([{ type: "address" }], [receiver]) as `0x${string}`;
  const data = encodeAbiParameters([{ type: "string" }], [args.messageText]) as `0x${string}`;

  const ccipMessage = {
    receiver: receiverEncoded,
    data,
    tokenAmounts,
    extraArgs,
    feeToken: feeTokenAddress,
  };

  const fee = (await publicClient.readContract({
    address: sourceRouter,
    abi: routerArtifact.abi,
    functionName: "getFee",
    args: [args.destinationChainSelector, ccipMessage],
  })) as bigint;
  console.log("[INFO] Quoted fee:", fee.toString());

  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!walletClient?.account) throw new Error("No wallet client");

  const approveHash = await walletClient.writeContract({
    address: tokenToSend,
    abi: erc20Artifact.abi,
    functionName: "approve",
    args: [sourceRouter, args.amount],
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  const ccipSendParams = {
    address: sourceRouter,
    abi: routerArtifact.abi,
    functionName: "ccipSend" as const,
    args: [args.destinationChainSelector, ccipMessage] as const,
    account: walletClient.account,
  };

  let hash: `0x${string}`;
  if (feeTokenAddress === ZERO) {
    console.log("[INFO] Sending message, paying CCIP fee in native token");
    hash = await walletClient.writeContract({ ...ccipSendParams, value: fee });
  } else {
    console.log("[INFO] Sending message, paying CCIP fee in LINK");
    await walletClient.writeContract({
      address: feeTokenAddress,
      abi: erc20Artifact.abi,
      functionName: "approve",
      args: [sourceRouter, fee],
      account: walletClient.account,
    });
    hash = await walletClient.writeContract(ccipSendParams);
  }

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const messageId = extractMessageIdFromReceipt(receipt, onRampArtifact.abi);
  console.log("[RESULT] Monitor message status at https://ccip.chain.link using message ID:");
  if (messageId != null) {
    console.log(messageId);
  }
}
