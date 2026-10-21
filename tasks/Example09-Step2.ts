/**
 * Example09 (CCT 04): Set the threshold amount for additional CCVs on AdvancedPoolHooks.
 *
 * Command to run:
 *   npx hardhat example09-step2 --network <NETWORK_NAME> --advanced-pool-hook <ADVANCED_POOL_HOOK_ADDRESS> --threshold-amount <THRESHOLD_AMOUNT>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface Example09Step2TaskArguments {
  advancedPoolHook: string;
  thresholdAmount: bigint;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

export default async function example09Step2Action(
  taskArguments: Example09Step2TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const advancedPoolHook = toAddress(taskArguments.advancedPoolHook);
  const { thresholdAmount } = taskArguments;

  if (advancedPoolHook === ZERO) throw new Error("advancedPoolHook cannot be zero");

  const hookArtifact = await hre.artifacts.readArtifact("AdvancedPoolHooks");

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!publicClient || !walletClient?.account) throw new Error("No public or wallet client");

  const chainId = await publicClient.getChainId();
  console.log("[INFO] Example09 (CCT 04): Set threshold amount for additional CCVs");
  console.log("[INFO] Source chain ID:", chainId);
  console.log("[INFO] AdvancedPoolHooks:", advancedPoolHook);
  console.log("[INFO] New threshold amount:", thresholdAmount.toString());

  const hash = await walletClient.writeContract({
    address: advancedPoolHook,
    abi: hookArtifact.abi,
    functionName: "setThresholdAmount",
    args: [thresholdAmount],
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const current = (await publicClient.readContract({
    address: advancedPoolHook,
    abi: hookArtifact.abi,
    functionName: "getThresholdAmount",
  })) as bigint;

  console.log("[RESULT] Threshold amount is now:", current.toString());
  console.log("[WARN] Threshold CCVs are required for transfers at or above the threshold amount.");
}
