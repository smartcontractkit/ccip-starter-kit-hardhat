/**
 * Example09 (CCT 04): Set pool-based CCV requirements on AdvancedPoolHooks for one remote chain.
 * Pass empty lists to clear the config for that lane.
 *
 * Command to run:
 *   npx hardhat example09-step1 --network <NETWORK_NAME> --advanced-pool-hook <ADVANCED_POOL_HOOK_ADDRESS> --remote-chain-selector <REMOTE_CHAIN_SELECTOR> [--outbound-ccvs <COMMA_SEPARATED_ADDRESSES>] [--threshold-outbound-ccvs <COMMA_SEPARATED_ADDRESSES>] [--inbound-ccvs <COMMA_SEPARATED_ADDRESSES>] [--threshold-inbound-ccvs <COMMA_SEPARATED_ADDRESSES>]
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface Example09Step1TaskArguments {
  advancedPoolHook: string;
  remoteChainSelector: bigint;
  outboundCcvs: string;
  thresholdOutboundCcvs: string;
  inboundCcvs: string;
  thresholdInboundCcvs: string;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

function parseAddressList(s: string): `0x${string}`[] {
  if (!s || s.trim() === "") return [];
  return s.split(",").map((a) => toAddress(a.trim()));
}

export default async function example09Step1Action(
  taskArguments: Example09Step1TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const advancedPoolHook = toAddress(taskArguments.advancedPoolHook);
  const { remoteChainSelector } = taskArguments;
  const outboundCCVs = parseAddressList(taskArguments.outboundCcvs);
  const thresholdOutboundCCVs = parseAddressList(taskArguments.thresholdOutboundCcvs);
  const inboundCCVs = parseAddressList(taskArguments.inboundCcvs);
  const thresholdInboundCCVs = parseAddressList(taskArguments.thresholdInboundCcvs);

  if (advancedPoolHook === ZERO) throw new Error("advancedPoolHook cannot be zero");
  if (remoteChainSelector === 0n) throw new Error("remoteChainSelector cannot be zero");

  const hookArtifact = await hre.artifacts.readArtifact("AdvancedPoolHooks");

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!publicClient || !walletClient?.account) throw new Error("No public or wallet client");

  const chainId = await publicClient.getChainId();
  console.log("[INFO] Example09 (CCT 04): Set pool-based CCV requirements on AdvancedPoolHooks");
  console.log("[INFO] Source chain ID:", chainId);
  console.log("[INFO] AdvancedPoolHooks:", advancedPoolHook);
  console.log("[INFO] Remote chain selector:", remoteChainSelector.toString());
  for (const [label, ccvs] of [
    ["Outbound", outboundCCVs],
    ["Threshold outbound", thresholdOutboundCCVs],
    ["Inbound", inboundCCVs],
    ["Threshold inbound", thresholdInboundCCVs],
  ] as const) {
    console.log(`[INFO] ${label} CCVs count:`, ccvs.length);
    for (const ccv of ccvs) console.log(`[INFO] ${label} CCV:`, ccv);
  }

  const hash = await walletClient.writeContract({
    address: advancedPoolHook,
    abi: hookArtifact.abi,
    functionName: "applyCCVConfigUpdates",
    args: [
      [
        {
          remoteChainSelector,
          outboundCCVs,
          thresholdOutboundCCVs,
          inboundCCVs,
          thresholdInboundCCVs,
        },
      ],
    ],
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const storedConfig = (await publicClient.readContract({
    address: advancedPoolHook,
    abi: hookArtifact.abi,
    functionName: "getCCVConfig",
    args: [remoteChainSelector],
  })) as {
    outboundCCVs: readonly `0x${string}`[];
    thresholdOutboundCCVs: readonly `0x${string}`[];
    inboundCCVs: readonly `0x${string}`[];
    thresholdInboundCCVs: readonly `0x${string}`[];
  };

  console.log("[RESULT] CCV config stored for remote chain selector:", remoteChainSelector.toString());
  console.log("[RESULT] Outbound CCVs stored:", storedConfig.outboundCCVs.length);
  console.log("[RESULT] Threshold outbound CCVs stored:", storedConfig.thresholdOutboundCCVs.length);
  console.log("[RESULT] Inbound CCVs stored:", storedConfig.inboundCCVs.length);
  console.log("[RESULT] Threshold inbound CCVs stored:", storedConfig.thresholdInboundCCVs.length);
  console.log("[WARN] A pool-required CCV must exist at the same address on both chains.");
  console.log("[WARN] Re-run this task with empty lists to clear the config for this lane.");
}
