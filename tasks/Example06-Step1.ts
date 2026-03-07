/**
 * Example06 (CCT 01): Configure BurnMint pool remote lane.
 *
 * Command to run:
 *   npx hardhat example06-step1 --network <NETWORK_NAME> --local-pool <LOCAL_POOL> --remote-chain-selector <REMOTE_CHAIN_SELECTOR> --remote-token <REMOTE_TOKEN> --remote-pool <REMOTE_POOL>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { decodeAbiParameters, encodeAbiParameters } from "viem";

export interface Example06Step1TaskArguments {
  localPool: string;
  remoteChainSelector: bigint;
  remoteToken: string;
  remotePool: string;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

export default async function example06Step1Action(
  taskArguments: Example06Step1TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { localPool: localPoolStr, remoteChainSelector, remoteToken: remoteTokenStr, remotePool: remotePoolStr } = taskArguments;
  const localPool = toAddress(localPoolStr);
  const remoteToken = toAddress(remoteTokenStr);
  const remotePool = toAddress(remotePoolStr);
  const zero = "0x0000000000000000000000000000000000000000" as `0x${string}`;

  if (localPool === zero || remoteChainSelector === 0n || remoteToken === zero || remotePool === zero) {
    throw new Error("Set localPool, remoteChainSelector, remoteToken, remotePool (all required)");
  }

  const poolArtifact = await hre.artifacts.readArtifact("BurnMintTokenPool");
  const poolAbi = poolArtifact.abi;

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!publicClient || !walletClient?.account) throw new Error("No public or wallet client");

  const chainId = await publicClient.getChainId();
  console.log("[INFO] Example06 (CCT 01): Configure BurnMint pool remote lane");
  console.log("[INFO] Source chain ID:", chainId.toString());
  console.log("[INFO] Local pool:", localPool);
  console.log("[INFO] Remote chain selector:", remoteChainSelector.toString());
  console.log("[INFO] Remote token:", remoteToken);
  console.log("[INFO] Remote pool:", remotePool);

  const remotePoolEncoded = encodeAbiParameters([{ type: "address" }], [remotePool]) as `0x${string}`;
  const remoteTokenEncoded = encodeAbiParameters([{ type: "address" }], [remoteToken]) as `0x${string}`;
  const disabledRateLimiter = { isEnabled: false, capacity: 0n, rate: 0n };
  const chainUpdates = [
    {
      remoteChainSelector,
      remotePoolAddresses: [remotePoolEncoded],
      remoteTokenAddress: remoteTokenEncoded,
      outboundRateLimiterConfig: disabledRateLimiter,
      inboundRateLimiterConfig: disabledRateLimiter,
    },
  ];

  const chainAlreadyConfigured = await publicClient.readContract({
    address: localPool,
    abi: poolAbi,
    functionName: "isSupportedChain",
    args: [remoteChainSelector],
  });
  const remoteChainSelectorsToRemove: bigint[] = chainAlreadyConfigured ? [remoteChainSelector] : [];
  if (chainAlreadyConfigured) {
    console.log("[WARN] Existing config detected for this remote chain selector; replacing it.");
  } else {
    console.log("[INFO] No existing config for this remote chain selector; adding new one.");
  }

  const hash = await walletClient.writeContract({
    address: localPool,
    abi: poolAbi,
    functionName: "applyChainUpdates",
    args: [remoteChainSelectorsToRemove, chainUpdates],
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const configuredRemoteTokenBytes = await publicClient.readContract({
    address: localPool,
    abi: poolAbi,
    functionName: "getRemoteToken",
    args: [remoteChainSelector],
  });
  const configuredRemotePools = await publicClient.readContract({
    address: localPool,
    abi: poolAbi,
    functionName: "getRemotePools",
    args: [remoteChainSelector],
  });
  const [configuredRemoteToken] = decodeAbiParameters([{ type: "address" }], configuredRemoteTokenBytes);
  const [configuredRemotePool] = decodeAbiParameters([{ type: "address" }], configuredRemotePools[0] as `0x${string}`);

  console.log("[RESULT] Remote token configured on pool:", configuredRemoteToken);
  console.log("[RESULT] Remote pool configured on pool:", configuredRemotePool);
  console.log("[RESULT] BurnMint pool lane setup completed for remote chain selector:", remoteChainSelector.toString());
}
