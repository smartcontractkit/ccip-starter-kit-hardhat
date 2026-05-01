/**
 * Hardhat script: deploy EncodeExtraArgsOffchain and call its functions on the local Hardhat network.
 * Always uses the default (local simulated) network, ignoring --network.
 *
 * To connect to a different network in the same script:
 *   1. Keep the connection in a variable: const connection = await network.connect("default");
 *   2. When done, release it: await connection.close();
 *   3. Connect to another: const connection2 = await network.connect("sepolia");
 *   Each NetworkConnection has close(): Promise<void> to release the underlying provider/sockets.
 *
 * Run: npx hardhat run scripts/CallEncodeExtraArgsOffchain.ts
 */


/*
* TODO: Add helper functions that call each of the encode functions and return the bytes.
        Find a way to do this by selecting from artifact functions/abi instead of hard coding helpers for each version. 
        Ideally, any new versions can be added by modifying  contracts/utils/EncodeExtraArgsOffchain.sol only
*/

import type { Abi } from "viem";
import { network } from "hardhat";

export async function extraArgsContract() {
  // Force local Hardhat network (default in-process simulated chain)
  const connection = await network.connect("default");
  const publicClient = await connection.viem.getPublicClient();
  const encoder = await connection.viem.deployContract("EncodeExtraArgsOffchain");
  return { publicClient, encoder};

}

export interface EncodeV3Params {
  gasLimit: number;
  blockConfirmations: number;
  ccvs?: `0x${string}`[];
  ccvArgs?: `0x${string}`[];
  executor?: `0x${string}`;
  executorArgs?: `0x${string}`;
  tokenReceiver?: `0x${string}`;
  tokenArgs?: `0x${string}`;
}

const DEFAULT_ENCODE_V3 = {
  ccvs: [] as `0x${string}`[],
  ccvArgs: [] as `0x${string}`[],
  executor: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  executorArgs: "0x" as `0x${string}`,
  tokenReceiver: "0x" as `0x${string}`,
  tokenArgs: "0x" as `0x${string}`,
};

export async function encodeV3Basic(params: EncodeV3Params) {
  const { publicClient, encoder } = await extraArgsContract();
  const { gasLimit, blockConfirmations } = params;
  return publicClient.readContract({
    address: encoder.address,
    abi: encoder.abi,
    functionName: "encodeV3Basic",
    args: [gasLimit, blockConfirmations],
  });
}

/** Allowed-finality helper: `FinalityCodec._encodeBlockDepthAndSafeFlag` — for pools/receivers, not sender ExtraArgs requestedFinality. */
export async function encodeAllowedFinalityBlockDepthAndSafeFlag(blockDepth: number) {
  const { publicClient, encoder } = await extraArgsContract();
  return publicClient.readContract({
    address: encoder.address,
    abi: encoder.abi as Abi,
    functionName: "encodeAllowedFinalityBlockDepthAndSafeFlag",
    args: [BigInt(blockDepth)],
  });
}

export async function encodeV3(params: EncodeV3Params) {
  const { publicClient, encoder } = await extraArgsContract();

  const {
    gasLimit,
    blockConfirmations,
    ccvs = DEFAULT_ENCODE_V3.ccvs,
    ccvArgs = DEFAULT_ENCODE_V3.ccvArgs,
    executor = DEFAULT_ENCODE_V3.executor,
    executorArgs = DEFAULT_ENCODE_V3.executorArgs,
    tokenReceiver = DEFAULT_ENCODE_V3.tokenReceiver,
    tokenArgs = DEFAULT_ENCODE_V3.tokenArgs,
  } = params;

  const v3Bytes = await publicClient.readContract({
    address: encoder.address,
    abi: encoder.abi,
    functionName: "encodeV3",
    args: [gasLimit, blockConfirmations, ccvs, ccvArgs, executor, executorArgs, tokenReceiver, tokenArgs],
  });
  return v3Bytes;
}
//await extraArgs();

export async function getNoExecutionAddress() {
  const { publicClient, encoder } = await extraArgsContract();

    // --- getNoExecutionAddress() ---
    const noExecutionAddr = await publicClient.readContract({
      address: encoder.address,
      abi: encoder.abi,
      functionName: "getNoExecutionAddress",
    });

  return noExecutionAddr;

}  

export async function encodeV1(gasLimit: number) {
  const { publicClient, encoder } = await extraArgsContract();

  // --- encodeV1(uint256 gasLimit) ---
  const v1Bytes = await publicClient.readContract({
    address: encoder.address,
    abi: encoder.abi,
    functionName: "encodeV1",
    args: [BigInt(gasLimit)],
  });

  return v1Bytes;
}

export async function encodeV2(gasLimit: number, allowOutOfOrderExecution: boolean) {
  const { publicClient, encoder } = await extraArgsContract();
  
  // --- encodeV2(uint256 gasLimit, bool allowOutOfOrderExecution) ---
  const v2Bytes = await publicClient.readContract({
    address: encoder.address,
    abi: encoder.abi,
    functionName: "encodeV2",
    args: [BigInt(gasLimit), allowOutOfOrderExecution],
  });

  return v2Bytes;
}