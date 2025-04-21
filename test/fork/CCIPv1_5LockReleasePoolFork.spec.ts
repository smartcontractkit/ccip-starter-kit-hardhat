import { expect } from "chai";
import hre from "hardhat";
import { id, AbiCoder, ZeroAddress } from "ethers";
import {
  getEvm2EvmMessage,
  requestLinkFromTheFaucet,
  routeMessage,
} from "@chainlink/local/scripts/CCIPLocalSimulatorFork";
import {
  BurnMintERC677__factory,
  IRouterClient__factory,
  LockReleaseTokenPool__factory
} from "../../typechain-types";
import {
  getProviderRpcUrl,
  getLINKTokenAddress,
  getRouterConfig,
} from "../../helpers/utils";

describe("CCIP v1.5 LockReleasePool Fork Test", function () {
  it("Should transfer tokens using Chainlink's LockReleasePool", async function () {
    const [alice, bob] = await hre.ethers.getSigners();
    const [source, destination] = ["ethereumSepolia", "arbitrumSepolia"];

    // Get network details
    const sourceConfig = getRouterConfig(source);
    const destinationConfig = getRouterConfig(destination);
    const linkTokenAddress = getLINKTokenAddress(source);

    // Initialize simulator for source chain
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

    // Deploy token on source chain
    const sourceToken = await new BurnMintERC677__factory(alice).deploy(
      "Test Token",
      "TEST",
      18, // decimals
      hre.ethers.parseEther("1000000") // max supply
    );
    await sourceToken.waitForDeployment();
    const sourceTokenAddress = await sourceToken.getAddress();

    // Deploy LockReleaseTokenPool from Chainlink
    const sourceLockReleasePool = await new LockReleaseTokenPool__factory(alice).deploy(
      sourceTokenAddress,
      18, // token decimals
      [], // allowlist
      sourceConfig.address, // rmnProxy (renamed from armProxy)
      true, // acceptLiquidity
      sourceConfig.address // router address
    );
    await sourceLockReleasePool.waitForDeployment();
    const sourceLockReleasePoolAddress = await sourceLockReleasePool.getAddress();

    // Mint tokens to Alice for liquidity
    const amountToSend = 100n;
    const liquidityAmount = hre.ethers.parseEther("1000");
    await sourceToken.mint(alice.address, liquidityAmount + amountToSend);
    
    // Set Alice as rebalancer and provide liquidity to the source pool
    await sourceLockReleasePool.setRebalancer(alice.address);
    await sourceToken.approve(sourceLockReleasePoolAddress, liquidityAmount + amountToSend);
    await sourceLockReleasePool.provideLiquidity(liquidityAmount);

    // Initialize simulator for destination chain
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

    // Deploy token on destination chain
    const destinationToken = await new BurnMintERC677__factory(alice).deploy(
      "Test Token",
      "TEST",
      18, // decimals
      hre.ethers.parseEther("1000000") // max supply
    );
    await destinationToken.waitForDeployment();
    const destinationTokenAddress = await destinationToken.getAddress();

    // Deploy LockReleaseTokenPool for destination chain
    const destinationLockReleasePool = await new LockReleaseTokenPool__factory(alice).deploy(
      destinationTokenAddress,
      18, // token decimals
      [], // allowlist
      destinationConfig.address, // rmnProxy
      true, // acceptLiquidity
      destinationConfig.address // router address
    );
    await destinationLockReleasePool.waitForDeployment();
    const destinationLockReleasePoolAddress = await destinationLockReleasePool.getAddress();

    // Mint tokens for destination liquidity
    await destinationToken.mint(alice.address, liquidityAmount);
    
    // Set Alice as rebalancer and provide liquidity to the destination pool
    await destinationLockReleasePool.setRebalancer(alice.address);
    await destinationToken.approve(destinationLockReleasePoolAddress, liquidityAmount);
    await destinationLockReleasePool.provideLiquidity(liquidityAmount);

    // Configure pools
    // Return to source chain
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

    // Reconnect to source contracts
    const reconnectedSourcePool = LockReleaseTokenPool__factory.connect(
      sourceLockReleasePoolAddress,
      alice
    );

    // Configure source pool
    const sourceChainUpdate = [{
      remoteChainSelector: destinationConfig.chainSelector,
      remotePoolAddresses: [AbiCoder.defaultAbiCoder().encode(["address"], [destinationLockReleasePoolAddress])],
      remoteTokenAddress: AbiCoder.defaultAbiCoder().encode(["address"], [destinationTokenAddress]),
      outboundRateLimiterConfig: {
        isEnabled: true,
        capacity: 100000n,
        rate: 167n
      },
      inboundRateLimiterConfig: {
        isEnabled: true,
        capacity: 100000n,
        rate: 167n
      }
    }];

    await reconnectedSourcePool.applyChainUpdates([], sourceChainUpdate);

    // Switch to destination chain for configuration
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

    // Configure destination pool
    const reconnectedDestPool = LockReleaseTokenPool__factory.connect(
      destinationLockReleasePoolAddress,
      alice
    );

    const destChainUpdate = [{
      remoteChainSelector: sourceConfig.chainSelector,
      remotePoolAddresses: [AbiCoder.defaultAbiCoder().encode(["address"], [sourceLockReleasePoolAddress])],
      remoteTokenAddress: AbiCoder.defaultAbiCoder().encode(["address"], [sourceTokenAddress]),
      outboundRateLimiterConfig: {
        isEnabled: true,
        capacity: 100000n,
        rate: 167n
      },
      inboundRateLimiterConfig: {
        isEnabled: true,
        capacity: 100000n,
        rate: 167n
      }
    }];

    await reconnectedDestPool.applyChainUpdates([], destChainUpdate);

    // Return to source chain for transfer
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

    // Reconnect to source contracts for transfer
    const reconnectedSourceToken = BurnMintERC677__factory.connect(
      sourceTokenAddress,
      alice
    );

    // Request LINK for fees
    await requestLinkFromTheFaucet(linkTokenAddress, alice.address, hre.ethers.parseEther("20"));
    
    // Transfer tokens to the pool (lock the tokens)
    await reconnectedSourceToken.transfer(sourceLockReleasePoolAddress, amountToSend);
    
    // Connect to router
    const sourceRouter = IRouterClient__factory.connect(
      sourceConfig.address,
      alice
    );

    // Verify chain support
    const isChainSupported = await sourceRouter.isChainSupported(destinationConfig.chainSelector);
    expect(isChainSupported).to.be.true;
    
    // Prepare CCIP message
    const defaultAbiCoder = AbiCoder.defaultAbiCoder();
    const gasLimit = 200_000;
    const functionSelector = id("CCIP EVMExtraArgsV1").slice(0, 10);
    const extraArgs = defaultAbiCoder.encode(["uint256"], [gasLimit]);
    const encodedExtraArgs = `${functionSelector}${extraArgs.slice(2)}`;
    
    const message = {
      receiver: defaultAbiCoder.encode(["address"], [bob.address]),
      data: "0x",
      tokenAmounts: [{
        token: sourceTokenAddress,
        amount: amountToSend
      }],
      feeToken: ZeroAddress, // Use native token for fees
      extraArgs: encodedExtraArgs
    };
    
    // Get fees and send CCIP message
    const messageFees = await sourceRouter.getFee(destinationConfig.chainSelector, message);
    
    const tx = await sourceRouter.ccipSend(destinationConfig.chainSelector, message, {
      value: messageFees
    });
    
    const receipt = await tx.wait();
    expect(receipt?.status).to.equal(1);

    // Get message for routing
    const evm2EvmMessage = await getEvm2EvmMessage(receipt);
    expect(evm2EvmMessage).to.not.be.undefined;
    if (!evm2EvmMessage) {
      throw new Error("Failed to get EVM2EVM message");
    }

    // Switch to destination chain
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

    // Get bob's balance before receiving the tokens
    const reconnectedDestToken = BurnMintERC677__factory.connect(
      destinationTokenAddress,
      alice
    );
    const bobBalanceBefore = await reconnectedDestToken.balanceOf(bob.address);

    // Route the message
    await routeMessage(destinationConfig.address, evm2EvmMessage);
    
    // Check bob's balance after receiving the tokens
    const bobBalanceAfter = await reconnectedDestToken.balanceOf(bob.address);
    expect(bobBalanceAfter).to.equal(bobBalanceBefore + amountToSend);
  });
}); 