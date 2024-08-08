import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import {
  BurnMintERC677Helper,
  CCIPLocalSimulator,
  ProgrammableTokenTransfers,
} from "../../typechain-types";
import { ccip } from "../../typechain-types/@chainlink/local/src";

describe("Example 4", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const ccipLocalSimualtorFactory = await hre.ethers.getContractFactory(
      "CCIPLocalSimulator"
    );
    const ccipLocalSimulator: CCIPLocalSimulator =
      await ccipLocalSimualtorFactory.deploy();

    const [alice] = await hre.ethers.getSigners();

    const config: {
      chainSelector_: bigint;
      sourceRouter_: string;
      destinationRouter_: string;
      wrappedNative_: string;
      linkToken_: string;
      ccipBnM_: string;
      ccipLnM_: string;
    } = await ccipLocalSimulator.configuration();

    const programmableTokenTransfersFactory =
      await hre.ethers.getContractFactory("ProgrammableTokenTransfers");
    const sender: ProgrammableTokenTransfers =
      await programmableTokenTransfersFactory.deploy(config.sourceRouter_);
    const receiver: ProgrammableTokenTransfers =
      await programmableTokenTransfersFactory.deploy(config.destinationRouter_);

    const ccipBnMTokenFactory = await hre.ethers.getContractFactory(
      "BurnMintERC677Helper"
    );
    const ccipBnMToken = ccipBnMTokenFactory.attach(
      config.ccipBnM_
    ) as BurnMintERC677Helper;

    return { alice, config, sender, receiver, ccipBnMToken };
  }

  it("Should test Programmable Token Transfers", async function () {
    const { alice, config, sender, receiver, ccipBnMToken } = await loadFixture(
      deployFixture
    );
    const senderAddress = await sender.getAddress();
    const receiverAddress = await receiver.getAddress();

    await alice.sendTransaction({
      to: senderAddress,
      value: 1_000_000_000_000_000_000n,
    });

    await ccipBnMToken.drip(senderAddress);

    const balanceOfSenderBefore = await ccipBnMToken.balanceOf(senderAddress);
    const balanceOfReceiverBefore = await ccipBnMToken.balanceOf(
      receiverAddress
    );

    const amountToSend = 100n;
    const messageToSend = "Hello, World!";

    await sender
      .connect(alice)
      .sendMessage(
        config.chainSelector_,
        receiverAddress,
        messageToSend,
        await ccipBnMToken.getAddress(),
        amountToSend
      );

    const balanceOfSenderAfter = await ccipBnMToken.balanceOf(senderAddress);
    const balanceOfReceiverAfter = await ccipBnMToken.balanceOf(
      receiverAddress
    );

    expect(balanceOfSenderBefore - balanceOfSenderAfter).to.equal(amountToSend);
    expect(balanceOfReceiverAfter - balanceOfReceiverBefore).to.equal(
      amountToSend
    );

    const latestReceivedMessageDetails =
      await receiver.getLastReceivedMessageDetails();

    expect(latestReceivedMessageDetails.sourceChainSelector).to.equal(
      config.chainSelector_
    );
    expect(latestReceivedMessageDetails.sender).to.equal(senderAddress);
    expect(latestReceivedMessageDetails.message).to.deep.equal(messageToSend);
    expect(latestReceivedMessageDetails.token).to.equal(
      await ccipBnMToken.getAddress()
    );
    expect(latestReceivedMessageDetails.amount).to.equal(amountToSend);
  });
});
