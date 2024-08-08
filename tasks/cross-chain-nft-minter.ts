import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import {
  getPayFeesIn,
  getPrivateKey,
  getProviderRpcUrl,
  getRouterConfig,
} from "../helpers/utils";
import { Wallet, JsonRpcProvider } from "ethers";
import {
  DestinationMinter,
  DestinationMinter__factory,
  MyNFT,
  MyNFT__factory,
  SourceMinter,
  SourceMinter__factory,
} from "../typechain-types";
import { Spinner } from "../helpers/spinner";
import { LINK_ADDRESSES } from "../helpers/constants";
import { getCcipMessageId } from "./helpers";

task(
  `deploy-destination-cross-chain-nft-minter`,
  `Deploys MyNFT.sol and DestinationMinter.sol smart contracts`
)
  .addOptionalParam(
    `router`,
    `The address of the Router contract on the destination blockchain`
  )
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const routerAddress = taskArguments.router
        ? taskArguments.router
        : getRouterConfig(hre.network.name).address;

      const privateKey = getPrivateKey();
      const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

      const provider = new JsonRpcProvider(rpcProviderUrl);
      const wallet = new Wallet(privateKey);
      const deployer = wallet.connect(provider);

      const spinner: Spinner = new Spinner();

      console.log(
        `ℹ️  Attempting to deploy MyNFT smart contract on the ${hre.network.name} blockchain using ${deployer.address} address`
      );
      spinner.start();

      const myNftFactory: MyNFT__factory = (await hre.ethers.getContractFactory(
        "MyNFT"
      )) as MyNFT__factory;
      const myNft: MyNFT = await myNftFactory.deploy();
      await myNft.waitForDeployment();
      const myNftAddress = await myNft.getAddress();

      spinner.stop();
      console.log(
        `✅ MyNFT contract deployed at address ${myNftAddress} on the ${hre.network.name} blockchain`
      );

      console.log(
        `ℹ️  Attempting to deploy DestinationMinter smart contract on the ${hre.network.name} blockchain using ${deployer.address} address, with the Router address ${routerAddress} provided as constructor argument`
      );
      spinner.start();

      const destinationMinterFactory: DestinationMinter__factory =
        (await hre.ethers.getContractFactory(
          "DestinationMinter"
        )) as DestinationMinter__factory;
      const destinationMinter: DestinationMinter =
        await destinationMinterFactory.deploy(routerAddress, myNftAddress);
      await destinationMinter.waitForDeployment();

      const destinationMinterAddress = await destinationMinter.getAddress();

      spinner.stop();
      console.log(
        `✅ DestinationMinter contract deployed at address ${destinationMinterAddress} on the ${hre.network.name} blockchain`
      );

      console.log(
        `ℹ️  Attempting to grant the minter role to the DestinationMinter smart contract`
      );
      spinner.start();

      const tx = await myNft.transferOwnership(destinationMinterAddress);
      await tx.wait();

      spinner.stop();
      console.log(
        `✅ DestinationMinter can now mint MyNFTs. Transaction hash: ${tx.hash}`
      );
    }
  );

task(
  `deploy-source-cross-chain-nft-minter`,
  `Deploys SourceMinter.sol smart contract`
)
  .addOptionalParam(
    `router`,
    `The address of the Router contract on the source blockchain`
  )
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const routerAddress = taskArguments.router
        ? taskArguments.router
        : getRouterConfig(hre.network.name).address;
      const linkAddress = taskArguments.link
        ? taskArguments.link
        : LINK_ADDRESSES[hre.network.name];

      const privateKey = getPrivateKey();
      const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

      const provider = new JsonRpcProvider(rpcProviderUrl);
      const wallet = new Wallet(privateKey);
      const deployer = wallet.connect(provider);

      const spinner: Spinner = new Spinner();

      console.log(
        `ℹ️  Attempting to deploy SourceMinter smart contract on the ${hre.network.name} blockchain using ${deployer.address} address, with the Router address ${routerAddress} and LINK address ${linkAddress} provided as constructor arguments`
      );
      spinner.start();

      const sourceMinterFactory: SourceMinter__factory =
        (await hre.ethers.getContractFactory(
          "SourceMinter"
        )) as SourceMinter__factory;
      const sourceMinter: SourceMinter = await sourceMinterFactory.deploy(
        routerAddress,
        linkAddress
      );
      await sourceMinter.waitForDeployment();
      const sourceMinterAddress = await sourceMinter.getAddress();

      spinner.stop();
      console.log(
        `✅ SourceMinter contract deployed at address ${sourceMinterAddress} on the ${hre.network.name} blockchain`
      );
    }
  );

task(`cross-chain-mint`, `Mints the new NFT by sending the Cross-Chain Message`)
  .addParam(
    `sourceBlockchain`,
    `The name of the source blockchain (for example ethereumSepolia)`
  )
  .addParam(
    `sourceMinter`,
    `The address of the SourceMinter.sol smart contract on the source blockchain`
  )
  .addParam(
    `destinationBlockchain`,
    `The name of the destination blockchain (for example polygonAmoy)`
  )
  .addParam(
    `destinationMinter`,
    `The address of the DestinationMinter.sol smart contract on the destination blockchain`
  )
  .addParam(`payFeesIn`, `Choose between 'Native' and 'LINK'`)
  .setAction(async (taskArguments: TaskArguments) => {
    const {
      sourceBlockchain,
      sourceMinter,
      destinationBlockchain,
      destinationMinter,
      payFeesIn,
    } = taskArguments;

    const privateKey = getPrivateKey();
    const sourceRpcProviderUrl = getProviderRpcUrl(sourceBlockchain);

    const sourceProvider = new JsonRpcProvider(sourceRpcProviderUrl);
    const wallet = new Wallet(privateKey);
    const signer = wallet.connect(sourceProvider);

    const spinner: Spinner = new Spinner();

    const sourceMinterContract: SourceMinter = SourceMinter__factory.connect(
      sourceMinter,
      signer
    );

    const destinationChainSelector = getRouterConfig(
      destinationBlockchain
    ).chainSelector;
    const fees = getPayFeesIn(payFeesIn);

    console.log(
      `ℹ️  Attempting to call the mint function of the SourceMinter.sol smart contract on the ${sourceBlockchain} from ${signer.address} account`
    );
    spinner.start();

    const tx = await sourceMinterContract.mint(
      destinationChainSelector,
      destinationMinter,
      fees
    );

    const receipt = await tx.wait();

    spinner.stop();
    console.log(`✅ Mint request sent, transaction hash: ${tx.hash}`);

    await getCcipMessageId(tx, receipt, sourceProvider);

    console.log(`✅ Task cross-chain-mint finished with the execution`);
  });

task(
  "cross-chain-mint-balance-of",
  "Gets the balance of MyNFTs for provided address"
)
  .addParam(`myNft`, `The address of the MyNFT smart contract`)
  .addParam(
    `blockchain`,
    `The blockchain where the MyNFT smart contract was deployed`
  )
  .addParam(`owner`, `The address to check the balance of MyNFTs`)
  .setAction(async (taskArguments: TaskArguments) => {
    const rpcProviderUrl = getProviderRpcUrl(taskArguments.blockchain);
    const provider = new JsonRpcProvider(rpcProviderUrl);

    const spinner: Spinner = new Spinner();

    const myNft: MyNFT = MyNFT__factory.connect(taskArguments.myNft, provider);

    console.log(
      `ℹ️  Attempting to check the balance of MyNFTs (${taskArguments.myNft}) for the ${taskArguments.owner} account`
    );
    spinner.start();

    const balanceOf = await myNft.balanceOf(taskArguments.owner);

    spinner.stop();
    console.log(
      `ℹ️  The balance of MyNFTs of the ${taskArguments.owner} account is ${balanceOf}`
    );
  });
