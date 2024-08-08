import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import {
  getPrivateKey,
  getProviderRpcUrl,
  getFaucetTokensAddresses,
} from "../helpers/utils";
import { Wallet, JsonRpcProvider } from "ethers";
import {
  BurnMintERC677Helper,
  BurnMintERC677Helper__factory,
} from "../typechain-types";
import { Spinner } from "../helpers/spinner";

task(
  `faucet`,
  `Mints 10**18 units of CCIP-BnM and CCIP-LnM tokens to receiver address`
)
  .addParam(`receiver`, `The address to receive tokens`)
  .addOptionalParam(`ccipBnm`, `The address of the CCIP-BnM token`)
  .addOptionalParam(`ccipLnm`, `The address of the CCIP-LnM token`)
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const { receiver, ccipBnm, ccipLnm } = taskArguments;

      const ccipBnmAddress = ccipBnm
        ? ccipBnm
        : getFaucetTokensAddresses(hre.network.name).ccipBnM;

      const privateKey = getPrivateKey();
      const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

      const provider = new JsonRpcProvider(rpcProviderUrl);
      const wallet = new Wallet(privateKey);
      const signer = wallet.connect(provider);

      const spinner: Spinner = new Spinner();

      console.log(
        `ℹ️  Attempting to mint 10**18 units of CCIP-BnM token (${ccipBnmAddress}) on ${hre.network.name} blockchain`
      );
      spinner.start();

      const ccipBnM: BurnMintERC677Helper =
        BurnMintERC677Helper__factory.connect(ccipBnmAddress, signer);
      const tx = await ccipBnM.drip(receiver);
      await tx.wait();

      spinner.stop();
      console.log(`✅ CCIP-BnM tokens minted, transaction hash: ${tx.hash}`);

      console.log(
        `ℹ️  CCIP-LnM tokens can be minted only on Ethereum Sepolia testnet`
      );

      if (hre.network.name === `ethereumSepolia`) {
        const ccipLnmAddress = ccipLnm
          ? ccipLnm
          : getFaucetTokensAddresses(hre.network.name).ccipLnM;

        console.log(
          `ℹ️  Attempting to mint 10**18 units of CCIP-LnM token (${ccipLnmAddress}) on ${hre.network.name} blockchain`
        );
        spinner.start();

        const ccipLnM: BurnMintERC677Helper =
          BurnMintERC677Helper__factory.connect(ccipLnmAddress, signer);
        const tx = await ccipLnM.drip(receiver);
        await tx.wait();

        spinner.stop();
        console.log(`✅ CCIP-LnM tokens minted, transaction hash: ${tx.hash}`);
      }

      console.log(`✅ Task faucet finished with the execution`);
    }
  );
