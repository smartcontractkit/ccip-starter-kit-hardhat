import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getProviderRpcUrl } from "../helpers/utils";
import { JsonRpcProvider } from "ethers";
import {
  BasicMessageReceiver__factory,
  BasicMessageReceiver,
} from "../typechain-types";
import { Spinner } from "../helpers/spinner";

task(`get-message`, `Gets BasicMessageSender latest received message details`)
  .addParam(`receiverAddress`, `The BasicMessageReceiver address`)
  .addParam(
    `blockchain`,
    `The name of the blockchain (for example ethereumSepolia)`
  )
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const { receiverAddress, blockchain } = taskArguments;

      const rpcProviderUrl = getProviderRpcUrl(blockchain);
      const provider = new JsonRpcProvider(rpcProviderUrl);

      const basicMessageReceiver: BasicMessageReceiver =
        BasicMessageReceiver__factory.connect(receiverAddress, provider);

      const spinner: Spinner = new Spinner();

      console.log(
        `ℹ️  Attempting to get the latest received message details from the BasicMessageReceiver smart contract (${receiverAddress}) on the ${blockchain} blockchain`
      );
      spinner.start();

      const latestMessageDetails =
        await basicMessageReceiver.getLatestMessageDetails();

      spinner.stop();
      console.log(`ℹ️ Latest Message Details:`);
      console.log(`- Message Id: ${latestMessageDetails[0]}`);
      console.log(`- Source Chain Selector: ${latestMessageDetails[1]}`);
      console.log(`- Sender: ${latestMessageDetails[2]}`);
      console.log(`- Message Text: ${latestMessageDetails[3]}`);
    }
  );
