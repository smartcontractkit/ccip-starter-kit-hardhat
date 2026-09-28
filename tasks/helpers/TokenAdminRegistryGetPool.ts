/**
 * Read ITokenAdminRegistry.getPool(address)(address).
 *
 * Command to run:
 *   npx hardhat token-admin-registry-get-pool --network <NETWORK_NAME> --registry <TOKEN_ADMIN_REGISTRY> --token <TOKEN_ADDRESS>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface TokenAdminRegistryGetPoolTaskArguments {
  registry: string;
  token: string;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export default async function tokenAdminRegistryGetPoolAction(
  taskArguments: TokenAdminRegistryGetPoolTaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { registry: registryStr, token: tokenStr } = taskArguments;
  const registry = toAddress(registryStr);
  const token = toAddress(tokenStr);

  if (!registryStr?.trim() || registry === ZERO || !tokenStr?.trim() || token === ZERO) {
    throw new Error("registry and token (addresses) are required.");
  }

  const artifact = await hre.artifacts.readArtifact("ITokenAdminRegistry");
  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  if (!publicClient) throw new Error("No public client");

  const pool = (await publicClient.readContract({
    address: registry,
    abi: artifact.abi,
    functionName: "getPool",
    args: [token],
  })) as `0x${string}`;

  console.log(pool);
}
