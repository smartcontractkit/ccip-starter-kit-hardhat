import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai";
import hre from "hardhat";
import { utils } from "ethers";


describe("Example 2", function () {
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

        const basicMessageReceiverFactory = await hre.ethers.getContractFactory("BasicMessageReceiver");
        const basicMessageReceiver = await basicMessageReceiverFactory.deploy(config.destinationRouter_);

        return { alice, basicMessageReceiver, config };
    }

    it("Should transfer CCIP test tokens from EOA to Smart Contract", async function () {
        const { alice, basicMessageReceiver, config } = await loadFixture(deployFixture);

        const mockCcipRouterFactory = await hre.ethers.getContractFactory("MockCCIPRouter");
        const mockCcipRouter = mockCcipRouterFactory.attach(config.sourceRouter_);

        const ccipBnMFactory = await hre.ethers.getContractFactory("BurnMintERC677Helper");
        const ccipBnM = ccipBnMFactory.attach(config.ccipBnM_);

        ccipBnM.drip(alice.address);
        const ONE_ETHER = 1_000_000_000_000_000_000n;

        expect(await ccipBnM.balanceOf(alice.address)).to.deep.equal(ONE_ETHER);

        const amountToSend = 100n;

        await ccipBnM.connect(alice).approve(mockCcipRouter.address, amountToSend);

        const tokenAmounts = [
            {
                token: config.ccipBnM_,
                amount: amountToSend,
            },
        ];

        const gasLimit = 200_000;

        const functionSelector = utils.id("CCIP EVMExtraArgsV1").slice(0, 10);
        const extraArgs = utils.defaultAbiCoder.encode(["uint256"], [gasLimit]);
        const encodedExtraArgs = `${functionSelector}${extraArgs.slice(2)}`;

        const message = {
            receiver: utils.defaultAbiCoder.encode(["address"], [basicMessageReceiver.address]),
            data: utils.defaultAbiCoder.encode(["string"], [""]), // no data
            tokenAmounts: tokenAmounts,
            feeToken: config.linkToken_,
            extraArgs: encodedExtraArgs,
        };

        const linkTokenFactory = await hre.ethers.getContractFactory("LinkToken");
        const linkToken = linkTokenFactory.attach(config.linkToken_);
        const fee = await mockCcipRouter.getFee(config.chainSelector_, message);
        await linkToken.connect(alice).approve(mockCcipRouter.address, fee);

        await mockCcipRouter.connect(alice).ccipSend(config.chainSelector_, message);

        expect(await ccipBnM.balanceOf(alice.address)).to.deep.equal(ONE_ETHER - amountToSend);
        expect(await ccipBnM.balanceOf(basicMessageReceiver.address)).to.deep.equal(amountToSend);
    });
});
