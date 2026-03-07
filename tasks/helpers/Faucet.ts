/**
 * Mints 1 CCIP-BnM token to the signer by calling drip(to) on the token contract.
 *
 * Command to run:
 *   npx hardhat faucet --network <NETWORK_NAME> --ccip-bnm <CCIP_BNM_TOKEN_ADDRESS>
 */

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

export interface FaucetTaskArguments {
  ccipBnm: string;
}

const DRIP_ABI = [
  {
    name: "drip",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [],
  },
] as const;

function toAddress(s: string): `0x${string}` {
  return (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

export default async function faucetAction(
  taskArguments: FaucetTaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { ccipBnm: ccipBnmStr } = taskArguments;
  const ccipBnm = toAddress(ccipBnmStr);

  if (!ccipBnmStr?.trim() || ccipBnm === ZERO) {
    throw new Error("ccip-bnm (CCIP-BnM token address with drip) is required.");
  }

  const { viem } = await hre.network.connect();
  const walletClient = (await viem.getWalletClients())[0];
  if (!walletClient?.account) {
    throw new Error("No wallet client / account available");
  }

  const to = walletClient.account.address;
  console.log("Minting 1 CCIP-BnM token (", ccipBnm, ") to address:", to);

  const hash = await walletClient.writeContract({
    address: ccipBnm,
    abi: DRIP_ABI,
    functionName: "drip",
    args: [to],
    account: walletClient.account,
  });

  const publicClient = await viem.getPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error("Transaction failed");
  }

  console.log("Drip tx hash:", hash);
}
