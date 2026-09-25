/** Opt an Example 06 pool into depth-based Faster Than Finality. */
import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { isAddress, parseAbi } from "viem";

export interface PoolFinalityArguments {
  localPool: string;
  minBlockDepth: number;
}

const poolAbi = parseAbi([
  "function getAllowedFinalityConfig() view returns (bytes4)",
  "function setAllowedFinalityConfig(bytes4 allowedFinalityConfig)",
]);

export default async function setPoolFinality(
  { localPool, minBlockDepth }: PoolFinalityArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  if (!isAddress(localPool) || /^0x0{40}$/i.test(localPool)) throw new Error("localPool must be a nonzero address");
  if (!Number.isInteger(minBlockDepth) || minBlockDepth < 0 || minBlockDepth > 65535) {
    throw new Error("minBlockDepth must be a uint16 (0 disables FTF)");
  }

  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  const walletClient = (await connection.viem.getWalletClients())[0];
  if (!walletClient?.account) throw new Error("No wallet client");
  const pool = localPool as `0x${string}`;
  const allowedFinality = `0x${minBlockDepth.toString(16).padStart(8, "0")}` as `0x${string}`;

  console.log("[INFO] Current pool allowed finality:", await publicClient.readContract({
    address: pool, abi: poolAbi, functionName: "getAllowedFinalityConfig",
  }));
  const hash = await walletClient.writeContract({
    address: pool, abi: poolAbi, functionName: "setAllowedFinalityConfig",
    args: [allowedFinality], account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("[RESULT] Pool allowed finality:", await publicClient.readContract({
    address: pool, abi: poolAbi, functionName: "getAllowedFinalityConfig",
  }));
  console.log("[RESULT] Transaction hash:", hash);
}
