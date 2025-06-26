import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { AbiCoder, ZeroAddress } from "ethers";
import { 
  BurnMintERC677__factory,
  BurnMintTokenPool__factory,
  LockReleaseTokenPool__factory,
  IRouterClient__factory 
} from "../typechain-types";
import { 
  getRouterConfig,
  getLINKTokenAddress
} from "../helpers/utils";
import { Spinner } from "../helpers/spinner";

// Task to deploy BurnMintERC677 token
task("deploy-token", "Deploys a BurnMintERC677 token and optionally mints initial tokens")
  .addParam("name", "Name of the token")
  .addParam("symbol", "Symbol of the token")
  .addOptionalParam("decimals", "Decimals of the token", "18")
  .addOptionalParam("supply", "Total supply (in Ether unit)", "1000000000")
  .addOptionalParam("mint", "Amount to mint to the recipient after deployment (in Ether unit)")
  .addOptionalParam("recipient", "Address to receive minted tokens (defaults to deployer)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { name, symbol, decimals, supply, mint, recipient } = taskArgs;
    const [deployer] = await hre.ethers.getSigners();
    const spinner = new Spinner();

    console.log(`Deploying ${name} (${symbol}) token on network ${hre.network.name}`);
    spinner.start();

    const tokenFactory = await hre.ethers.getContractFactory("BurnMintERC677", deployer) as BurnMintERC677__factory;
    const tokenDecimals = parseInt(decimals);
    const token = await tokenFactory.deploy(
      name,
      symbol,
      tokenDecimals,
      hre.ethers.parseUnits(supply, tokenDecimals)
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    spinner.stop();
    console.log(`✅ ${name} (${symbol}) token deployed at address: ${tokenAddress} on ${hre.network.name}`);

    // Mint initial tokens if requested
    if (mint) {
        // Grant MINTER_ROLE to the deployer first
        spinner.start();
        console.log(`Granting MINTER_ROLE to deployer ${deployer.address}...`);
        try {
            // Use the specific grantMintRole function
            const grantMintRoleTx = await token.grantMintRole(deployer.address);
            await grantMintRoleTx.wait();
            spinner.stop(); // Stop spinner after granting role
            console.log(`✅ MINTER_ROLE granted to deployer.`);
        } catch (error) {
            spinner.stop();
            console.error(`❌ Failed to grant MINTER_ROLE to deployer using grantMintRole. Error: ${error}`);
            throw error; // Re-throw if granting fails
        }

        const mintAmount = hre.ethers.parseUnits(mint, tokenDecimals);
        const mintRecipient = recipient ? recipient : deployer.address;
      
        spinner.start();
        console.log(`Minting ${mint} ${symbol} tokens to ${mintRecipient}...`);
        try {
            const mintTx = await token.mint(mintRecipient, mintAmount);
            await mintTx.wait();
            spinner.stop();
            console.log(`✅ Successfully minted ${mint} ${symbol} to ${mintRecipient}`);
        } catch (error) {
            spinner.stop();
            console.error(`❌ Failed to mint tokens. Ensure deployer (${deployer.address}) has MINTER_ROLE.`);
            throw error;
        }
    }

    return tokenAddress;
  });

// Task to deploy and setup BurnMintTokenPool
task("setup-burn-mint-pool", "Deploys and sets up a BurnMintTokenPool")
  .addParam("token", "Address of the BurnMintERC677 token")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { token } = taskArgs;
    const [deployer] = await hre.ethers.getSigners();
    const network = hre.network.name;
    const routerConfig = getRouterConfig(network);
    const spinner = new Spinner();

    if (!routerConfig) {
      throw new Error(`Router configuration not found for network ${network}`);
    }

    console.log(`Deploying BurnMintTokenPool for token ${token} on network ${network}`);
    spinner.start();

    const poolFactory = await hre.ethers.getContractFactory("BurnMintTokenPool", deployer) as BurnMintTokenPool__factory;
    const pool = await poolFactory.deploy(
      token,
      18, // Assuming token decimals is 18
      [], // allowlist
      routerConfig.address, // rmnProxy
      routerConfig.address  // router
    );
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log(`  -> BurnMintTokenPool deployed at: ${poolAddress}`);

    // Grant roles
    const tokenContract = BurnMintERC677__factory.connect(token, deployer);
    console.log(`  -> Granting MINT_ROLE to pool...`);
    const mintTx = await tokenContract.grantMintRole(poolAddress);
    await mintTx.wait();
    console.log(`  -> Granting BURN_ROLE to pool...`);
    const burnTx = await tokenContract.grantBurnRole(poolAddress);
    await burnTx.wait();

    spinner.stop();
    console.log(`✅ BurnMintTokenPool setup complete for token ${token} at address: ${poolAddress} on ${network}`);
    return poolAddress;
  });

// Task to deploy and setup LockReleaseTokenPool
task("setup-lock-release-pool", "Deploys and sets up a LockReleaseTokenPool")
  .addParam("token", "Address of the ERC20 token")
  .addOptionalParam("liquidity", "Amount of liquidity to add (in Ether unit)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { token, liquidity } = taskArgs;
    const [deployer] = await hre.ethers.getSigners();
    const network = hre.network.name;
    const routerConfig = getRouterConfig(network);
    const spinner = new Spinner();

    if (!routerConfig) {
      throw new Error(`Router configuration not found for network ${network}`);
    }

    console.log(`Deploying LockReleaseTokenPool for token ${token} on network ${network}`);
    spinner.start();

    const poolFactory = await hre.ethers.getContractFactory("LockReleaseTokenPool", deployer) as LockReleaseTokenPool__factory;
    const pool = await poolFactory.deploy(
      token,
      18, // Assuming token decimals is 18
      [], // allowlist
      routerConfig.address, // rmnProxy
      true, // acceptLiquidity
      routerConfig.address  // router
    );
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log(`  -> LockReleaseTokenPool deployed at: ${poolAddress}`);

    // Add liquidity if specified
    if (liquidity) {
      const liquidityAmount = hre.ethers.parseEther(liquidity);
      const tokenContract = BurnMintERC677__factory.connect(token, deployer); // Assuming BurnMintERC677 for minting
      
      console.log(`  -> Minting ${liquidity} tokens to deployer for liquidity...`);
      const mintTx = await tokenContract.mint(deployer.address, liquidityAmount);
      await mintTx.wait();
      
      console.log(`  -> Setting deployer as rebalancer...`);
      const rebalancerTx = await pool.setRebalancer(deployer.address);
      await rebalancerTx.wait();
      
      console.log(`  -> Approving pool to spend ${liquidity} tokens...`);
      const approveTx = await tokenContract.approve(poolAddress, liquidityAmount);
      await approveTx.wait();
      
      console.log(`  -> Providing ${liquidity} tokens as liquidity...`);
      const liquidityTx = await pool.provideLiquidity(liquidityAmount);
      await liquidityTx.wait();
    }

    spinner.stop();
    console.log(`✅ LockReleaseTokenPool setup complete for token ${token} at address: ${poolAddress} on ${network}`);
    return poolAddress;
  });

// Task to configure a pool for cross-chain communication
task("configure-pool", "Configures a pool to know about its remote counterpart")
  .addParam("localPool", "Address of the pool on the current network")
  .addParam("remoteNetwork", "Name of the remote network")
  .addParam("remotePool", "Address of the pool on the remote network")
  .addParam("remoteToken", "Address of the token on the remote network")
  .addParam("poolType", "Type of the local pool (burnMint or lockRelease)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { localPool, remoteNetwork, remotePool, remoteToken, poolType } = taskArgs;
    const [deployer] = await hre.ethers.getSigners();
    const localNetwork = hre.network.name;
    const remoteConfig = getRouterConfig(remoteNetwork);
    const spinner = new Spinner();

    if (!remoteConfig) {
      throw new Error(`Router configuration not found for remote network ${remoteNetwork}`);
    }

    console.log(`Configuring ${poolType} ${localPool} on ${localNetwork} to communicate with ${remotePool} on ${remoteNetwork}`);
    spinner.start();

    const poolInterface = poolType === "burnMint" 
      ? BurnMintTokenPool__factory.createInterface()
      : LockReleaseTokenPool__factory.createInterface();
    
    const poolContract = new hre.ethers.Contract(localPool, poolInterface, deployer);

    const chainUpdate = [{
      remoteChainSelector: remoteConfig.chainSelector,
      remotePoolAddresses: [AbiCoder.defaultAbiCoder().encode(["address"], [remotePool])],
      remoteTokenAddress: AbiCoder.defaultAbiCoder().encode(["address"], [remoteToken]),
      // Default rate limiter config (adjust as needed)
      outboundRateLimiterConfig: { isEnabled: true, capacity: "10000000000000000000", rate: "16666666666666666" }, // 10 tokens/sec, 10 capacity
      inboundRateLimiterConfig: { isEnabled: true, capacity: "10000000000000000000", rate: "16666666666666666" }
    }];

    console.log(`  -> Applying chain update...`);
    const tx = await poolContract.applyChainUpdates([], chainUpdate);
    await tx.wait();

    spinner.stop();
    console.log(`✅ ${poolType} ${localPool} on ${localNetwork} configured successfully.`);
  });

// Task to send tokens via CCIP
task("send-ccip-tokens", "Sends tokens via CCIP using a specified pool")
  .addParam("pool", "Address of the source token pool")
  .addParam("token", "Address of the token being sent")
  .addParam("destinationNetwork", "Name of the destination network")
  .addParam("receiver", "Address of the recipient on the destination network")
  .addParam("amount", "Amount of tokens to send (in Ether unit)")
  .addParam("poolType", "Type of the source pool (burnMint or lockRelease)")
  .addOptionalParam("feeToken", "Address of token for fees (LINK or ZeroAddress for native)", ZeroAddress)
  .addOptionalParam("gasLimit", "Gas limit for destination execution", "200000")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    // Import getEvm2EvmMessage *inside* the action
    const { getEvm2EvmMessage } = await import("@chainlink/local/scripts/CCIPLocalSimulatorFork");

    const {
      pool: poolAddress,
      token: tokenAddress,
      destinationNetwork,
      receiver,
      amount,
      poolType,
      feeToken,
      gasLimit
    } = taskArgs;
    const [deployer] = await hre.ethers.getSigners();
    const sourceNetwork = hre.network.name;
    const sourceConfig = getRouterConfig(sourceNetwork);
    const destinationConfig = getRouterConfig(destinationNetwork);
    const spinner = new Spinner();

    if (!sourceConfig) throw new Error(`Router configuration not found for source network ${sourceNetwork}`);
    if (!destinationConfig) throw new Error(`Router configuration not found for destination network ${destinationNetwork}`);

    console.log(`Sending ${amount} tokens from ${sourceNetwork} to ${receiver} on ${destinationNetwork} via ${poolType} pool ${poolAddress}`);
    spinner.start();

    const sourceRouter = IRouterClient__factory.connect(sourceConfig.address, deployer);
    const tokenContract = BurnMintERC677__factory.connect(tokenAddress, deployer); // Assuming BurnMint for approve/transfer
    const amountToSend = hre.ethers.parseEther(amount);

    // Approve and transfer tokens based on pool type
    if (poolType === "lockRelease") {
      console.log(`  -> Approving router ${sourceConfig.address} to spend ${amount} tokens...`);
      const approveTx = await tokenContract.approve(sourceConfig.address, amountToSend);
      await approveTx.wait();
      // Tokens are transferred implicitly by CCIP for lock/release
    } else if (poolType === "burnMint") {
      console.log(`  -> Approving pool ${poolAddress} to spend ${amount} tokens...`);
      const approveTx = await tokenContract.approve(poolAddress, amountToSend);
      await approveTx.wait();
      console.log(`  -> Transferring ${amount} tokens to pool ${poolAddress} to be burned...`);
      const transferTx = await tokenContract.transfer(poolAddress, amountToSend); // Transfer to pool, pool burns internally
      await transferTx.wait();
    } else {
      spinner.stop();
      throw new Error("Invalid poolType specified. Use 'burnMint' or 'lockRelease'.");
    }

    // Prepare CCIP message
    const defaultAbiCoder = AbiCoder.defaultAbiCoder();
    const functionSelector = hre.ethers.id("CCIP EVMExtraArgsV1").slice(0, 10);
    const extraArgs = defaultAbiCoder.encode(["uint256"], [parseInt(gasLimit)]);
    const encodedExtraArgs = `${functionSelector}${extraArgs.slice(2)}`;

    const message = {
      receiver: defaultAbiCoder.encode(["address"], [receiver]),
      data: "0x", // No data
      tokenAmounts: poolType === "lockRelease" 
        ? [{ token: tokenAddress, amount: amountToSend }]
        : [], // BurnMint pools don't need tokenAmounts in the message
      feeToken: feeToken,
      extraArgs: encodedExtraArgs,
    };

    // Get fees
    console.log(`  -> Fetching CCIP fees...`);
    const fees = await sourceRouter.getFee(destinationConfig.chainSelector, message);
    console.log(`  -> CCIP fee: ${hre.ethers.formatUnits(fees, feeToken === ZeroAddress ? 18 : 18)} ${feeToken === ZeroAddress ? 'Native' : 'LINK'}`); // Assume 18 decimals for LINK

    let txOptions: any = {};
    if (feeToken === ZeroAddress) {
      txOptions.value = fees;
    } else {
      const linkTokenAddress = getLINKTokenAddress(sourceNetwork);
      if(feeToken.toLowerCase() !== linkTokenAddress.toLowerCase()){
          spinner.stop();
          throw new Error(`Fee token address ${feeToken} does not match LINK token address ${linkTokenAddress} on ${sourceNetwork}`);
      }
      const linkToken = new hre.ethers.Contract(linkTokenAddress, ["function approve(address spender, uint256 amount) returns (bool)"], deployer);
      console.log(`  -> Approving router to spend ${hre.ethers.formatUnits(fees, 18)} LINK for fees...`);
      const approveFeeTx = await linkToken.approve(sourceConfig.address, fees);
      await approveFeeTx.wait();
    }

    // Send CCIP message
    console.log(`  -> Sending CCIP message...`);
    const sendTx = await sourceRouter.ccipSend(destinationConfig.chainSelector, message, txOptions);
    const receipt = await sendTx.wait();

    spinner.stop();
    if (receipt?.status !== 1) {
        console.error("❌ CCIP send transaction failed!");
        return;
    }
    console.log(`✅ CCIP message sent successfully! Transaction hash: ${receipt.hash}`);

  }); 