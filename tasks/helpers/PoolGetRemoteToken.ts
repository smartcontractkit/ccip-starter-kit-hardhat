/**
 * Read BurnMintTokenPool.getRemoteToken(uint64)(bytes). Decodes bytes as address for readable output.
 *
 * Command to run:
 *   npx hardhat pool-get-remote-token --network <NETWORK_NAME> --pool <POOL_ADDRESS> --chain-selector <REMOTE_CHAIN_SELECTOR>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { decodeAbiParameters } from "viem";

export interface PoolGetRemoteTokenTaskArguments {
  pool: string;
  chainSelector: bigint;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export default async function poolGetRemoteTokenAction(
  taskArguments: PoolGetRemoteTokenTaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { pool: poolStr, chainSelector } = taskArguments;
  const pool = toAddress(poolStr);

  if (!poolStr?.trim() || pool === ZERO || chainSelector === 0n) {
    throw new Error("pool and chain-selector are required.");
  }

  const artifact = await hre.artifacts.readArtifact("BurnMintTokenPool");
  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  if (!publicClient) throw new Error("No public client");

  const remoteTokenBytes = (await publicClient.readContract({
    address: pool,
    abi: artifact.abi,
    functionName: "getRemoteToken",
    args: [chainSelector],
  })) as `0x${string}`;

  if (remoteTokenBytes === "0x" || remoteTokenBytes.length <= 2) {
    console.log("(none)");
    return;
  }
  const [decoded] = decodeAbiParameters([{ type: "address" }], remoteTokenBytes);
  console.log(decoded);
}
