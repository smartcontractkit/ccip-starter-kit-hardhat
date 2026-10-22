import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import hre from "hardhat";
import { getAddress, type Address } from "viem";
import { expectRevertWithError } from "./utils/reverts.js";

describe("BasicMessageReceiverWithCCVs", () => {
  const SOURCE_CHAIN = 16015286601757825753n;
  const ROUTER: Address = "0x0000000000000000000000000000000000C0FFEE";
  const WAIT_FOR_FINALITY = "0x00000000";
  const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";
  const ccvA: Address = "0x00000000000000000000000000000000000000A1";
  const ccvB: Address = "0x00000000000000000000000000000000000000B1";
  const ccvC: Address = "0x00000000000000000000000000000000000000C1";

  let viem: Awaited<ReturnType<typeof hre.network.connect>>["viem"];
  let receiver: ContractReturnType<"BasicMessageReceiverWithCCVs">;
  let owner: Address;
  let stranger: Awaited<ReturnType<typeof viem.getWalletClients>>[number];

  beforeEach(async () => {
    ({ viem } = await hre.network.connect());
    const [ownerClient, strangerClient] = await viem.getWalletClients();
    owner = ownerClient.account.address;
    stranger = strangerClient;
    receiver = await viem.deployContract("BasicMessageReceiverWithCCVs", [ROUTER]);
  });

  const ccvConfig = (requiredCCVs: Address[], optionalCCVs: Address[], optionalThreshold: number) => [
    { requiredCCVs, optionalCCVs, sourceChainSelector: SOURCE_CHAIN, optionalThreshold },
  ];

  const config = async (sourceChainSelector = SOURCE_CHAIN) => {
    const [required, optional, threshold, finality] = await receiver.read.getCCVsAndFinalityConfig([
      sourceChainSelector,
      "0x",
    ]);
    return { required, optional, threshold, finality };
  };


  // --- constructor / ownership ---

  it("sets the router and owner in the constructor", async () => {
    assert.equal((await receiver.read.getRouter()).toLowerCase(), ROUTER.toLowerCase());
    assert.equal((await receiver.read.owner()).toLowerCase(), owner.toLowerCase());
  });

  // --- min block depth -> allowed finality ---

  it("defaults to full finality and no CCVs", async () => {
    const { required, optional, threshold, finality } = await config();

    assert.equal(required.length, 0);
    assert.equal(optional.length, 0);
    assert.equal(threshold, 0);
    assert.equal(finality, WAIT_FOR_FINALITY);
  });

  it("reflects the min block depth as block-depth finality and emits", async () => {
    await viem.assertions.emitWithArgs(
      receiver.write.setMinBlockDepth([SOURCE_CHAIN, 7]),
      receiver,
      "MinBlockDepthSet",
      [SOURCE_CHAIN, 7],
    );

    assert.equal((await config()).finality, "0x00000007");
  });

  it("keeps the min block depth per source chain", async () => {
    await receiver.write.setMinBlockDepth([SOURCE_CHAIN, 7]);

    assert.equal((await config(SOURCE_CHAIN + 1n)).finality, WAIT_FOR_FINALITY);
  });

  it("restores full finality when the min block depth is reset to zero", async () => {
    await receiver.write.setMinBlockDepth([SOURCE_CHAIN, 7]);
    await receiver.write.setMinBlockDepth([SOURCE_CHAIN, 0]);

    assert.equal((await config()).finality, WAIT_FOR_FINALITY);
  });

  it("reverts setMinBlockDepth for a non-owner", async () => {
    await expectRevertWithError(
      receiver.write.setMinBlockDepth([SOURCE_CHAIN, 7], { account: stranger.account }),
      receiver.abi,
      "OwnableUnauthorizedAccount",
      [getAddress(stranger.account.address)],
    );
  });

  // --- CCV config ---

  it("stores the CCV config and emits", async () => {
    await viem.assertions.emitWithArgs(
      receiver.write.applyCCVConfigUpdates([ccvConfig([ccvA], [ccvB, ccvC], 1)]),
      receiver,
      "CCVConfigSet",
      [SOURCE_CHAIN, [ccvA], [ccvB, ccvC], 1],
    );

    const { required, optional, threshold } = await config();
    assert.deepEqual(required, [ccvA]);
    assert.deepEqual(optional, [ccvB, ccvC]);
    assert.equal(threshold, 1);
  });

  it("overwrites a previous CCV config", async () => {
    await receiver.write.applyCCVConfigUpdates([ccvConfig([ccvA], [ccvB, ccvC], 1)]);
    await receiver.write.applyCCVConfigUpdates([ccvConfig([ccvC], [], 0)]);

    const { required, optional, threshold } = await config();
    assert.deepEqual(required, [ccvC]);
    assert.equal(optional.length, 0);
    assert.equal(threshold, 0);
  });

  it("allows the zero address as a required CCV", async () => {
    // address(0) as a required CCV signals "always enforce the lane's default CCVs".
    await receiver.write.applyCCVConfigUpdates([ccvConfig([ZERO_ADDRESS], [], 0)]);

    assert.deepEqual((await config()).required, [ZERO_ADDRESS]);
  });

  it("reverts applyCCVConfigUpdates for a non-owner", async () => {
    await expectRevertWithError(
      receiver.write.applyCCVConfigUpdates([ccvConfig([ccvA], [], 0)], { account: stranger.account }),
      receiver.abi,
      "OwnableUnauthorizedAccount",
      [getAddress(stranger.account.address)],
    );
  });

  it("reverts when the threshold equals the optional CCV count", async () => {
    // threshold == optional count means the optional CCVs are effectively required.
    await expectRevertWithError(
      receiver.write.applyCCVConfigUpdates([ccvConfig([ccvA], [ccvB, ccvC], 2)]),
      receiver.abi,
      "InvalidOptionalThreshold",
      [SOURCE_CHAIN, 2],
    );
  });

  it("reverts when the threshold exceeds the optional CCV count", async () => {
    await expectRevertWithError(
      receiver.write.applyCCVConfigUpdates([ccvConfig([ccvA], [ccvB, ccvC], 3)]),
      receiver.abi,
      "InvalidOptionalThreshold",
      [SOURCE_CHAIN, 3],
    );
  });

  it("reverts when a threshold is set without optional CCVs", async () => {
    await expectRevertWithError(
      receiver.write.applyCCVConfigUpdates([ccvConfig([ccvA], [], 1)]),
      receiver.abi,
      "InvalidOptionalThreshold",
      [SOURCE_CHAIN, 1],
    );
  });

  it("reverts on the zero address as an optional CCV", async () => {
    await expectRevertWithError(
      receiver.write.applyCCVConfigUpdates([ccvConfig([ccvA], [ZERO_ADDRESS, ccvB], 1)]),
      receiver.abi,
      "ZeroAddressNotAllowedAsOptional",
    );
  });

  it("reverts on a duplicate within the required CCVs", async () => {
    await expectRevertWithError(
      receiver.write.applyCCVConfigUpdates([ccvConfig([ccvA, ccvA], [], 0)]),
      receiver.abi,
      "DuplicateCCV",
      [SOURCE_CHAIN, ccvA],
    );
  });

  it("reverts on a duplicate across required and optional CCVs", async () => {
    await expectRevertWithError(
      receiver.write.applyCCVConfigUpdates([ccvConfig([ccvA], [ccvA, ccvB], 1)]),
      receiver.abi,
      "DuplicateCCV",
      [SOURCE_CHAIN, ccvA],
    );
  });
});
