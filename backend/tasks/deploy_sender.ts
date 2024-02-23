const { expect } = require("chai");
import { ethers } from "hardhat";

describe("Sender Contract", function () {
  it("Should send a message correctly", async function () {
    const [owner] = await ethers.getSigners();
    const Sender = await ethers.getContractFactory("Sender");
    const sender = await Sender.deploy(/* constructor arguments */);

    // Mock the CCIP interactions or assume successful transactions for simplicity
    // Note: Actual CCIP testing would require a more complex setup or integration tests

    // Example test: check initial settings
    expect(await sender.owner()).to.equal(owner.address);

    // More tests here...
  });
});