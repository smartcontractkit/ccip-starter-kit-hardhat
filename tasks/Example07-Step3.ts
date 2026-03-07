/**
 * Example07-Step3: CCIP token transfer (same schema as Example06-Step2).
 *
 * Command to run:
 *   npx hardhat example07-step3 --network <NETWORK_NAME> --source-router <SOURCE_ROUTER> --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> --receiver <RECEIVER> --token-to-send <TOKEN_ADDRESS> --amount <AMOUNT> [--gas-limit 200000] [--block-confirmations 0] [--fee-token-address <FEE_TOKEN_ADDRESS>]
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { decodeEventLog, encodeAbiParameters } from "viem";
import { encodeV3Basic, EncodeV3Params } from "../scripts/CallEncodeExtraArgsOffchain.js";

export interface Example07Step3TaskArguments {
  sourceRouter: string;
  destinationChainSelector: bigint;
  receiver: string;
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

export default async function example07Step3Action(
  taskArguments: Example07Step3TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const args = taskArguments;
  const sourceRouter = toAddress(args.sourceRouter);
  const receiver = toAddress(args.receiver);
  const tokenToSend = toAddress(args.tokenToSend);
  const feeTokenAddress = toAddress(args.feeTokenAddress);
  const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

  if (sourceRouter === ZERO || args.destinationChainSelector === 0n || receiver === ZERO || tokenToSend === ZERO || args.amount === 0n) {
    throw new Error("sourceRouter, destinationChainSelector, receiver, tokenToSend, amount required");
  }

  const [routerArtifact, erc20Artifact, onRampArtifact] = await Promise.all([
    hre.artifacts.readArtifact("Router"),
    hre.artifacts.readArtifact("ERC20"),
    hre.artifacts.readArtifact("OnRamp"),
  ]);

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  if (!publicClient) throw new Error("No public client");

  const params: EncodeV3Params = { gasLimit: args.gasLimit, blockConfirmations: args.blockConfirmations };
  const extraArgs = await encodeV3Basic(params);
  const tokenAmounts = [{ token: tokenToSend, amount: args.amount }];
  const receiverEncoded = encodeAbiParameters([{ type: "address" }], [receiver]) as `0x${string}`;

  const ccipMessage = {
    receiver: receiverEncoded,
    data: "0x" as `0x${string}`,
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
  console.log("[INFO] Approved token to router");

  const ccipSendParams = {
    address: sourceRouter,
    abi: routerArtifact.abi,
    functionName: "ccipSend" as const,
    args: [args.destinationChainSelector, ccipMessage] as const,
    account: walletClient.account,
  };

  let hash: `0x${string}`;
  if (feeTokenAddress === ZERO) {
    hash = await walletClient.writeContract({ ...ccipSendParams, value: fee });
  } else {
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
  console.log("[RESULT] Tx hash:", hash);
  if (messageId != null) console.log("[RESULT] messageId:", messageId);
  console.log("[RESULT] Monitor at https://ccip.chain.link");
}
