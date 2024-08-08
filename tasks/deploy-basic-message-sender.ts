import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig } from "../helpers/utils";
import { Wallet, JsonRpcProvider } from "ethers";
import { Spinner } from "../helpers/spinner";
import { LINK_ADDRESSES } from "../helpers/constants";
import {
  BasicMessageSender,
  BasicMessageSender__factory,
} from "../typechain-types";

task(
  `deploy-basic-message-sender`,
  `Deploys the BasicMessageSender smart contract`
)
  .addOptionalParam(`router`, `The address of the Router contract`)
  .addOptionalParam(`link`, `The address of the LINK token`)
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
        `ℹ️  Attempting to deploy BasicMessageSender on the ${hre.network.name} blockchain using ${deployer.address} address, with the Router address ${routerAddress} and LINK address ${linkAddress} provided as constructor arguments`
      );
      spinner.start();

      const basicMessageSenderFactory: BasicMessageSender__factory =
        (await hre.ethers.getContractFactory(
          "BasicMessageSender"
        )) as BasicMessageSender__factory;
      const basicMessageSender: BasicMessageSender =
        await basicMessageSenderFactory.deploy(routerAddress, linkAddress);
      await basicMessageSender.waitForDeployment();
      const basicMessageSenderAddress = await basicMessageSender.getAddress();

      spinner.stop();
      console.log(
        `✅ BasicMessageSender deployed at address ${basicMessageSenderAddress} on ${hre.network.name} blockchain`
      );
    }
  );
