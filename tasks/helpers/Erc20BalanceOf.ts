/**
 * Read ERC20.balanceOf(address)(uint256).
 *
 * Command to run:
 *   npx hardhat erc20-balance-of --network <NETWORK_NAME> --token <TOKEN_ADDRESS> --account <ACCOUNT_ADDRESS>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface Erc20BalanceOfTaskArguments {
  token: string;
  account: string;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export default async function erc20BalanceOfAction(
  taskArguments: Erc20BalanceOfTaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { token: tokenStr, account: accountStr } = taskArguments;
  const token = toAddress(tokenStr);
  const account = toAddress(accountStr);

  if (!tokenStr?.trim() || token === ZERO || !accountStr?.trim() || account === ZERO) {
    throw new Error("token and account (addresses) are required.");
  }

  const artifact = await hre.artifacts.readArtifact("ERC20");
  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  if (!publicClient) throw new Error("No public client");

  const balance = (await publicClient.readContract({
    address: token,
    abi: artifact.abi,
    functionName: "balanceOf",
    args: [account],
  })) as bigint;

  console.log(balance.toString());
}
