import { expect } from "chai";
import hre from "hardhat";
import { id, AbiCoder } from "ethers";
import {
  getEvm2EvmMessage,
  requestLinkFromTheFaucet,
  routeMessage,
} from "@chainlink/local/scripts/CCIPLocalSimulatorFork";
import {
  BurnMintERC677Helper,
  IRouterClient,
  IRouterClient__factory,
  LinkTokenInterface,
} from "../../typechain-types";
import {
  getProviderRpcUrl,
  getLINKTokenAddress,
  getRouterConfig,
  getFaucetTokensAddresses,
} from "../../helpers/utils";

describe("Example 1 - Fork", function () {
  it("Should transfer CCIP test tokens from EOA to EOA", async function () {
    const [alice, bob] = await hre.ethers.getSigners();
    const [source, destination] = ["ethereumSepolia", "arbitrumSepolia"];

    const linkTokenAddress = getLINKTokenAddress(source);
    const sourceRouterAddress = getRouterConfig(source).address;
    const sourceCCIPBnMTokenAddress = getFaucetTokensAddresses(source).ccipBnM;
    const destinationCCIPBnMTokenAddress =
      getFaucetTokensAddresses(destination).ccipBnM;
    const {
      address: destinationRouterAddress,
      chainSelector: destinationChainSelector,
    } = getRouterConfig(destination);

    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: getProviderRpcUrl(source),
          },
        },
      ],
    });

    // Estimate gas fees dynamically - Useful in a forked environment
    const feeData = await hre.ethers.provider.getFeeData();
    const sourceOverrides = {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };

    const sourceRouter = IRouterClient__factory.connect(
      sourceRouterAddress,
      alice
    ) as IRouterClient;

    const ccipBnMFactory = await hre.ethers.getContractFactory(
      "BurnMintERC677Helper"
    );
    const sourceCCIPBnM = ccipBnMFactory.attach(
      sourceCCIPBnMTokenAddress
    ) as BurnMintERC677Helper;

    await sourceCCIPBnM.connect(alice).drip(alice.address, sourceOverrides);

    const amountToSend = 100n;

    await sourceCCIPBnM
      .connect(alice)
      .approve(sourceRouterAddress, amountToSend);

    const tokenAmounts = [
      {
        token: sourceCCIPBnMTokenAddress,
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
      feeToken: linkTokenAddress,
      extraArgs: encodedExtraArgs,
    };

    const linkTokenFactory = await hre.ethers.getContractFactory("LinkToken");
    const linkToken = linkTokenFactory.attach(
      linkTokenAddress
    ) as LinkTokenInterface;
    const fee = await sourceRouter.getFee(destinationChainSelector, message);
    await requestLinkFromTheFaucet(linkTokenAddress, alice.address, fee);

    await linkToken.connect(alice).approve(sourceRouter, fee, sourceOverrides);

    const aliceBalanceBefore = await sourceCCIPBnM.balanceOf(alice.address);

    const tx = await sourceRouter
      .connect(alice)
      .ccipSend(destinationChainSelector, message, sourceOverrides);

    const receipt = await tx.wait();
    if (!receipt) throw Error("Transaction not included in the block");

    const evm2EvmMessage = getEvm2EvmMessage(receipt);

    if (!evm2EvmMessage) throw Error("EVM2EVM message not found");

    expect(await sourceCCIPBnM.balanceOf(alice.address)).to.deep.equal(
      aliceBalanceBefore - amountToSend
    );

    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: getProviderRpcUrl(destination),
          },
        },
      ],
    });

    await routeMessage(destinationRouterAddress, evm2EvmMessage);

    const destinationBnM = ccipBnMFactory.attach(
      destinationCCIPBnMTokenAddress
    ) as BurnMintERC677Helper;

    expect(await destinationBnM.balanceOf(bob.address)).to.deep.equal(
      amountToSend
    );
  });
});
