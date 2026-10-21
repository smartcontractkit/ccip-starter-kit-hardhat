import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { getAddress, type Address } from "viem";
import BurnMintTokenPoolModule from "../ignition/modules/BurnMintTokenPool.js";
import checkFinalityGatesAction from "../tasks/Example06-CheckFinalityGates.js";
import setPoolFinalityAction from "../tasks/Example06-SetPoolFinality.js";
import example06Step1Action from "../tasks/Example06-Step1.js";
import { quietly, ZERO_ADDRESS } from "../test/utils/localSimulator.js";
import { expectRevertWithError } from "../test/utils/reverts.js";
import {
  AMOY,
  assertLinked,
  assertRegistered,
  balanceOf,
  deployModule,
  findLaneFtfDepth,
  PREMINT,
  SEPOLIA,
  send,
  sendAndRoute,
  setupForks,
  totalSupply,
  TRANSFER_AMOUNT,
  type Fork,
  type Forks,
} from "./utils/cctFork.js";

const MAX_SUPPLY = 100_000_000n * 10n ** 18n;
const WAIT_FOR_FINALITY = "0x00000000";

interface Deployed {
  token: ContractReturnType<"CrossChainToken">;
  pool: ContractReturnType<"BurnMintTokenPool">;
}

/**
 * Example 06 (CCT 01): CrossChainToken + BurnMint pool on Sepolia -> Amoy, driven through the book's Ignition module and
 * tasks. Runs against pinned forks of the live testnets. See `utils/cctFork.ts` for what is and is not simulated.
 */
describe("Example06 (fork)", () => {
  let forks: Forks;
  let sepolia: Deployed;
  let amoy: Deployed;

  async function deploy(fork: Fork): Promise<Deployed> {
    const { crossChainToken, burnMintTokenPool } = await deployModule(fork, BurnMintTokenPoolModule);
    return {
      token: await fork.viem.getContractAt("CrossChainToken", crossChainToken.address),
      pool: await fork.viem.getContractAt("BurnMintTokenPool", burnMintTokenPool.address),
    };
  }

  /** Book steps 3 and 4: configure each pool with the other chain as its remote. */
  async function linkPools(): Promise<void> {
    await quietly(() =>
      example06Step1Action(
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
      example06Step1Action(
        {
          localPool: amoy.pool.address,
          remoteChainSelector: SEPOLIA.chainSelector,
          remoteToken: sepolia.token.address,
          remotePool: sepolia.pool.address,
        },
        forks.amoy.taskHre,
      ),
    );
  }

  const setPoolMinBlockDepth = (fork: Fork, pool: Address, minBlockDepth: number) =>
    quietly(() => setPoolFinalityAction({ localPool: pool, minBlockDepth }, fork.taskHre));

  beforeEach(async () => {
    forks = await setupForks();
    sepolia = await deploy(forks.sepolia);
    amoy = await deploy(forks.amoy);
  });

  async function assertDeployed(fork: Fork, { token, pool }: Deployed): Promise<void> {
    const { broadcaster, details } = fork;
    assert.equal(await token.read.name(), "TestToken");
    assert.equal(await token.read.symbol(), "TEST");
    assert.equal(await token.read.decimals(), 18);
    assert.equal(await token.read.maxSupply(), MAX_SUPPLY);
    assert.equal(await token.read.totalSupply(), PREMINT);
    assert.equal(await token.read.balanceOf([broadcaster]), PREMINT);
    assert.equal(await token.read.getCCIPAdmin(), broadcaster);
    assert.ok(await token.read.hasRole([await token.read.MINTER_ROLE(), pool.address]), "pool is not a minter");
    assert.ok(await token.read.hasRole([await token.read.BURNER_ROLE(), pool.address]), "pool is not a burner");

    assert.equal(await pool.read.getToken(), getAddress(token.address));
    assert.equal(await pool.read.getRmnProxy(), details.rmnProxyAddress);
    assert.equal(await pool.read.getAdvancedPoolHooks(), ZERO_ADDRESS, "Example 06 uses no pool hook");
    assert.equal(await pool.read.getAllowedFinalityConfig(), WAIT_FOR_FINALITY, "new pools allow full finality only");

    await assertRegistered(fork, token.address, pool.address);
  }

  it("deploy creates the token and pool and registers them", async () => {
    await assertDeployed(forks.sepolia, sepolia);
    await assertDeployed(forks.amoy, amoy);
  });

  it("configureLane sets the remote token and pool", async () => {
    await linkPools();

    await assertLinked(sepolia.pool, AMOY.chainSelector, amoy.token.address, amoy.pool.address);
    await assertLinked(amoy.pool, SEPOLIA.chainSelector, sepolia.token.address, sepolia.pool.address);
  });

  it("configureLane rerun replaces the existing config", async () => {
    await linkPools();
    await linkPools();

    await assertLinked(sepolia.pool, AMOY.chainSelector, amoy.token.address, amoy.pool.address);
    assert.equal((await sepolia.pool.read.getSupportedChains()).length, 1);
  });

  it("send at default finality burns on the source and mints on the destination", async () => {
    await linkPools();
    const sourceBalanceBefore = await balanceOf(forks.sepolia, sepolia.token.address, forks.sepolia.broadcaster);
    const sourceSupplyBefore = await totalSupply(forks.sepolia, sepolia.token.address);
    const destinationSupplyBefore = await totalSupply(forks.amoy, amoy.token.address);

    await sendAndRoute(forks, sepolia.token.address, TRANSFER_AMOUNT);

    assert.equal(
      await balanceOf(forks.sepolia, sepolia.token.address, forks.sepolia.broadcaster),
      sourceBalanceBefore - TRANSFER_AMOUNT,
    );
    assert.equal(await totalSupply(forks.sepolia, sepolia.token.address), sourceSupplyBefore - TRANSFER_AMOUNT);
    assert.equal(await balanceOf(forks.amoy, amoy.token.address, forks.receiver), TRANSFER_AMOUNT);
    assert.equal(await totalSupply(forks.amoy, amoy.token.address), destinationSupplyBefore + TRANSFER_AMOUNT);
  });

  it("send with Faster Than Finality reverts until the pool opts in", async () => {
    await linkPools();

    // New pools allow full finality only, so any block depth request is rejected by the pool.
    assert.equal(await sepolia.pool.read.getAllowedFinalityConfig(), WAIT_FOR_FINALITY);
    await expectRevertWithError(send(forks, sepolia.token.address, TRANSFER_AMOUNT, 1), [], "InvalidRequestedFinality");
  });

  it("send with Faster Than Finality delivers after both pools opt in", async () => {
    await linkPools();

    // Book step 5: opt both pools in. Depth 1 is the most permissive pool setting, so it lets us ask the lane
    // (executor and CCVs) for the smallest depth it accepts, which is then what both pools are set to.
    await setPoolMinBlockDepth(forks.sepolia, sepolia.pool.address, 1);
    const depth = await findLaneFtfDepth(forks, sepolia.token.address);
    await setPoolMinBlockDepth(forks.sepolia, sepolia.pool.address, depth);
    await setPoolMinBlockDepth(forks.amoy, amoy.pool.address, depth);

    const expectedFinality = `0x${depth.toString(16).padStart(8, "0")}`;
    assert.equal(await sepolia.pool.read.getAllowedFinalityConfig(), expectedFinality);
    assert.equal(await amoy.pool.read.getAllowedFinalityConfig(), expectedFinality);

    const sourceBalanceBefore = await balanceOf(forks.sepolia, sepolia.token.address, forks.sepolia.broadcaster);
    const sourceSupplyBefore = await totalSupply(forks.sepolia, sepolia.token.address);
    const destinationSupplyBefore = await totalSupply(forks.amoy, amoy.token.address);

    await sendAndRoute(forks, sepolia.token.address, TRANSFER_AMOUNT, depth);

    assert.equal(
      await balanceOf(forks.sepolia, sepolia.token.address, forks.sepolia.broadcaster),
      sourceBalanceBefore - TRANSFER_AMOUNT,
    );
    assert.equal(await totalSupply(forks.sepolia, sepolia.token.address), sourceSupplyBefore - TRANSFER_AMOUNT);
    assert.equal(await balanceOf(forks.amoy, amoy.token.address, forks.receiver), TRANSFER_AMOUNT);
    assert.equal(await totalSupply(forks.amoy, amoy.token.address), destinationSupplyBefore + TRANSFER_AMOUNT);
  });

  // The book's read-only pre-flight must run to completion for a registered token on a CCIP 2.0 lane. It throws if the
  // OnRamp is not 2.0.0 or the token has no pool in the TokenAdminRegistry for the lane.
  it("check-finality-gates finds the registered pool", async () => {
    await linkPools();

    await quietly(() =>
      checkFinalityGatesAction(
        {
          sourceRouter: SEPOLIA.routerAddress,
          destinationChainSelector: AMOY.chainSelector,
          tokenToSend: sepolia.token.address,
          blockConfirmations: 1,
        },
        forks.sepolia.taskHre,
      ),
    );
  });
});
