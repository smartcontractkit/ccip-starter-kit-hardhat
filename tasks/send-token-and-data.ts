import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig } from "../helpers/utils";
import { Wallet, JsonRpcProvider } from "ethers";
import {
  IRouterClient,
  IRouterClient__factory,
  ProgrammableTokenTransfers,
  ProgrammableTokenTransfers__factory,
} from "../typechain-types";
import { Spinner } from "../helpers/spinner";

task(
  `send-token-and-data`,
  `Sends token and data using ProgrammableTokenTransfers.sol`
)
  .addParam(
    `sourceBlockchain`,
    `The name of the source blockchain (for example ethereumSepolia)`
  )
  .addParam(
    `sender`,
    `The address of the sender ProgrammableTokenTransfers.sol on the source blockchain`
  )
  .addParam(
    `destinationBlockchain`,
    `The name of the destination blockchain (for example polygonAmoy)`
  )
  .addParam(
    `receiver`,
    `The address of the receiver ProgrammableTokenTransfers.sol on the destination blockchain`
  )
  .addParam(
    `message`,
    `The string message to be sent (for example "Hello, World")`
  )
  .addParam(
    `tokenAddress`,
    `The address of a token to be sent on the source blockchain`
  )
  .addParam(`amount`, `The amount of token to be sent`)
  .addOptionalParam(
    "router",
    `The address of the Router contract on the source blockchain`
  )
  .setAction(async (taskArguments: TaskArguments) => {
    const {
      sourceBlockchain,
      sender,
      destinationBlockchain,
      receiver,
      message,
      tokenAddress,
      amount,
    } = taskArguments;

    const privateKey = getPrivateKey();
    const sourceRpcProviderUrl = getProviderRpcUrl(sourceBlockchain);

    const sourceProvider = new JsonRpcProvider(sourceRpcProviderUrl);
    const wallet = new Wallet(privateKey);
    const signer = wallet.connect(sourceProvider);

    const senderContract: ProgrammableTokenTransfers =
      ProgrammableTokenTransfers__factory.connect(sender, signer);

    const routerAddress = taskArguments.router
      ? taskArguments.router
      : getRouterConfig(sourceBlockchain).address;
    const destinationChainSelector = getRouterConfig(
      destinationBlockchain
    ).chainSelector;

    const router: IRouterClient = IRouterClient__factory.connect(
      routerAddress,
      signer
    );
    const supportedTokens = await router.getSupportedTokens(
      destinationChainSelector
    );

    if (!supportedTokens.includes(tokenAddress)) {
      throw Error(
        `Token address ${tokenAddress} not in the list of supportedTokens ${supportedTokens}`
      );
    }

    const spinner: Spinner = new Spinner();

    console.log(
      `ℹ️  Attempting to call the sendMessage function of ProgrammableTokenTransfers smart contract on the ${sourceBlockchain} blockchain using ${signer.address} address`
    );
    spinner.start();

    const tx = await senderContract.sendMessage(
      destinationChainSelector,
      receiver,
      message,
      tokenAddress,
      amount
    );

    await tx.wait();

    spinner.start();
    console.log(`✅ Message sent, transaction hash: ${tx.hash}`);
  });

task(
  `get-received-message-details`,
  `Gets details of any CCIP message received by the ProgrammableTokenTransfers.sol smart contract`
)
  .addParam(
    `contractAddress`,
    `The address of the ProgrammableTokenTransfers.sol smart contract`
  )
  .addParam(
    `blockchain`,
    `The name of the blockchain where the contract is (for example ethereumSepolia)`
  )
  .setAction(async (taskArguments: TaskArguments) => {
    const { contractAddress, blockchain } = taskArguments;

    const rpcProviderUrl = getProviderRpcUrl(blockchain);
    const provider = new JsonRpcProvider(rpcProviderUrl);

    const receiverContract: ProgrammableTokenTransfers =
      ProgrammableTokenTransfers__factory.connect(contractAddress, provider);

    console.log(await receiverContract.getLastReceivedMessageDetails());
  });
