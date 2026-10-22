import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { getAddress, encodeAbiParameters, stringToHex, type Address } from "viem";
import { encodeV3Basic } from "../scripts/CallEncodeExtraArgsOffchain.js";
import { setupLocalSimulator, ZERO_ADDRESS, type LocalSimulator } from "./utils/localSimulator.js";
import { expectEmptyRevert, expectRevertWithError, expectRevertWithReason } from "./utils/reverts.js";

/** Tests BasicMessageSender, BasicMessageReceiver and the Withdraw base against the Chainlink Local router. */
describe("BasicMessageSender and BasicMessageReceiver", () => {
  const AMOUNT = 10n ** 17n;
  const GAS_LIMIT = 200_000;
  const NO_MESSAGE_ID = `0x${"00".repeat(32)}`;

  let s: LocalSimulator;
  let sender: ContractReturnType<"BasicMessageSender">;
  let receiver: ContractReturnType<"BasicMessageReceiver">;
  let user: Address;

  beforeEach(async () => {
    s = await setupLocalSimulator();
    sender = await s.viem.deployContract("BasicMessageSender", [s.router.address, s.link.address]);
    receiver = await s.viem.deployContract("BasicMessageReceiver", [s.router.address]);
    user = s.other.account.address;
  });

  const extraArgs = (blockConfirmations: number) => encodeV3Basic({ gasLimit: GAS_LIMIT, blockConfirmations });

  const oneToken = (amount: bigint) => [{ token: s.ccipBnM.address, amount }];

  const send = async (
    data: string,
    { tokens = [] as { token: Address; amount: bigint }[], blockConfirmations = 0, feeToken = ZERO_ADDRESS, from = sender } = {},
  ) =>
    from.write.send([s.chainSelector, receiver.address, stringToHex(data), tokens, await extraArgs(blockConfirmations), feeToken]);

  /** `sender` as seen by a different caller. */
  const senderAs = (wallet: LocalSimulator["other"]) =>
    s.viem.getContractAt("BasicMessageSender", sender.address, { client: { wallet } });

  // --- BasicMessageSender ---

  it("sends a data-only message paying the fee in native", async () => {
    const fee = 10n ** 16n;
    await s.router.write.setFee([fee]);
    await s.broadcaster.sendTransaction({ to: sender.address, value: fee });

    await send("hello");

    assert.notEqual(await receiver.read.latestMessageId(), NO_MESSAGE_ID);
    assert.equal(await receiver.read.latestSender(), getAddress(sender.address));
    assert.equal(await receiver.read.latestMessage(), stringToHex("hello"));
    assert.equal(await s.publicClient.getBalance({ address: s.router.address }), fee);
  });

  it("sends a data-only message paying the fee in LINK", async () => {
    const fee = 10n ** 16n;
    await s.router.write.setFee([fee]);
    await s.simulator.write.requestLinkFromFaucet([sender.address, 10n ** 18n]);

    await send("hello", { feeToken: s.link.address });

    assert.notEqual(await receiver.read.latestMessageId(), NO_MESSAGE_ID);
    assert.equal(await s.link.read.balanceOf([s.router.address]), fee);
    assert.equal(await s.link.read.balanceOf([sender.address]), 10n ** 18n - fee);
  });

  it("pulls the token from the caller and delivers it to the receiver", async () => {
    await s.ccipBnM.write.drip([user]);
    await s.ccipBnM.write.approve([sender.address, AMOUNT], { account: s.other.account });

    await send("with token", { tokens: oneToken(AMOUNT), from: await senderAs(s.other) });

    assert.equal(await s.ccipBnM.read.balanceOf([receiver.address]), AMOUNT);
    assert.equal(await s.ccipBnM.read.balanceOf([user]), 10n ** 18n - AMOUNT);
    assert.equal(await s.ccipBnM.read.balanceOf([sender.address]), 0n);
  });

  it("reverts when the caller has not approved the token", async () => {
    await s.ccipBnM.write.drip([user]);

    await expectRevertWithReason(
      send("with token", { tokens: oneToken(AMOUNT), from: await senderAs(s.other) }),
      "ERC20: insufficient allowance",
    );
  });

  it("reverts when the native fee is not funded", async () => {
    await s.router.write.setFee([10n ** 16n]);

    // The sender forwards `{value: fee}` it does not hold, so the call fails with empty revert data.
    await expectEmptyRevert(send("hello"));
  });

  it("reverts when more than one token is requested, by the local router's rules", async () => {
    // The contract's NatSpec says one token per message; the CCIP 2.0 OnRamp enforces it and so does the local router.
    const tokens = [
      { token: s.ccipBnM.address, amount: 1n },
      { token: s.ccipBnM.address, amount: 1n },
    ];
    await s.ccipBnM.write.drip([user]);
    await s.ccipBnM.write.approve([sender.address, 2n], { account: s.other.account });

    await expectRevertWithError(
      send("two tokens", { tokens, from: await senderAs(s.other) }),
      s.router.abi,
      "CanOnlySendOneTokenPerMessage",
    );
  });

  // --- BasicMessageReceiver ---

  it("stores the latest message and emits MessageReceived", async () => {
    const fromBlock = await s.publicClient.getBlockNumber();

    await send("stored");

    const messageId = await receiver.read.latestMessageId();
    assert.notEqual(messageId, NO_MESSAGE_ID);
    assert.equal(await receiver.read.latestSourceChainSelector(), s.chainSelector);
    assert.equal(await receiver.read.latestSender(), getAddress(sender.address));
    assert.equal(await receiver.read.latestMessage(), stringToHex("stored"));

    // The receiver's event carries no indexed fields, so read it from the logs.
    const events = await s.publicClient.getContractEvents({
      address: receiver.address,
      abi: receiver.abi,
      eventName: "MessageReceived",
      fromBlock: fromBlock + 1n,
    });
    assert.equal(events.length, 1);
    assert.deepEqual(events[0].args, {
      latestMessageId: messageId,
      latestSourceChainSelector: s.chainSelector,
      latestSender: getAddress(sender.address),
      latestMessage: stringToHex("stored"),
    });
  });

  it("rejects ccipReceive calls from anyone but the router", async () => {
    const message = {
      messageId: `0x${"00".repeat(31)}01` as const,
      sourceChainSelector: s.chainSelector,
      sender: encodeAbiParameters([{ type: "address" }], [user]),
      data: stringToHex("spoofed"),
      destTokenAmounts: [],
    };

    await expectRevertWithError(
      receiver.write.ccipReceive([message], { account: s.other.account }),
      receiver.abi,
      "InvalidRouter",
      [getAddress(user)],
    );
  });

  it("only accepts full finality by default", async () => {
    // BasicMessageReceiver inherits CCIPReceiver's default config: finality required, no Fast Transfers.
    await expectRevertWithError(send("fast", { blockConfirmations: 3 }), s.router.abi, "InvalidRequestedFinality", [
      "0x00000003",
      "0x00000000",
    ]);
  });

  // --- Withdraw (inherited by BasicMessageSender) ---

  it("accepts native and lets the owner withdraw it", async () => {
    await s.broadcaster.sendTransaction({ to: sender.address, value: 10n ** 18n });
    const before = await s.publicClient.getBalance({ address: s.beneficiary.account.address });

    await sender.write.withdraw([s.beneficiary.account.address]);

    assert.equal(await s.publicClient.getBalance({ address: s.beneficiary.account.address }), before + 10n ** 18n);
    assert.equal(await s.publicClient.getBalance({ address: sender.address }), 0n);
  });

  it("lets the owner withdraw tokens", async () => {
    await s.ccipBnM.write.drip([sender.address]);

    await sender.write.withdrawToken([s.beneficiary.account.address, s.ccipBnM.address]);

    assert.equal(await s.ccipBnM.read.balanceOf([s.beneficiary.account.address]), 10n ** 18n);
    assert.equal(await s.ccipBnM.read.balanceOf([sender.address]), 0n);
  });

  it("reverts withdraw and withdrawToken for a non-owner", async () => {
    await s.broadcaster.sendTransaction({ to: sender.address, value: 10n ** 18n });
    const asUser = await senderAs(s.other);
    const unauthorized = [getAddress(user)];

    await expectRevertWithError(
      asUser.write.withdraw([s.beneficiary.account.address]),
      sender.abi,
      "OwnableUnauthorizedAccount",
      unauthorized,
    );
    await expectRevertWithError(
      asUser.write.withdrawToken([s.beneficiary.account.address, s.ccipBnM.address]),
      sender.abi,
      "OwnableUnauthorizedAccount",
      unauthorized,
    );
  });

  it("reverts withdraw when the beneficiary rejects ether", async () => {
    await s.broadcaster.sendTransaction({ to: sender.address, value: 10n ** 18n });
    // The router has no payable fallback, so it refuses plain ether transfers.
    const rejecting = s.router.address;

    await expectRevertWithError(sender.write.withdraw([rejecting]), sender.abi, "FailedToWithdrawEth", [
      getAddress(s.broadcaster.account.address),
      getAddress(rejecting),
      10n ** 18n,
    ]);
  });
});
