import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { BasicMessageReceiver__factory, BasicMessageReceiver } from "../typechain-types";
import { Spinner } from "../utils/spinner";

task(`get-message`, `Gets BasicMessageSender latest received message details`)
    .addParam(`receiverAddress`, `The BasicMessageReceiver address`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const { receiverAddress } = taskArguments;

        const basicMessageReceiver: BasicMessageReceiver = BasicMessageReceiver__factory.connect(receiverAddress, hre.ethers.provider);

        const spinner: Spinner = new Spinner();

        console.log(`ℹ️  Attempting to get the latest received message details from the BasicMessageReceiver smart contract (${receiverAddress}) on the ${hre.network.name} blockchain`);
        spinner.start();

        const latestMessageDetails = await basicMessageReceiver.getLatestMessageDetails();

        spinner.stop();
        console.log(`ℹ️ Latest Message Details:`);
        console.log(`- Message Id: ${latestMessageDetails[0]}`);
        console.log(`- Source Chain Selector: ${latestMessageDetails[1]}`);
        console.log(`- Sender: ${latestMessageDetails[2]}`);
        console.log(`- Message Text: ${latestMessageDetails[3]}`);
    });