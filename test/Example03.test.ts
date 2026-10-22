import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { encodeAbiParameters } from "viem";
import example03Action from "../tasks/Example03.js";
import { quietly, setupLocalSimulator, ZERO_ADDRESS, type LocalSimulator } from "./utils/localSimulator.js";
import { expectRevertWithError } from "./utils/reverts.js";

/** Example 03: programmable token transfer (data + token) to a contract receiver using Fast Transfers. */
describe("Example03", () => {
  const MESSAGE_TEXT = "Hello with tokens";
  const AMOUNT = 10n ** 17n;
  const GAS_LIMIT = 200_000;
  const MIN_BLOCK_DEPTH = 3;

  let s: LocalSimulator;
  let receiver: ContractReturnType<"BasicMessageReceiverWithCCVs">;

  beforeEach(async () => {
    s = await setupLocalSimulator();
    receiver = await s.viem.deployContract("BasicMessageReceiverWithCCVs", [s.router.address]);
    await receiver.write.setMinBlockDepth([s.chainSelector, MIN_BLOCK_DEPTH]);
    await s.ccipBnM.write.drip([s.broadcaster.account.address]);
  });

  const send = (blockConfirmations: number, feeTokenAddress: `0x${string}`, overrides: { receiver?: string } = {}) =>
    quietly(() =>
      example03Action(
        {
          sourceRouter: s.router.address,
          destinationChainSelector: s.chainSelector,
          receiver: overrides.receiver ?? receiver.address,
          messageText: MESSAGE_TEXT,
          tokenToSend: s.ccipBnM.address,
          amount: AMOUNT,
          gasLimit: GAS_LIMIT,
          blockConfirmations,
          feeTokenAddress,
        },
        s.taskHre,
      ),
    );

  it("delivers tokens and data paying the fee in native", async () => {
    const fee = 10n ** 16n;
    await s.router.write.setFee([fee]);

    await send(5, ZERO_ADDRESS);

    assert.equal(await s.ccipBnM.read.balanceOf([receiver.address]), AMOUNT);
    assert.notEqual(await receiver.read.latestMessageId(), `0x${"00".repeat(32)}`);
    assert.equal((await receiver.read.latestSender()).toLowerCase(), s.broadcaster.account.address.toLowerCase());
    assert.equal(await receiver.read.latestMessage(), encodeAbiParameters([{ type: "string" }], [MESSAGE_TEXT]));
    assert.equal(await s.publicClient.getBalance({ address: s.router.address }), fee);
  });

  it("delivers tokens and data paying the fee in LINK", async () => {
    const fee = 10n ** 16n;
    await s.router.write.setFee([fee]);
    await s.simulator.write.requestLinkFromFaucet([s.broadcaster.account.address, 10n ** 18n]);

    await send(5, s.link.address);

    assert.equal(await s.ccipBnM.read.balanceOf([receiver.address]), AMOUNT);
    assert.notEqual(await receiver.read.latestMessageId(), `0x${"00".repeat(32)}`);
    assert.equal(await s.link.read.balanceOf([s.router.address]), fee);
  });

  // A token+data message is not a token-only transfer, so the receiver's finality config is enforced and no tokens
  // move when it is rejected.
  it("reverts when confirmations are below the receiver's min block depth, moving no tokens", async () => {
    const senderBefore = await s.ccipBnM.read.balanceOf([s.broadcaster.account.address]);

    await expectRevertWithError(send(2, ZERO_ADDRESS), s.router.abi, "InvalidRequestedFinality", [
      "0x00000002",
      "0x00000003",
    ]);

    assert.equal(await s.ccipBnM.read.balanceOf([receiver.address]), 0n);
    assert.equal(await s.ccipBnM.read.balanceOf([s.broadcaster.account.address]), senderBefore);
  });

  it("rejects a zero receiver", async () => {
    await assert.rejects(send(5, ZERO_ADDRESS, { receiver: ZERO_ADDRESS }), /receiver required/);
  });
});
