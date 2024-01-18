import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getRouterConfig, getSigner } from "./utils";
import { Spinner } from "../utils/spinner";
import { LINK_ADDRESSES } from "./constants";

task(`deploy-basic-token-sender`, `Deploys the BasicTokenSender smart contract`)
    .addOptionalParam(`router`, `The address of the Router contract`)
    .addOptionalParam(`link`, `The address of the LINK token`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const blockchainNetwork = hre.network.name;
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(blockchainNetwork).address;
        const linkAddress = taskArguments.link ? taskArguments.link : LINK_ADDRESSES[blockchainNetwork]

        const signer = getSigner(blockchainNetwork);
        const spinner: Spinner = new Spinner();

        console.log(`ℹ️  Attempting to deploy BasicTokenSender on the ${blockchainNetwork} blockchain using ${signer.address} address, with the Router address ${routerAddress} and LINK address ${linkAddress} provided as constructor arguments`);
        spinner.start();

        const basicTokenSenderFactory = await hre.ethers.getContractFactory('BasicTokenSender');
        const basicTokenSender = await basicTokenSenderFactory.deploy(routerAddress, linkAddress);
        await basicTokenSender.deployed();

        spinner.stop();
        console.log(`✅ Basic Token Sender deployed at address ${basicTokenSender.address} on the ${blockchainNetwork} blockchain`)
    });