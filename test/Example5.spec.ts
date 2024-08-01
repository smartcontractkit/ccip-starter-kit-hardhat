import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai";
import hre from "hardhat";


describe("Example 5", function () {
    enum PayFeesIn {
        Native,
        LINK
    }

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

        const basicMessageSenderFactory = await hre.ethers.getContractFactory("BasicMessageSender");
        const sender = await basicMessageSenderFactory.deploy(config.sourceRouter_, config.linkToken_);

        const basicMessageReceiverFactory = await hre.ethers.getContractFactory("BasicMessageReceiver");
        const receiver = await basicMessageReceiverFactory.deploy(config.destinationRouter_);

        return { alice, config, sender, receiver };
    }

    it("Should send and receive cross-chain message and pay for fees in native coins", async function () {
        const { alice, config, sender, receiver } = await loadFixture(deployFixture);

        await alice.sendTransaction({
            to: sender.address,
            value: 1_000_000_000_000_000_000n,
        });

        const messageToSend = "Hello, World!";

        await sender.connect(alice).send(config.chainSelector_, receiver.address, messageToSend, PayFeesIn.Native);

        const [latestMessageId, latestMessageSourceChainSelector, latestMessageSender, latestMessage] = await receiver.getLatestMessageDetails();

        expect(latestMessageSourceChainSelector).to.equal(config.chainSelector_);
        expect(latestMessageSender).to.equal(sender.address);
        expect(latestMessage).to.deep.equal(messageToSend);
    });
});
