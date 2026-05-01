/**
 * Set BasicMessageReceiverWithCCVs.setMinBlockDepth(sourceChainSelector, minBlockDepth) on the destination chain.
 *
 * Command to run:
 *   npx hardhat set-basic-message-receiver-with-ccvs-min-block-depth --network <NETWORK_NAME> --receiver <RECEIVER> --source-chain-selector <SOURCE_CHAIN_SELECTOR> --min-block-depth <MIN_BLOCK_DEPTH>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import type { Abi } from "viem";

export interface SetBasicMessageReceiverWithCCVsMinBlockDepthTaskArguments {
  receiver: string;
  sourceChainSelector: bigint;
  minBlockDepth: number;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export default async function setBasicMessageReceiverWithCCVsMinBlockDepthAction(
  taskArguments: SetBasicMessageReceiverWithCCVsMinBlockDepthTaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { receiver: receiverStr, sourceChainSelector, minBlockDepth } = taskArguments;
  const receiver = toAddress(receiverStr);

  if (!receiverStr?.trim() || receiver === ZERO) {
    throw new Error("receiver (BasicMessageReceiverWithCCVs contract address) is required.");
  }
  if (sourceChainSelector === 0n) {
    throw new Error("sourceChainSelector cannot be zero.");
  }
  if (minBlockDepth < 0 || minBlockDepth > 65535) {
    throw new Error("minBlockDepth must be between 0 and 65535 (uint16).");
  }

  const artifact = await hre.artifacts.readArtifact("BasicMessageReceiverWithCCVs");
  const connection = await hre.network.connect();
  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!walletClient?.account) throw new Error("No wallet client");

  const hash = await walletClient.writeContract({
    address: receiver,
    abi: artifact.abi as Abi,
    functionName: "setMinBlockDepth",
    args: [sourceChainSelector, minBlockDepth],
    account: walletClient.account,
  });

  console.log("[RESULT] BasicMessageReceiverWithCCVs source chain selector:", sourceChainSelector.toString());
  console.log("[RESULT] BasicMessageReceiverWithCCVs min block depth:", minBlockDepth);
  console.log("[RESULT] Transaction hash:", hash);
}
