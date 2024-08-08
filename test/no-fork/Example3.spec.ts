import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import {
  BasicTokenSender,
  BurnMintERC677Helper,
  CCIPLocalSimulator,
} from "../../typechain-types";

describe("Example 3", function () {
  enum PayFeesIn {
    Native,
    LINK,
  }

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const ccipLocalSimualtorFactory = await hre.ethers.getContractFactory(
      "CCIPLocalSimulator"
    );
    const ccipLocalSimulator: CCIPLocalSimulator =
      await ccipLocalSimualtorFactory.deploy();

    const [alice, bob] = await hre.ethers.getSigners();

    const config: {
      chainSelector_: bigint;
      sourceRouter_: string;
      destinationRouter_: string;
      wrappedNative_: string;
      linkToken_: string;
      ccipBnM_: string;
      ccipLnM_: string;
    } = await ccipLocalSimulator.configuration();

    const basicTokenSenderFactory = await hre.ethers.getContractFactory(
      "BasicTokenSender"
    );
    const basicTokenSender: BasicTokenSender =
      await basicTokenSenderFactory.deploy(
        config.sourceRouter_,
        config.linkToken_
      );

    const ccipBnMTokenFactory = await hre.ethers.getContractFactory(
      "BurnMintERC677Helper"
    );
    const ccipBnMToken = ccipBnMTokenFactory.attach(
      config.ccipBnM_
    ) as BurnMintERC677Helper;

    await ccipBnMToken.drip(alice.address);
    const amountToSend = 100n;
    await ccipBnMToken
      .connect(alice)
      .approve(await basicTokenSender.getAddress(), amountToSend);

    return {
      ccipLocalSimulator,
      alice,
      bob,
      basicTokenSender,
      ccipBnMToken,
      amountToSend,
      config,
    };
  }

  it("Should transfer token(s) from Smart Contract to any destination and pay for fees in LINK", async function () {
    const {
      ccipLocalSimulator,
      alice,
      bob,
      basicTokenSender,
      ccipBnMToken,
      amountToSend,
      config,
    } = await loadFixture(deployFixture);

    await ccipLocalSimulator.requestLinkFromFaucet(
      alice.address,
      5_000_000_000_000_000_000n
    );

    const tokenToSendDetails = [
      {
        token: config.ccipBnM_,
        amount: amountToSend,
      },
    ];

    const balanceOfAliceBefore = await ccipBnMToken.balanceOf(alice.address);
    const balanceOfBobBefore = await ccipBnMToken.balanceOf(bob.address);

    await basicTokenSender
      .connect(alice)
      .send(
        config.chainSelector_,
        bob.address,
        tokenToSendDetails,
        PayFeesIn.LINK
      );

    const balanceOfAliceAfter = await ccipBnMToken.balanceOf(alice.address);
    const balanceOfBobAfter = await ccipBnMToken.balanceOf(bob.address);

    expect(balanceOfAliceBefore - amountToSend).to.deep.equal(
      balanceOfAliceAfter
    );
    expect(balanceOfBobBefore + amountToSend).to.deep.equal(balanceOfBobAfter);
  });

  it("Should transfer token(s) from Smart Contract to any destination and pay for fees in Native coin", async function () {
    const {
      ccipLocalSimulator,
      alice,
      bob,
      basicTokenSender,
      ccipBnMToken,
      amountToSend,
      config,
    } = await loadFixture(deployFixture);

    // transfer Native coins from Alice to the Smart Contract for fees
    await alice.sendTransaction({
      to: await basicTokenSender.getAddress(),
      value: 1_000_000_000_000_000_000n,
    });

    const tokenToSendDetails = [
      {
        token: config.ccipBnM_,
        amount: amountToSend,
      },
    ];

    const balanceOfAliceBefore = await ccipBnMToken.balanceOf(alice.address);
    const balanceOfBobBefore = await ccipBnMToken.balanceOf(bob.address);

    await basicTokenSender
      .connect(alice)
      .send(
        config.chainSelector_,
        bob.address,
        tokenToSendDetails,
        PayFeesIn.Native
      );

    const balanceOfAliceAfter = await ccipBnMToken.balanceOf(alice.address);
    const balanceOfBobAfter = await ccipBnMToken.balanceOf(bob.address);

    expect(balanceOfAliceBefore - amountToSend).to.deep.equal(
      balanceOfAliceAfter
    );
    expect(balanceOfBobBefore + amountToSend).to.deep.equal(balanceOfBobAfter);
  });
});
