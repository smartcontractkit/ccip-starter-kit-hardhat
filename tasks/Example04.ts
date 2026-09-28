/**
 * CCIP send via BasicMessageSender (token + message).
 *
 * Command to run:
 *   npx hardhat example04 --network <NETWORK_NAME> --basic-message-sender <BASIC_MESSAGE_SENDER> --source-router <SOURCE_ROUTER> --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> --receiver <RECEIVER> --message-text <MESSAGE_TEXT> --token-to-send <TOKEN_ADDRESS> --amount <AMOUNT> [--gas-limit 200000] [--block-confirmations 0] [--fee-token-address <FEE_TOKEN_ADDRESS>]
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { decodeEventLog, encodeAbiParameters } from "viem";
import { encodeV3Basic, EncodeV3Params } from "../scripts/CallEncodeExtraArgsOffchain.js";

export interface Example04TaskArguments {
  basicMessageSender: string;
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

export default async function example04Action(
  taskArguments: Example04TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const args = taskArguments;
  const basicMessageSender = toAddress(args.basicMessageSender);
  const sourceRouter = toAddress(args.sourceRouter);
  const receiver = toAddress(args.receiver);
  const tokenToSend = toAddress(args.tokenToSend);
  const feeTokenAddress = toAddress(args.feeTokenAddress);
  const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

  if (sourceRouter === ZERO || args.destinationChainSelector === 0n || receiver === ZERO) {
    throw new Error("sourceRouter, destinationChainSelector, receiver required");
  }

  const [routerArtifact, erc20Artifact, onRampArtifact, basicMessageSenderArtifact] = await Promise.all([
    hre.artifacts.readArtifact("Router"),
    hre.artifacts.readArtifact("ERC20"),
    hre.artifacts.readArtifact("OnRamp"),
    hre.artifacts.readArtifact("BasicMessageSender"),
  ]);

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  if (!publicClient) throw new Error("No public client");

  const chainId = publicClient.chain?.id ?? 0n;
  const blockConfirmationsLabel =
    args.blockConfirmations === 0 ? "0 (default finality)" : args.blockConfirmations.toString();
  console.log(
    "[INFO] Example04: Programmable token transfer (data + token) + default finality (sender contract)"
  );
  console.log("[INFO] Source chain ID:", chainId.toString());
  console.log("[INFO] Sender contract:", basicMessageSender);
  console.log("[INFO] Source router:", sourceRouter);
  console.log("[INFO] Destination selector:", args.destinationChainSelector.toString());
  console.log("[INFO] Receiver:", receiver);
  console.log("[INFO] Message:", args.messageText);
  console.log("[INFO] Token:", tokenToSend);
  console.log("[INFO] Amount:", args.amount.toString());
  console.log("[INFO] Gas limit:", args.gasLimit);
  console.log("[INFO] Block confirmations:", blockConfirmationsLabel);
  console.log("[INFO] Fee token:", feeTokenAddress === ZERO ? "native" : feeTokenAddress);
  console.log("[INFO] This example funds sender contract with exact quoted fee before send.");

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
  console.log("[INFO] Funding sender contract with exact quoted fee (no refund pattern in this example)");

  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!walletClient?.account) throw new Error("No wallet client");

  const approveHash = await walletClient.writeContract({
    address: tokenToSend,
    abi: erc20Artifact.abi,
    functionName: "approve",
    args: [basicMessageSender, args.amount],
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  if (feeTokenAddress === ZERO) {
    const transferHash = await walletClient.sendTransaction({
      to: basicMessageSender,
      value: fee,
      account: walletClient.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: transferHash });
  }

  const hash = await walletClient.writeContract({
    address: basicMessageSender,
    abi: basicMessageSenderArtifact.abi,
    functionName: "send",
    args: [args.destinationChainSelector, receiver, data, tokenAmounts, extraArgs, feeTokenAddress],
    account: walletClient.account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const messageId = extractMessageIdFromReceipt(receipt, onRampArtifact.abi);
  console.log("[RESULT] Monitor message status at https://ccip.chain.link using message ID:");
  if (messageId != null) {
    console.log(messageId);
  }
}
