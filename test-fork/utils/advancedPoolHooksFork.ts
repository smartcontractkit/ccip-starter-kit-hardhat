import assert from "node:assert/strict";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { getAddress } from "viem";
import BurnMintTokenPoolAdvancedPoolHookModule from "../../ignition/modules/BurnMintTokenPoolAdvancedPoolHook.js";
import example08Step1Action from "../../tasks/Example08-Step1.js";
import example08Step2Action from "../../tasks/Example08-Step2.js";
import { quietly } from "../../test/utils/localSimulator.js";
import {
  AMOY,
  assertRegistered,
  deployModule,
  PREMINT,
  SEPOLIA,
  sendAndRoute,
  setupForks,
  type Fork,
  type Forks,
} from "./cctFork.js";

export interface DeployedWithHook {
  token: ContractReturnType<"CrossChainToken">;
  hook: ContractReturnType<"AdvancedPoolHooks">;
  pool: ContractReturnType<"BurnMintTokenPool">;
}

export interface HooksForks {
  forks: Forks;
  sepolia: DeployedWithHook;
  amoy: DeployedWithHook;
}

async function deploy(fork: Fork): Promise<DeployedWithHook> {
  const { crossChainToken, advancedPoolHooks, burnMintTokenPool } = await deployModule(
    fork,
    BurnMintTokenPoolAdvancedPoolHookModule,
  );
  return {
    token: await fork.viem.getContractAt("CrossChainToken", crossChainToken.address),
    hook: await fork.viem.getContractAt("AdvancedPoolHooks", advancedPoolHooks.address),
    pool: await fork.viem.getContractAt("BurnMintTokenPool", burnMintTokenPool.address),
  };
}

/**
 * Shared setup for the AdvancedPoolHooks fork tests (Example08-10): deploys a CCT BurnMint token + hook + pool on both
 * chains through the book's Ignition module and links the lanes with `example08-step1`, so each test file only adds the
 * hook feature it covers (allowlist, pool CCVs, policy engine).
 * The module seeds the hook allowlist with the broadcaster, the only account that sends in these tests, so allowlist
 * checks pass by default.
 */
export async function setupHooksForks(): Promise<HooksForks> {
  const forks = await setupForks();
  const sepolia = await deploy(forks.sepolia);
  const amoy = await deploy(forks.amoy);

  await quietly(() =>
    example08Step1Action(
      {
        localPool: sepolia.pool.address,
        remoteChainSelector: AMOY.chainSelector,
        remoteToken: amoy.token.address,
        remotePool: amoy.pool.address,
      },
      forks.sepolia.taskHre,
    ),
  );
  await quietly(() =>
    example08Step1Action(
      {
        localPool: amoy.pool.address,
        remoteChainSelector: SEPOLIA.chainSelector,
        remoteToken: sepolia.token.address,
        remotePool: sepolia.pool.address,
      },
      forks.amoy.taskHre,
    ),
  );
  return { forks, sepolia, amoy };
}

/** Sends through the book's `example08-step2` task and routes the message to Amoy. */
export const sendHookTokenAndRoute = (
  { forks, sepolia }: HooksForks,
  amount: bigint,
  blockConfirmations = 0,
) => sendAndRoute(forks, sepolia.token.address, amount, blockConfirmations, example08Step2Action);

/** Asserts the deployed token/hook/pool state shared by Example08-10. */
export async function assertHookDeployed(fork: Fork, { token, hook, pool }: DeployedWithHook): Promise<void> {
  assert.equal(await token.read.balanceOf([fork.broadcaster]), PREMINT);
  assert.equal(await pool.read.getToken(), getAddress(token.address));
  assert.equal(await pool.read.getAdvancedPoolHooks(), getAddress(hook.address), "hook is not attached to the pool");
  await assertRegistered(fork, token.address, pool.address);
}
