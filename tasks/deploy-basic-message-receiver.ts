import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getRouterConfig, getSigner } from "./utils";
import { Spinner } from "../utils/spinner";

task(`deploy-basic-message-receiver`, `Deploys the BasicMessageReceiver smart contract`)
    .addOptionalParam(`router`, `The address of the Router contract`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const blockchainNetwork = hre.network.name;
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(blockchainNetwork).address;
    
        const signer = getSigner(blockchainNetwork);

        const spinner: Spinner = new Spinner();

        console.log(`ℹ️  Attempting to deploy BasicMessageReceiver on the ${blockchainNetwork} blockchain using ${signer.address} address, with the Router address ${routerAddress} provided as constructor argument`);
        spinner.start();

        const basicMessageReceiverFactory = await hre.ethers.getContractFactory('BasicMessageReceiver');
        const basicMessageReceiver = await basicMessageReceiverFactory.deploy(routerAddress);
        await basicMessageReceiver.deployed();

        spinner.stop();
        console.log(`✅ Basic Message Receiver deployed at address ${basicMessageReceiver.address} on ${blockchainNetwork} blockchain`)
    });