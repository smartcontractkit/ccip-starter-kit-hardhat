/**
 * Read AdvancedPoolHooks.getAllowList() (address[]).
 *
 * Command to run:
 *   npx hardhat get-allow-list --network <NETWORK_NAME> --advanced-pool-hook <ADVANCED_POOL_HOOK_ADDRESS>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface GetAllowListTaskArguments {
  advancedPoolHook: string;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

export default async function getAllowListAction(
  taskArguments: GetAllowListTaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { advancedPoolHook: advancedPoolHookStr } = taskArguments;
  const address = toAddress(advancedPoolHookStr);

  if (!advancedPoolHookStr?.trim() || !address.startsWith("0x")) {
    throw new Error("advanced-pool-hook (AdvancedPoolHooks contract address) is required.");
  }

  const artifact = await hre.artifacts.readArtifact("AdvancedPoolHooks");
  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  if (!publicClient) throw new Error("No public client");

  const list = (await publicClient.readContract({
    address,
    abi: artifact.abi,
    functionName: "getAllowList",
  })) as readonly `0x${string}`[];

  console.log(JSON.stringify([...list], null, 2));
}
