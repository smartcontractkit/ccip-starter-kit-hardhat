import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getRouterConfig } from "./utils";
import { ProgrammableTokenTransfers, ProgrammableTokenTransfers__factory } from "../typechain-types";
import { Spinner } from "../utils/spinner";

task(`deploy-programmable-token-transfers`, `Deploys the ProgrammableTokenTransfers smart contract`)
    .addOptionalParam(`router`, `The address of the Router contract`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;

        const [deployer] = await hre.ethers.getSigners();

        const spinner: Spinner = new Spinner();

        console.log(`ℹ️  Attempting to deploy ProgrammableTokenTransfers on the ${hre.network.name} blockchain using ${deployer.address} address, with the Router address ${routerAddress} provided as constructor argument`);
        spinner.start();

        const programmableTokenTransfersFactory: ProgrammableTokenTransfers__factory = await hre.ethers.getContractFactory('ProgrammableTokenTransfers');
        const programmableTokenTransfers: ProgrammableTokenTransfers = await programmableTokenTransfersFactory.deploy(routerAddress);
        await programmableTokenTransfers.deployed();

        spinner.stop();
        console.log(`✅ ProgrammableTokenTransfers deployed at address ${programmableTokenTransfers.address} on ${hre.network.name} blockchain`)
    });