/**
 * Read Executor.getAllowedFinalityConfig() (bytes4, FinalityCodec). Use when tuning Faster Than Finality vs default finality.
 *
 * Command to run:
 *   npx hardhat executor-allowed-finality-config --network <NETWORK_NAME> --executor <EXECUTOR_ADDRESS>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface ExecutorAllowedFinalityConfigTaskArguments {
  executor: string;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export default async function executorAllowedFinalityConfigAction(
  taskArguments: ExecutorAllowedFinalityConfigTaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { executor: executorStr } = taskArguments;
  const executor = toAddress(executorStr);

  if (!executorStr?.trim() || executor === ZERO) {
    throw new Error("executor (Executor contract address) is required.");
  }

  const artifact = await hre.artifacts.readArtifact("Executor");
  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  if (!publicClient) throw new Error("No public client");

  const allowedFinalityConfig = (await publicClient.readContract({
    address: executor,
    abi: artifact.abi,
    functionName: "getAllowedFinalityConfig",
  })) as `0x${string}`;

  console.log("Allowed finality config (bytes4)", allowedFinalityConfig);
}
