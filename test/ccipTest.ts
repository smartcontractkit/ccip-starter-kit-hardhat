// import {
//     time,
//     loadFixture,
//   } from "@nomicfoundation/hardhat-toolbox/network-helpers";
//   import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
//   import { expect } from "chai";
  import { constants } from "ethers";
import { ethers } from "hardhat";
  
  describe("Lock", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployOneYearLockFixture() {
      
  
      // Contracts are deployed using the first signer/account by default
      const [owner, otherAccount] = await ethers.getSigners();
  
      const MockRouter = await ethers.getContractFactory("MockRouter");
      const mockRouter = await MockRouter.deploy();

      const LinkToken = await ethers.getContractFactory("LinkToken");
      const linkToken = await LinkToken.deploy();

      const Token = await ethers.getContractFactory("Token");
      const token0 = await Token.deploy(ethers.utils.parseEther("1000000"));

      const BasicMessageSender = await ethers.getContractFactory("BasicMessageSender");
      const basicMessageSender = await BasicMessageSender.deploy(mockRouter.address, linkToken.address);

      const BasicTokenSender = await ethers.getContractFactory("BasicTokenSender");
      const basicTokenSender = await BasicTokenSender.deploy(mockRouter.address, linkToken.address);

      const BasicMessageReceiver = await ethers.getContractFactory("BasicMessageReceiver");
      const basicMessageReceiver = await BasicMessageReceiver.deploy(mockRouter.address);
  
      return {mockRouter, linkToken, basicMessageSender, basicTokenSender, basicMessageReceiver , owner, otherAccount, token0 };
    }
  
    describe("Deployment", function () {
      it("Test transfer message", async function () {
        // const { mockRouter } = await loadFixture(deployOneYearLockFixture);
        const deployObject = await deployOneYearLockFixture();
        console.log("mock router address", deployObject.mockRouter.address)
        console.log("link balance", ethers.utils.formatEther(await deployObject.linkToken.balanceOf(deployObject.owner.address)))
        const tx = await deployObject.basicMessageSender.send(
            "1", //target chain selector
            deployObject.basicMessageReceiver.address,
            "Hello",
            "0"
        )

        // return;
        const latestMessageDetails = await deployObject.basicMessageReceiver.getLatestMessageDetails();
        console.log(`ℹ️ Latest Message Details:`);
        console.log(`- Message Id: ${latestMessageDetails[0]}`);
        console.log(`- Source Chain Selector: ${latestMessageDetails[1]}`);
        console.log(`- Sender: ${latestMessageDetails[2]}`);
        console.log(`- Message Text: ${latestMessageDetails[3]}`);
      });


      it("Test transfer tokens", async function () {
        // const { mockRouter } = await loadFixture(deployOneYearLockFixture);
        const deployObject = await deployOneYearLockFixture();
        console.log("mock router address", deployObject.mockRouter.address)
        console.log("link balance", ethers.utils.formatEther(await deployObject.linkToken.balanceOf(deployObject.owner.address)))
        
        const tokenAmounts = [
            {
                token: deployObject.token0.address,
                amount: ethers.utils.parseEther("100")
            },
        ];

        // const message = {
        //     receiver: ethers.utils.defaultAbiCoder.encode(["address"], [receiver]),
        //     data: ethers.utils.defaultAbiCoder.encode(["string"], [""]), // no data
        //     tokenAmounts: tokenAmounts,
        //     // feeToken: feeTokenAddress ? feeTokenAddress : constants.AddressZero,
        //     feeToken: constants.AddressZero,
        //     extraArgs: encodedExtraArgs,
        // };
        console.log("receiver balance befor:", ethers.utils.formatEther(await deployObject.token0.balanceOf(deployObject.basicMessageReceiver.address)))
        await deployObject.token0.approve(deployObject.basicTokenSender.address, ethers.utils.parseEther("100"))
        const tx = await deployObject.basicTokenSender.send(
            "1", //target chain selector
            deployObject.basicMessageReceiver.address,
            tokenAmounts,
            1
        )
        console.log("receiver balance after:", ethers.utils.formatEther(await deployObject.token0.balanceOf(deployObject.basicMessageReceiver.address)))
        // return;
        const latestMessageDetails = await deployObject.basicMessageReceiver.getLatestMessageDetails();
        console.log(`ℹ️ Latest Message Details:`);
        console.log(`- Message Id: ${latestMessageDetails[0]}`);
        console.log(`- Source Chain Selector: ${latestMessageDetails[1]}`);
        console.log(`- Sender: ${latestMessageDetails[2]}`);
        console.log(`- Message Text: ${latestMessageDetails[3]}`);
      });
    });
  });
  