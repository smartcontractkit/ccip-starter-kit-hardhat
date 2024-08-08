import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import {
  CCIPLocalSimulator,
  DestinationMinter,
  MyNFT,
  SourceMinter,
} from "../../typechain-types";

describe("Example 7", function () {
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

    const myNftFactory = await hre.ethers.getContractFactory("MyNFT");
    const myNft: MyNFT = await myNftFactory.deploy();

    const destinationMinterFactory = await hre.ethers.getContractFactory(
      "DestinationMinter"
    );
    const destinationMinter: DestinationMinter =
      await destinationMinterFactory.deploy(
        config.destinationRouter_,
        await myNft.getAddress()
      );

    await myNft.transferOwnership(await destinationMinter.getAddress());

    const sourceMinterFactory = await hre.ethers.getContractFactory(
      "SourceMinter"
    );
    const sourceMinter: SourceMinter = await sourceMinterFactory.deploy(
      config.sourceRouter_,
      config.linkToken_
    );

    return {
      ccipLocalSimulator,
      alice,
      config,
      sourceMinter,
      destinationMinter,
      myNft,
    };
  }

  it("Should execute received message as a function call", async function () {
    const {
      ccipLocalSimulator,
      alice,
      config,
      sourceMinter,
      destinationMinter,
      myNft,
    } = await loadFixture(deployFixture);

    await ccipLocalSimulator.requestLinkFromFaucet(
      await sourceMinter.getAddress(),
      5_000_000_000_000_000_000n
    );

    await sourceMinter
      .connect(alice)
      .mint(
        config.chainSelector_,
        await destinationMinter.getAddress(),
        PayFeesIn.LINK
      );

    expect(await myNft.ownerOf(0)).to.equal(alice.address);
    expect(await myNft.balanceOf(alice.address)).to.equal(1);
  });
});
