import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { encodeAbiParameters } from "viem";
import example04Action from "../tasks/Example04.js";
import { quietly, setupLocalSimulator, ZERO_ADDRESS, type LocalSimulator } from "./utils/localSimulator.js";
import { expectRevertWithError } from "./utils/reverts.js";

/** Example 04: programmable token transfer (data + token) through BasicMessageSender with default finality. */
describe("Example04", () => {
  const MESSAGE_TEXT = "Hello via sender contract";
  const AMOUNT = 10n ** 17n;
  const GAS_LIMIT = 200_000;

  let s: LocalSimulator;
  let sender: ContractReturnType<"BasicMessageSender">;
  let receiver: ContractReturnType<"BasicMessageReceiver">;

  beforeEach(async () => {
    s = await setupLocalSimulator();
    sender = await s.viem.deployContract("BasicMessageSender", [s.router.address, s.link.address]);
    receiver = await s.viem.deployContract("BasicMessageReceiver", [s.router.address]);
    await s.ccipBnM.write.drip([s.broadcaster.account.address]);
  });

  const send = (overrides: { amount?: bigint } = {}) =>
    quietly(() =>
      example04Action(
        {
          basicMessageSender: sender.address,
          sourceRouter: s.router.address,
          destinationChainSelector: s.chainSelector,
          receiver: receiver.address,
          messageText: MESSAGE_TEXT,
          tokenToSend: s.ccipBnM.address,
          amount: overrides.amount ?? AMOUNT,
          gasLimit: GAS_LIMIT,
          blockConfirmations: 0,
          feeTokenAddress: ZERO_ADDRESS,
        },
        s.taskHre,
      ),
    );

  it("delivers tokens and data through the sender contract", async () => {
    const fee = 10n ** 16n;
    await s.router.write.setFee([fee]);
    const senderBefore = await s.ccipBnM.read.balanceOf([s.broadcaster.account.address]);

    await send();

    assert.equal(await s.ccipBnM.read.balanceOf([receiver.address]), AMOUNT);
    assert.equal(await s.ccipBnM.read.balanceOf([s.broadcaster.account.address]), senderBefore - AMOUNT);
    assert.notEqual(await receiver.read.latestMessageId(), `0x${"00".repeat(32)}`);
    assert.equal(await receiver.read.latestSourceChainSelector(), s.chainSelector);
    // The router sees the sender contract, not the EOA, as the message sender.
    assert.equal((await receiver.read.latestSender()).toLowerCase(), sender.address.toLowerCase());
    assert.equal(await receiver.read.latestMessage(), encodeAbiParameters([{ type: "string" }], [MESSAGE_TEXT]));
    assert.equal(await s.publicClient.getBalance({ address: s.router.address }), fee);
    assert.equal(await s.publicClient.getBalance({ address: sender.address }), 0n);
  });

  it("delivers when the fee is zero", async () => {
    await send();

    assert.notEqual(await receiver.read.latestMessageId(), `0x${"00".repeat(32)}`);
    assert.equal(await s.ccipBnM.read.balanceOf([receiver.address]), AMOUNT);
  });

  it("reverts when the amount is zero", async () => {
    await expectRevertWithError(send({ amount: 0n }), s.router.abi, "CannotSendZeroTokens");
  });
});
