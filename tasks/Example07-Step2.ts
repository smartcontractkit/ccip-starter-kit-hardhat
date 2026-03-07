/**
 * Example07 (CCT 02): Fund lock box liquidity.
 *
 * Command to run:
 *   npx hardhat example07-step2 --network <NETWORK_NAME> --token <TOKEN_ADDRESS> --lock-box <LOCK_BOX_ADDRESS> --amount <AMOUNT>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface Example07Step2TaskArguments {
  token: string;
  lockBox: string;
  amount: bigint;
}

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

export default async function example07Step2Action(
  taskArguments: Example07Step2TaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { token: tokenStr, lockBox: lockBoxStr, amount } = taskArguments;
  const token = toAddress(tokenStr);
  const lockBox = toAddress(lockBoxStr);
  const zero = "0x0000000000000000000000000000000000000000" as `0x${string}`;

  if (token === zero || lockBox === zero || amount <= 0n) {
    throw new Error("Set token, lockBox, amount (all required). Amount must be > 0.");
  }

  const erc20Artifact = await hre.artifacts.readArtifact("ERC20");

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!publicClient || !walletClient?.account) throw new Error("No public or wallet client");

  const chainId = await publicClient.getChainId();
  console.log("[INFO] Example07 (CCT 02): Fund lock box liquidity");
  console.log("[INFO] Source chain ID:", chainId);
  console.log("[INFO] Token:", token);
  console.log("[INFO] Lock box:", lockBox);
  console.log("[INFO] Amount:", amount.toString());

  const hash = await walletClient.writeContract({
    address: token,
    abi: erc20Artifact.abi,
    functionName: "transfer",
    args: [lockBox, amount],
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const lockBoxBalance = (await publicClient.readContract({
    address: token,
    abi: erc20Artifact.abi,
    functionName: "balanceOf",
    args: [lockBox],
  })) as bigint;

  console.log("[RESULT] Lock box funded. Current lock box balance:", lockBoxBalance.toString());
}
