import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { id, AbiCoder } from "ethers";
import {
  BurnMintERC677Helper,
  CCIPLocalSimulator,
  IRouterClient,
  LinkTokenInterface,
} from "../../typechain-types";

describe("Example 1", function () {
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

    return { ccipLocalSimulator, alice, bob };
  }

  it("Should transfer CCIP test tokens from EOA to EOA", async function () {
    const { ccipLocalSimulator, alice, bob } = await loadFixture(deployFixture);

    const config: {
      chainSelector_: bigint;
      sourceRouter_: string;
      destinationRouter_: string;
      wrappedNative_: string;
      linkToken_: string;
      ccipBnM_: string;
      ccipLnM_: string;
    } = await ccipLocalSimulator.configuration();

    const mockCcipRouterFactory = await hre.ethers.getContractFactory(
      "MockCCIPRouter"
    );
    const mockCcipRouter = mockCcipRouterFactory.attach(
      config.sourceRouter_
    ) as IRouterClient;
    const mockCcipRouterAddress = await mockCcipRouter.getAddress();

    const ccipBnMFactory = await hre.ethers.getContractFactory(
      "BurnMintERC677Helper"
    );
    const ccipBnM = ccipBnMFactory.attach(
      config.ccipBnM_
    ) as BurnMintERC677Helper;

    await ccipBnM.drip(alice.address);
    const ONE_ETHER = 1_000_000_000_000_000_000n;

    expect(await ccipBnM.balanceOf(alice.address)).to.deep.equal(ONE_ETHER);

    const amountToSend = 100n;

    await ccipBnM.connect(alice).approve(mockCcipRouterAddress, amountToSend);

    const tokenAmounts = [
      {
        token: config.ccipBnM_,
        amount: amountToSend,
      },
    ];

    const gasLimit = 0;

    const functionSelector = id("CCIP EVMExtraArgsV1").slice(0, 10);
    const defaultAbiCoder = AbiCoder.defaultAbiCoder();
    const extraArgs = defaultAbiCoder.encode(["uint256"], [gasLimit]); // for transfers to EOA gas limit is 0
    const encodedExtraArgs = `${functionSelector}${extraArgs.slice(2)}`;

    const message = {
      receiver: defaultAbiCoder.encode(["address"], [bob.address]),
      data: defaultAbiCoder.encode(["string"], [""]), // no data
      tokenAmounts: tokenAmounts,
      feeToken: config.linkToken_,
      extraArgs: encodedExtraArgs,
    };

    const linkTokenFactory = await hre.ethers.getContractFactory("LinkToken");
    const linkToken = linkTokenFactory.attach(
      config.linkToken_
    ) as LinkTokenInterface;
    const fee = await mockCcipRouter.getFee(config.chainSelector_, message);
    await linkToken.connect(alice).approve(mockCcipRouterAddress, fee);

    await mockCcipRouter
      .connect(alice)
      .ccipSend(config.chainSelector_, message);

    expect(await ccipBnM.balanceOf(alice.address)).to.deep.equal(
      ONE_ETHER - amountToSend
    );
    expect(await ccipBnM.balanceOf(bob.address)).to.deep.equal(amountToSend);
  });
});
