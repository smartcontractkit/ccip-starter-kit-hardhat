import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { encodeAbiParameters } from "viem";
import BasicMessageReceiverWithCCVsModule from "../ignition/modules/BasicMessageReceiverWithCCVs.js";
import example02Action from "../tasks/Example02.js";
import setMinBlockDepthAction from "../tasks/helpers/SetBasicMessageReceiverWithCCVsMinBlockDepth.js";
import { quietly, setupLocalSimulator, ZERO_ADDRESS, type LocalSimulator } from "./utils/localSimulator.js";
import { expectRevertWithError } from "./utils/reverts.js";

/**
 * Example 02: data-only message to BasicMessageReceiverWithCCVs using Fast Transfers.
 * The receiver only accepts a Fast Transfer when its min block depth for the source chain is set and the requested
 * block confirmations are >= that depth. The local simulator reproduces that OffRamp check.
 */
describe("Example02", () => {
  const MESSAGE_TEXT = "Hello CCIP 2.0";
  const GAS_LIMIT = 200_000;
  const WAIT_FOR_FINALITY = "0x00000000";

  let s: LocalSimulator;
  let receiver: ContractReturnType<"BasicMessageReceiverWithCCVs">;

  /** `bytes4(uint32(blockDepth))`, the finality encoding of a block-depth request. */
  const blockDepth = (n: number) => `0x${n.toString(16).padStart(8, "0")}`;

  beforeEach(async () => {
    s = await setupLocalSimulator();
    // Deploys through the same Ignition module the book uses.
    const { basicMessageReceiverWithCCVs } = await s.connection.ignition.deploy(BasicMessageReceiverWithCCVsModule, {
      parameters: { BasicMessageReceiverWithCCVsModule: { routerAddress: s.router.address } },
    });
    receiver = await s.viem.getContractAt("BasicMessageReceiverWithCCVs", basicMessageReceiverWithCCVs.address);
  });

  const setMinBlockDepth = (minBlockDepth: number, sourceChainSelector = s.chainSelector) =>
    quietly(() =>
      setMinBlockDepthAction({ receiver: receiver.address, sourceChainSelector, minBlockDepth }, s.taskHre),
    );

  const send = (blockConfirmations: number, overrides: { receiver?: string } = {}) =>
    quietly(() =>
      example02Action(
        {
          sourceRouter: s.router.address,
          destinationChainSelector: s.chainSelector,
          receiver: overrides.receiver ?? receiver.address,
          messageText: MESSAGE_TEXT,
          gasLimit: GAS_LIMIT,
          blockConfirmations,
          feeTokenAddress: ZERO_ADDRESS,
        },
        s.taskHre,
      ),
    );

  const expectInvalidFinality = (promise: Promise<unknown>, requested: string, allowed: string) =>
    expectRevertWithError(promise, s.router.abi, "InvalidRequestedFinality", [requested, allowed]);

  it("deploys the receiver wired to the router and owned by the deployer", async () => {
    assert.equal((await receiver.read.getRouter()).toLowerCase(), s.router.address.toLowerCase());
    assert.equal((await receiver.read.owner()).toLowerCase(), s.broadcaster.account.address.toLowerCase());
  });

  it("delivers the message when confirmations are above the min block depth", async () => {
    await setMinBlockDepth(3);

    await send(5);

    assert.notEqual(await receiver.read.latestMessageId(), `0x${"00".repeat(32)}`);
    assert.equal(await receiver.read.latestSourceChainSelector(), s.chainSelector);
    assert.equal((await receiver.read.latestSender()).toLowerCase(), s.broadcaster.account.address.toLowerCase());
    assert.equal(await receiver.read.latestMessage(), encodeAbiParameters([{ type: "string" }], [MESSAGE_TEXT]));
  });

  it("delivers the message when confirmations equal the min block depth", async () => {
    await setMinBlockDepth(3);

    await send(3);

    assert.notEqual(await receiver.read.latestMessageId(), `0x${"00".repeat(32)}`);
  });

  it("delivers a message with default finality (0 confirmations) even when no min block depth is set", async () => {
    await send(0);

    assert.notEqual(await receiver.read.latestMessageId(), `0x${"00".repeat(32)}`);
  });

  // Local mode has no CCV verifiers, so it cannot check quorum; it does read the receiver's CCV config (duplicates,
  // optional threshold) and its finality. A receiver with required and optional CCVs must still be accepted by that
  // router-side validation and keep gating on min block depth.
  it("delivers the message when the receiver has a CCV config applied", async () => {
    await receiver.write.applyCCVConfigUpdates([
      [
        {
          requiredCCVs: ["0x00000000000000000000000000000000000000a1"],
          optionalCCVs: ["0x00000000000000000000000000000000000000b1", "0x00000000000000000000000000000000000000b2"],
          sourceChainSelector: s.chainSelector,
          optionalThreshold: 1,
        },
      ],
    ]);
    await setMinBlockDepth(3);

    await send(3);

    assert.notEqual(await receiver.read.latestMessageId(), `0x${"00".repeat(32)}`);
    await expectInvalidFinality(send(2), blockDepth(2), blockDepth(3));
  });

  it("reverts when confirmations are below the min block depth", async () => {
    await setMinBlockDepth(3);

    await expectInvalidFinality(send(2), blockDepth(2), blockDepth(3));
  });

  it("reverts when the min block depth is unset, so only full finality is accepted", async () => {
    await expectInvalidFinality(send(1), blockDepth(1), WAIT_FOR_FINALITY);
  });

  it("set-min-block-depth task rejects a zero source chain selector", async () => {
    await assert.rejects(setMinBlockDepth(3, 0n), /sourceChainSelector cannot be zero/);
  });

  it("rejects a zero receiver", async () => {
    await assert.rejects(send(3, { receiver: ZERO_ADDRESS }), /sourceRouter, destinationChainSelector, receiver are required/);
  });
});
