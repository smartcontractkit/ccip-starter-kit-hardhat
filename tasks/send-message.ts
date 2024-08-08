import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import {
  getPayFeesIn,
  getPrivateKey,
  getProviderRpcUrl,
  getRouterConfig,
} from "../helpers/utils";
import { Wallet, JsonRpcProvider } from "ethers";
import {
  BasicMessageSender,
  BasicMessageSender__factory,
} from "../typechain-types";
import { Spinner } from "../helpers/spinner";

task(`send-message`, `Sends basic text messages`)
  .addParam(
    `sourceBlockchain`,
    `The name of the source blockchain (for example ethereumSepolia)`
  )
  .addParam(
    `sender`,
    `The address of the BasicMessageSender.sol on the source blockchain`
  )
  .addParam(
    `destinationBlockchain`,
    `The name of the destination blockchain (for example polygonAmoy)`
  )
  .addParam(
    `receiver`,
    `The address of the receiver BasicMessageReceiver.sol on the destination blockchain`
  )
  .addParam(
    `message`,
    `The string message to be sent (for example "Hello, World")`
  )
  .addParam(`payFeesIn`, `Choose between 'Native' and 'LINK'`)
  .setAction(async (taskArguments: TaskArguments) => {
    const {
      sourceBlockchain,
      sender,
      destinationBlockchain,
      receiver,
      message,
      payFeesIn,
    } = taskArguments;

    const privateKey = getPrivateKey();
    const sourceRpcProviderUrl = getProviderRpcUrl(sourceBlockchain);

    const sourceProvider = new JsonRpcProvider(sourceRpcProviderUrl);
    const wallet = new Wallet(privateKey);
    const signer = wallet.connect(sourceProvider);

    const spinner: Spinner = new Spinner();

    const basicMessageSender: BasicMessageSender =
      BasicMessageSender__factory.connect(sender, signer);

    const destinationChainSelector = getRouterConfig(
      destinationBlockchain
    ).chainSelector;
    const fees = getPayFeesIn(payFeesIn);

    console.log(
      `ℹ️  Attempting to send the ${message} message from the BasicMessageSender smart contract (${sender}) on the ${sourceBlockchain} blockchain to the BasiceMessageReceiver smart contract (${receiver} on the ${destinationBlockchain} blockchain)`
    );
    spinner.start();

    const tx = await basicMessageSender.send(
      destinationChainSelector,
      receiver,
      message,
      fees
    );

    await tx.wait();

    spinner.stop();
    console.log(`✅ Message sent, transaction hash: ${tx.hash}`);
  });
