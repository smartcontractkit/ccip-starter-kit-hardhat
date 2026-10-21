/**
 * Example10 (CCT 05): Attach a policy engine to AdvancedPoolHooks.
 *
 * Command to run:
 *   npx hardhat example10-step1 --network <NETWORK_NAME> --advanced-pool-hook <ADVANCED_POOL_HOOK_ADDRESS> --policy-engine <POLICY_ENGINE_ADDRESS>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface Example10Step1TaskArguments {
  advancedPoolHook: string;
  policyEngine: string;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

export default async function example10Step1Action(
  taskArguments: Example10Step1TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const advancedPoolHook = toAddress(taskArguments.advancedPoolHook);
  const policyEngine = toAddress(taskArguments.policyEngine);

  if (advancedPoolHook === ZERO) throw new Error("advancedPoolHook cannot be zero");
  if (policyEngine === ZERO) throw new Error("policyEngine cannot be zero");

  const hookArtifact = await hre.artifacts.readArtifact("AdvancedPoolHooks");

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!publicClient || !walletClient?.account) throw new Error("No public or wallet client");

  const chainId = await publicClient.getChainId();
  console.log("[INFO] Example10 (CCT 05): Attach a policy engine to AdvancedPoolHooks");
  console.log("[INFO] Source chain ID:", chainId);
  console.log("[INFO] AdvancedPoolHooks:", advancedPoolHook);
  console.log("[INFO] Policy engine:", policyEngine);

  const hash = await walletClient.writeContract({
    address: advancedPoolHook,
    abi: hookArtifact.abi,
    functionName: "setPolicyEngine",
    args: [policyEngine],
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const attached = await publicClient.readContract({
    address: advancedPoolHook,
    abi: hookArtifact.abi,
    functionName: "getPolicyEngine",
  });
  console.log("[RESULT] Policy engine attached:", attached);
  console.log("[WARN] The engine must accept the hook as an attached target (see IPolicyEngine.attach).");
}
