import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig } from "../helpers/utils";
import { Wallet, JsonRpcProvider } from "ethers";
import {
  ProgrammableTokenTransfers,
  ProgrammableTokenTransfers__factory,
} from "../typechain-types";
import { Spinner } from "../helpers/spinner";

task(
  `deploy-programmable-token-transfers`,
  `Deploys the ProgrammableTokenTransfers smart contract`
)
  .addOptionalParam(`router`, `The address of the Router contract`)
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
        `ℹ️  Attempting to deploy ProgrammableTokenTransfers on the ${hre.network.name} blockchain using ${deployer.address} address, with the Router address ${routerAddress} provided as constructor argument`
      );
      spinner.start();

      const programmableTokenTransfersFactory: ProgrammableTokenTransfers__factory =
        await hre.ethers.getContractFactory("ProgrammableTokenTransfers");
      const programmableTokenTransfers: ProgrammableTokenTransfers =
        await programmableTokenTransfersFactory.deploy(routerAddress);
      await programmableTokenTransfers.waitForDeployment();
      const programmableTokenTransfersAddress =
        await programmableTokenTransfers.getAddress();

      spinner.stop();
      console.log(
        `✅ ProgrammableTokenTransfers deployed at address ${programmableTokenTransfersAddress} on ${hre.network.name} blockchain`
      );
    }
  );
