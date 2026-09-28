/**
 * Read BasicMessageReceiver.latestSourceChainSelector() (uint64).
 *
 * Command to run:
 *   npx hardhat basic-message-receiver-latest-source-chain-selector --network <NETWORK_NAME> --basic-message-receiver <BASIC_MESSAGE_RECEIVER_ADDRESS>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface BasicMessageReceiverLatestSourceChainSelectorTaskArguments {
  basicMessageReceiver: string;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export default async function basicMessageReceiverLatestSourceChainSelectorAction(
  taskArguments: BasicMessageReceiverLatestSourceChainSelectorTaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { basicMessageReceiver: receiverStr } = taskArguments;
  const address = toAddress(receiverStr);

  if (!receiverStr?.trim() || address === ZERO) {
    throw new Error("basic-message-receiver (deployed BasicMessageReceiver contract address) is required.");
  }

  const artifact = await hre.artifacts.readArtifact("BasicMessageReceiver");
  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  if (!publicClient) throw new Error("No public client");

  const latestSourceChainSelector = (await publicClient.readContract({
    address,
    abi: artifact.abi,
    functionName: "latestSourceChainSelector",
  })) as bigint;

  console.log(latestSourceChainSelector.toString());
}
