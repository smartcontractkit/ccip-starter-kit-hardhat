/**
 * Example10 (CCT 05): Detach the policy engine from AdvancedPoolHooks.
 *
 * Command to run:
 *   npx hardhat example10-step2 --network <NETWORK_NAME> --advanced-pool-hook <ADVANCED_POOL_HOOK_ADDRESS>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface Example10Step2TaskArguments {
  advancedPoolHook: string;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

export default async function example10Step2Action(
  taskArguments: Example10Step2TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const advancedPoolHook = toAddress(taskArguments.advancedPoolHook);

  if (advancedPoolHook === ZERO) throw new Error("advancedPoolHook cannot be zero");

  const hookArtifact = await hre.artifacts.readArtifact("AdvancedPoolHooks");

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!publicClient || !walletClient?.account) throw new Error("No public or wallet client");

  const chainId = await publicClient.getChainId();
  console.log("[INFO] Example10 (CCT 05): Detach the policy engine from AdvancedPoolHooks");
  console.log("[INFO] Source chain ID:", chainId);
  console.log("[INFO] AdvancedPoolHooks:", advancedPoolHook);

  const hash = await walletClient.writeContract({
    address: advancedPoolHook,
    abi: hookArtifact.abi,
    functionName: "setPolicyEngine",
    args: [ZERO],
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const current = await publicClient.readContract({
    address: advancedPoolHook,
    abi: hookArtifact.abi,
    functionName: "getPolicyEngine",
  });
  console.log("[RESULT] Policy engine is now:", current);
}
