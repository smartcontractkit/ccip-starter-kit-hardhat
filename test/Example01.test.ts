import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import example01Action from "../tasks/Example01.js";
import { quietly, setupLocalSimulator, ZERO_ADDRESS, type LocalSimulator } from "./utils/localSimulator.js";

/** Example 01: token transfer to an EOA with ExtraArgsV3 and Fast Transfers (non-zero block confirmations). */
describe("Example01", () => {
  const AMOUNT = 10n ** 17n;
  const EOA_GAS_LIMIT = 0;
  const BLOCK_CONFIRMATIONS = 5;

  let s: LocalSimulator;
  let receiver: `0x${string}`;

  beforeEach(async () => {
    s = await setupLocalSimulator();
    receiver = s.other.account.address;
    await s.ccipBnM.write.drip([s.broadcaster.account.address]);
  });

  function run(overrides: Partial<Parameters<typeof example01Action>[0]> = {}) {
    return quietly(() =>
      example01Action(
        {
          sourceRouter: s.router.address,
          destinationChainSelector: s.chainSelector,
          receiver,
          tokenToSend: s.ccipBnM.address,
          amount: AMOUNT,
          gasLimit: EOA_GAS_LIMIT,
          blockConfirmations: BLOCK_CONFIRMATIONS,
          feeTokenAddress: ZERO_ADDRESS,
          ...overrides,
        },
        s.taskHre,
      ),
    );
  }

  it("transfers token to an EOA paying the fee in native", async () => {
    const fee = 10n ** 16n;
    await s.router.write.setFee([fee]);
    const senderBefore = await s.ccipBnM.read.balanceOf([s.broadcaster.account.address]);

    await run();

    assert.equal(await s.ccipBnM.read.balanceOf([receiver]), AMOUNT);
    assert.equal(await s.ccipBnM.read.balanceOf([s.broadcaster.account.address]), senderBefore - AMOUNT);
    assert.equal(await s.publicClient.getBalance({ address: s.router.address }), fee);
  });

  it("transfers token to an EOA paying the fee in LINK", async () => {
    const fee = 10n ** 16n;
    await s.router.write.setFee([fee]);
    await s.simulator.write.requestLinkFromFaucet([s.broadcaster.account.address, 10n ** 18n]);

    await run({ feeTokenAddress: s.link.address });

    assert.equal(await s.ccipBnM.read.balanceOf([receiver]), AMOUNT);
    assert.equal(await s.link.read.balanceOf([s.router.address]), fee);
  });

  it("rejects a zero amount before sending anything", async () => {
    await assert.rejects(run({ amount: 0n }), /Required args must be non-zero/);
    assert.equal(await s.ccipBnM.read.balanceOf([receiver]), 0n);
  });

  it("rejects a zero receiver", async () => {
    await assert.rejects(run({ receiver: ZERO_ADDRESS }), /Required args must be non-zero/);
  });
});
