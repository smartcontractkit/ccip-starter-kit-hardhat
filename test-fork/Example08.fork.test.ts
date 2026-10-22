import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { getAddress } from "viem";
import example08Step2Action from "../tasks/Example08-Step2.js";
import example08Step3Action from "../tasks/Example08-Step3.js";
import { quietly, ZERO_ADDRESS } from "../test/utils/localSimulator.js";
import { expectRevertWithError } from "../test/utils/reverts.js";
import {
  AMOY,
  balanceOf,
  PREMINT,
  SEPOLIA,
  send,
  THRESHOLD,
  totalSupply,
  TRANSFER_AMOUNT,
} from "./utils/cctFork.js";
import {
  assertHookDeployed,
  sendHookTokenAndRoute,
  setupHooksForks,
  type HooksForks,
} from "./utils/advancedPoolHooksFork.js";

/**
 * Example 08 (CCT 03): CrossChainToken + AdvancedPoolHooks + BurnMint pool on Sepolia -> Amoy, driven through the book's
 * Ignition module and tasks. Runs against pinned forks of the live testnets. See `utils/cctFork.ts` for what is and is
 * not simulated. The module seeds the hook allowlist with the broadcaster, the only account that sends in these tests.
 */
describe("Example08 (fork)", () => {
  let env: HooksForks;

  beforeEach(async () => {
    env = await setupHooksForks();
  });

  const updateAllowlist = (removes: string, adds: string) =>
    quietly(() =>
      example08Step3Action(
        { advancedPoolHook: env.sepolia.hook.address, removes, adds },
        env.forks.sepolia.taskHre,
      ),
    );

  it("deploy attaches the hook with the broadcaster on the allowlist", async () => {
    for (const [fork, deployed] of [
      [env.forks.sepolia, env.sepolia],
      [env.forks.amoy, env.amoy],
    ] as const) {
      await assertHookDeployed(fork, deployed);
      assert.ok(await deployed.hook.read.getAllowListEnabled(), "allowlist should be enabled");
      assert.deepEqual(await deployed.hook.read.getAllowList(), [fork.broadcaster]);
      assert.equal(await deployed.hook.read.getThresholdAmount(), THRESHOLD);
      assert.equal(await deployed.hook.read.getPolicyEngine(), ZERO_ADDRESS, "policy engine is disabled");
    }
  });

  it("configureLane sets the remote token and pool", async () => {
    assert.ok(await env.sepolia.pool.read.isSupportedChain([AMOY.chainSelector]));
    assert.equal(
      await env.sepolia.pool.read.getRemoteToken([AMOY.chainSelector]),
      `0x${env.amoy.token.address.slice(2).toLowerCase().padStart(64, "0")}`,
    );
    assert.ok(await env.amoy.pool.read.isSupportedChain([SEPOLIA.chainSelector]));
    assert.equal(
      await env.amoy.pool.read.getRemoteToken([SEPOLIA.chainSelector]),
      `0x${env.sepolia.token.address.slice(2).toLowerCase().padStart(64, "0")}`,
    );
  });

  it("send by an allowlisted sender burns and mints", async () => {
    const destinationSupplyBefore = await totalSupply(env.forks.amoy, env.amoy.token.address);

    await sendHookTokenAndRoute(env, TRANSFER_AMOUNT);

    assert.equal(
      await balanceOf(env.forks.sepolia, env.sepolia.token.address, env.forks.sepolia.broadcaster),
      PREMINT - TRANSFER_AMOUNT,
    );
    assert.equal(await totalSupply(env.forks.sepolia, env.sepolia.token.address), PREMINT - TRANSFER_AMOUNT);
    assert.equal(await balanceOf(env.forks.amoy, env.amoy.token.address, env.forks.receiver), TRANSFER_AMOUNT);
    assert.equal(
      await totalSupply(env.forks.amoy, env.amoy.token.address),
      destinationSupplyBefore + TRANSFER_AMOUNT,
    );
  });

  it("send reverts when the sender is removed from the allowlist", async () => {
    await updateAllowlist(env.forks.sepolia.broadcaster, "");

    await expectRevertWithError(
      send(env.forks, env.sepolia.token.address, TRANSFER_AMOUNT, 0, example08Step2Action),
      env.sepolia.hook.abi,
      "SenderNotAllowed",
    );
  });

  it("updateAllowlist remove then add restores access", async () => {
    await updateAllowlist(env.forks.sepolia.broadcaster, "");
    assert.equal((await env.sepolia.hook.read.getAllowList()).length, 0);

    await updateAllowlist("", env.forks.sepolia.broadcaster);
    assert.deepEqual(await env.sepolia.hook.read.getAllowList(), [getAddress(env.forks.sepolia.broadcaster)]);

    await sendHookTokenAndRoute(env, TRANSFER_AMOUNT);
    assert.equal(await balanceOf(env.forks.amoy, env.amoy.token.address, env.forks.receiver), TRANSFER_AMOUNT);
  });
});
