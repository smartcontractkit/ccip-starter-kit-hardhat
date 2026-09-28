/**
 * Read ERC20.totalSupply()(uint256).
 *
 * Command to run:
 *   npx hardhat erc20-total-supply --network <NETWORK_NAME> --token <TOKEN_ADDRESS>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface Erc20TotalSupplyTaskArguments {
  token: string;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export default async function erc20TotalSupplyAction(
  taskArguments: Erc20TotalSupplyTaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { token: tokenStr } = taskArguments;
  const token = toAddress(tokenStr);

  if (!tokenStr?.trim() || token === ZERO) {
    throw new Error("token (address) is required.");
  }

  const artifact = await hre.artifacts.readArtifact("ERC20");
  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  if (!publicClient) throw new Error("No public client");

  const totalSupply = (await publicClient.readContract({
    address: token,
    abi: artifact.abi,
    functionName: "totalSupply",
  })) as bigint;

  console.log(totalSupply.toString());
}
