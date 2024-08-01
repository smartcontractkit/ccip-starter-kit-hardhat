import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai";
import hre from "hardhat";


describe("Example 4", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
        const ccipLocalSimualtorFactory = await hre.ethers.getContractFactory("CCIPLocalSimulator");
        const ccipLocalSimulator = await ccipLocalSimualtorFactory.deploy();

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

        const programmableTokenTransfersFactory = await hre.ethers.getContractFactory("ProgrammableTokenTransfers");
        const sender = await programmableTokenTransfersFactory.deploy(config.sourceRouter_);
        const receiver = await programmableTokenTransfersFactory.deploy(config.destinationRouter_);

        const ccipBnMTokenFactory = await hre.ethers.getContractFactory("BurnMintERC677Helper");
        const ccipBnMToken = ccipBnMTokenFactory.attach(config.ccipBnM_);

        return { alice, config, sender, receiver, ccipBnMToken };
    }

    it("Should test Programmable Token Transfers", async function () {
        const { alice, config, sender, receiver, ccipBnMToken } = await loadFixture(deployFixture);

        await alice.sendTransaction({
            to: sender.address,
            value: 1_000_000_000_000_000_000n,
        });

        await ccipBnMToken.drip(sender.address);

        const balanceOfSenderBefore = await ccipBnMToken.balanceOf(sender.address);
        const balanceOfReceiverBefore = await ccipBnMToken.balanceOf(receiver.address);

        const amountToSend = 100n;
        const messageToSend = "Hello, World!";

        await sender.connect(alice).sendMessage(config.chainSelector_, receiver.address, messageToSend, ccipBnMToken.address, amountToSend);

        const balanceOfSenderAfter = await ccipBnMToken.balanceOf(sender.address);
        const balanceOfReceiverAfter = await ccipBnMToken.balanceOf(receiver.address);

        expect(balanceOfSenderBefore.sub(balanceOfSenderAfter)).to.equal(amountToSend);
        expect(balanceOfReceiverAfter.sub(balanceOfReceiverBefore)).to.equal(amountToSend);

        const latestReceivedMessageDetails = await receiver.getLastReceivedMessageDetails();

        expect(latestReceivedMessageDetails.sourceChainSelector).to.equal(config.chainSelector_);
        expect(latestReceivedMessageDetails.sender).to.equal(sender.address);
        expect(latestReceivedMessageDetails.message).to.deep.equal(messageToSend);
        expect(latestReceivedMessageDetails.token).to.equal(ccipBnMToken.address);
        expect(latestReceivedMessageDetails.amount).to.equal(amountToSend);
    });
});
