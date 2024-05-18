

import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPayFeesIn, getRouterConfig } from "./utils";
import { Wallet, providers } from "ethers";
import { BasicMessageSender, BasicMessageSender__factory } from "../typechain-types";
import { Spinner } from "../utils/spinner";

task(`send-message`, `Sends basic text messages`)
    .addParam(`sender`, `The address of the BasicMessageSender.sol on the source blockchain`)
    .addParam(`destinationBlockchain`, `The name of the destination blockchain (for example polygonMumbai)`)
    .addParam(`receiver`, `The address of the receiver BasicMessageReceiver.sol on the destination blockchain`)
    .addParam(`message`, `The string message to be sent (for example "Hello, World")`)
    .addParam(`payFeesIn`, `Choose between 'Native' and 'LINK'`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const { sender, destinationBlockchain, receiver, message, payFeesIn } = taskArguments;

        const [signer] = await hre.ethers.getSigners();
        const spinner: Spinner = new Spinner();

        const basicMessageSender: BasicMessageSender = BasicMessageSender__factory.connect(sender, signer)

        const destinationChainSelector = getRouterConfig(destinationBlockchain).chainSelector;
        const fees = getPayFeesIn(payFeesIn);

        console.log(`ℹ️  Attempting to send the ${message} message from the BasicMessageSender smart contract (${sender}) on the ${hre.network.name} blockchain to the BasiceMessageReceiver smart contract (${receiver} on the ${destinationBlockchain} blockchain)`);
        spinner.start();

        const tx = await basicMessageSender.send(
            destinationChainSelector,
            receiver,
            message,
            fees
        )

        await tx.wait();

        spinner.stop();
        console.log(`✅ Message sent, transaction hash: ${tx.hash}`);
    })