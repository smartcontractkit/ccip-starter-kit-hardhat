/**
 * Read BasicMessageReceiver.latestMessage() (bytes). Decodes to string when possible.
 *
 * Command to run:
 *   npx hardhat basic-message-receiver-latest-message --network <NETWORK_NAME> --basic-message-receiver <BASIC_MESSAGE_RECEIVER_ADDRESS>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { decodeAbiParameters } from "viem";

export interface BasicMessageReceiverLatestMessageTaskArguments {
  basicMessageReceiver: string;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export default async function basicMessageReceiverLatestMessageAction(
  taskArguments: BasicMessageReceiverLatestMessageTaskArguments,
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

  const latestMessage = (await publicClient.readContract({
    address,
    abi: artifact.abi,
    functionName: "latestMessage",
  })) as `0x${string}`;

  if (latestMessage === "0x" || latestMessage.length <= 2) {
    console.log("(empty)");
    return;
  }

  try {
    const [decoded] = decodeAbiParameters([{ type: "string" }], latestMessage);
    console.log(decoded);
  } catch {
    console.log(latestMessage);
  }
}
