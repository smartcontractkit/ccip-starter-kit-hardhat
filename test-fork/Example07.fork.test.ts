import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { getAddress } from "viem";
import LockAndReleaseTokenPoolModule from "../ignition/modules/LockAndReleaseTokenPool.js";
import example07Step1Action from "../tasks/Example07-Step1.js";
import example07Step2Action from "../tasks/Example07-Step2.js";
import example07Step3Action from "../tasks/Example07-Step3.js";
import { quietly } from "../test/utils/localSimulator.js";
import {
  AMOY,
  assertLinked,
  assertRegistered,
  balanceOf,
  deployModule,
  PREMINT,
  routeLatestSend,
  SEPOLIA,
  send,
  sendAndRoute,
  setupForks,
  totalSupply,
  TRANSFER_AMOUNT,
  type Fork,
  type Forks,
} from "./utils/cctFork.js";

const DESTINATION_LIQUIDITY = 10n * 10n ** 18n;

interface Deployed {
  token: ContractReturnType<"CrossChainToken">;
  lockBox: ContractReturnType<"ERC20LockBox">;
  pool: ContractReturnType<"LockReleaseTokenPool">;
}

/**
 * Example 07 (CCT 02): CrossChainToken + lock box + LockRelease pool on Sepolia -> Amoy, driven through the book's
 * Ignition module and tasks. Runs against pinned forks of the live testnets. See `utils/cctFork.ts` for what is and is
 * not simulated.
 */
describe("Example07 (fork)", () => {
  let forks: Forks;
  let sepolia: Deployed;
  let amoy: Deployed;

  async function deploy(fork: Fork): Promise<Deployed> {
    const { crossChainToken, erc20LockBox, lockReleaseTokenPool } = await deployModule(
      fork,
      LockAndReleaseTokenPoolModule,
    );
    return {
      token: await fork.viem.getContractAt("CrossChainToken", crossChainToken.address),
      lockBox: await fork.viem.getContractAt("ERC20LockBox", erc20LockBox.address),
      pool: await fork.viem.getContractAt("LockReleaseTokenPool", lockReleaseTokenPool.address),
    };
  }

  beforeEach(async () => {
    forks = await setupForks();
    sepolia = await deploy(forks.sepolia);
    amoy = await deploy(forks.amoy);

    await quietly(() =>
      example07Step1Action(
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
      example07Step1Action(
        {
          localPool: amoy.pool.address,
          remoteChainSelector: SEPOLIA.chainSelector,
          remoteToken: sepolia.token.address,
          remotePool: sepolia.pool.address,
        },
        forks.amoy.taskHre,
      ),
    );
  });

  /** Book step "fund the Amoy lock box first", needed for Sepolia -> Amoy transfers. */
  const fundDestinationLockBox = () =>
    quietly(() =>
      example07Step2Action(
        { token: amoy.token.address, lockBox: amoy.lockBox.address, amount: DESTINATION_LIQUIDITY },
        forks.amoy.taskHre,
      ),
    );

  async function assertDeployed(fork: Fork, { token, lockBox, pool }: Deployed): Promise<void> {
    assert.equal(await token.read.totalSupply(), PREMINT);
    assert.equal(await token.read.balanceOf([fork.broadcaster]), PREMINT);
    assert.equal(await token.read.balanceOf([lockBox.address]), 0n, "lock box starts empty");

    assert.equal(await pool.read.getToken(), getAddress(token.address));
    assert.equal(await pool.read.getLockBox(), getAddress(lockBox.address));
    assert.equal(await pool.read.getRmnProxy(), fork.details.rmnProxyAddress);

    await assertRegistered(fork, token.address, pool.address);
  }

  it("deploy creates the token, lock box and pool and registers them", async () => {
    await assertDeployed(forks.sepolia, sepolia);
    await assertDeployed(forks.amoy, amoy);
  });

  it("configureLane sets the remote token and pool", async () => {
    await assertLinked(sepolia.pool, AMOY.chainSelector, amoy.token.address, amoy.pool.address);
    await assertLinked(amoy.pool, SEPOLIA.chainSelector, sepolia.token.address, sepolia.pool.address);
  });

  it("fundLockBox moves tokens into the lock box", async () => {
    await fundDestinationLockBox();

    assert.equal(await balanceOf(forks.amoy, amoy.token.address, amoy.lockBox.address), DESTINATION_LIQUIDITY);
    assert.equal(
      await balanceOf(forks.amoy, amoy.token.address, forks.amoy.broadcaster),
      PREMINT - DESTINATION_LIQUIDITY,
    );
  });

  it("send locks on the source and releases from the destination lock box", async () => {
    await fundDestinationLockBox();

    await sendAndRoute(forks, sepolia.token.address, TRANSFER_AMOUNT, 0, example07Step3Action);

    // Source: tokens move from the sender to the lock box, supply is unchanged (nothing is burned).
    assert.equal(
      await balanceOf(forks.sepolia, sepolia.token.address, forks.sepolia.broadcaster),
      PREMINT - TRANSFER_AMOUNT,
    );
    assert.equal(await balanceOf(forks.sepolia, sepolia.token.address, sepolia.lockBox.address), TRANSFER_AMOUNT);
    assert.equal(await totalSupply(forks.sepolia, sepolia.token.address), PREMINT);
    // Destination: tokens are released from the lock box to the receiver, supply is unchanged (nothing is minted).
    assert.equal(await balanceOf(forks.amoy, amoy.token.address, forks.receiver), TRANSFER_AMOUNT);
    assert.equal(
      await balanceOf(forks.amoy, amoy.token.address, amoy.lockBox.address),
      DESTINATION_LIQUIDITY - TRANSFER_AMOUNT,
    );
    assert.equal(await totalSupply(forks.amoy, amoy.token.address), PREMINT);
  });

  // The book tells you to fund the destination lock box first. Without liquidity the OffRamp cannot release the tokens,
  // and the router surfaces the recorded failure.
  it("send fails to execute when the destination lock box is empty", async () => {
    await send(forks, sepolia.token.address, TRANSFER_AMOUNT, 0, example07Step3Action);

    await assert.rejects(routeLatestSend(forks));
  });
});
