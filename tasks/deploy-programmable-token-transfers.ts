import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getRouterConfig, getSigner } from "./utils";
import { Spinner } from "../utils/spinner";

task(`deploy-programmable-token-transfers`, `Deploys the ProgrammableTokenTransfers smart contract`)
    .addOptionalParam(`router`, `The address of the Router contract`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const blockchainNetwork = hre.network.name;
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(blockchainNetwork).address;

        const signer = getSigner(blockchainNetwork);

        const spinner: Spinner = new Spinner();

        console.log(`ℹ️  Attempting to deploy ProgrammableTokenTransfers on the ${blockchainNetwork} blockchain using ${signer.address} address, with the Router address ${routerAddress} provided as constructor argument`);
        spinner.start();

        const programmableTokenTransfersFactory = await hre.ethers.getContractFactory('ProgrammableTokenTransfers');
        const programmableTokenTransfers = await programmableTokenTransfersFactory.deploy(routerAddress);
        await programmableTokenTransfers.deployed();

        spinner.stop();
        console.log(`✅ ProgrammableTokenTransfers deployed at address ${programmableTokenTransfers.address} on ${blockchainNetwork} blockchain`)
    });