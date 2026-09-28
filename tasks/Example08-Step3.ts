/**
 * Example08 (CCT 03): Update AdvancedPoolHooks allowlist.
 *
 * Command to run:
 *   npx hardhat example08-step3 --network <NETWORK_NAME> --advanced-pool-hook <ADVANCED_POOL_HOOK_ADDRESS> [--removes <COMMA_SEPARATED_ADDRESSES>] [--adds <COMMA_SEPARATED_ADDRESSES>]
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface Example08Step3TaskArguments {
  advancedPoolHook: string;
  removes: string;
  adds: string;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

function parseAddressList(s: string): `0x${string}`[] {
  if (!s || s.trim() === "") return [];
  return s.split(",").map((a) => toAddress(a.trim()));
}

export default async function example08Step3Action(
  taskArguments: Example08Step3TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { advancedPoolHook: hookStr, removes: removesStr, adds: addsStr } = taskArguments;
  const advancedPoolHook = toAddress(hookStr);
  const removes = parseAddressList(removesStr) as readonly `0x${string}`[];
  const adds = parseAddressList(addsStr) as readonly `0x${string}`[];

  if (advancedPoolHook === ZERO) {
    throw new Error("advancedPoolHook is required");
  }

  const hookArtifact = await hre.artifacts.readArtifact("AdvancedPoolHooks");
  const hookAbi = hookArtifact.abi;

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!publicClient || !walletClient?.account) throw new Error("No public or wallet client");

  const chainId = await publicClient.getChainId();
  console.log("[INFO] Example08 (CCT 03): Update AdvancedPoolHooks allowlist");
  console.log("[INFO] Source chain ID:", chainId);
  console.log("[INFO] AdvancedPoolHooks:", advancedPoolHook);
  console.log("[INFO] Removes count:", removes.length);
  console.log("[INFO] Adds count:", adds.length);

  const allowListEnabled = (await publicClient.readContract({
    address: advancedPoolHook,
    abi: hookAbi,
    functionName: "getAllowListEnabled",
  })) as boolean;
  if (!allowListEnabled) {
    throw new Error("Allowlist is disabled on hook. Cannot apply updates.");
  }

  const hash = await walletClient.writeContract({
    address: advancedPoolHook,
    abi: hookAbi,
    functionName: "applyAllowListUpdates",
    args: [removes, adds],
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const currentAllowList = (await publicClient.readContract({
    address: advancedPoolHook,
    abi: hookAbi,
    functionName: "getAllowList",
  })) as readonly `0x${string}`[];

  console.log("[RESULT] Allowlist updated. Current entries:", currentAllowList.length);
  for (let i = 0; i < currentAllowList.length; i++) {
    console.log("[RESULT] Allowlist entry:", currentAllowList[i]);
  }
}
