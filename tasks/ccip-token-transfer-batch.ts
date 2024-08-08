import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import {
  getPrivateKey,
  getProviderRpcUrl,
  getRouterConfig,
  getPayFeesIn,
} from "../helpers/utils";
import { Wallet, JsonRpcProvider } from "ethers";
import {
  IRouterClient,
  IRouterClient__factory,
  IERC20,
  IERC20__factory,
} from "../typechain-types";
import { TokenAmounts } from "../helpers/constants";
import { BasicTokenSender } from "../typechain-types/contracts/BasicTokenSender";
import { BasicTokenSender__factory } from "../typechain-types/factories/contracts/BasicTokenSender__factory";
import { Spinner } from "../helpers/spinner";
import { getCcipMessageId } from "./helpers";

task(
  `ccip-token-transfer-batch`,
  `Transfers tokens from one blockchain to another using Chainlink CCIP via BasicTokenSender.sol`
)
  .addParam(
    `sourceBlockchain`,
    `The name of the source blockchain (for example ethereumSepolia)`
  )
  .addParam(
    `basicTokenSenderAddress`,
    `The address of a BasicTokenSender.sol on the source blockchain`
  )
  .addParam(
    `destinationBlockchain`,
    `The name of the destination blockchain (for example polygonAmoy)`
  )
  .addParam(
    `receiver`,
    `The address of the receiver account on the destination blockchain`
  )
  .addParam(
    `tokenAmounts`,
    `The array of {token,amount} objects of tokens to send`
  )
  .addParam(`payFeesIn`, `Choose between 'Native' and 'LINK'`)
  .addOptionalParam(
    `router`,
    `The address of the Router contract on the source blockchain`
  )
  .setAction(async (taskArguments: TaskArguments) => {
    const {
      sourceBlockchain,
      basicTokenSenderAddress,
      destinationBlockchain,
      receiver,
      tokenAmounts,
      payFeesIn,
    } = taskArguments;
    const tokensToSendDetails: TokenAmounts[] = JSON.parse(tokenAmounts);

    const privateKey = getPrivateKey();
    const sourceRpcProviderUrl = getProviderRpcUrl(sourceBlockchain);

    const provider = new JsonRpcProvider(sourceRpcProviderUrl);
    const wallet = new Wallet(privateKey);
    const signer = wallet.connect(provider);

    const routerAddress = taskArguments.router
      ? taskArguments.router
      : getRouterConfig(sourceBlockchain).address;
    const targetChainSelector = getRouterConfig(
      destinationBlockchain
    ).chainSelector;

    const router: IRouterClient = IRouterClient__factory.connect(
      routerAddress,
      provider
    );
    const supportedTokens = await router.getSupportedTokens(
      targetChainSelector
    );

    const spinner: Spinner = new Spinner();

    for (let i = 0; i < tokensToSendDetails.length; i++) {
      const { token, amount } = tokensToSendDetails[i];

      console.log(
        `ℹ️  Checking whether the ${token} token is supported by Chainlink CCIP on the ${sourceBlockchain} blockchain`
      );
      spinner.start();

      if (!supportedTokens.includes(token)) {
        spinner.stop();
        console.error(
          `❌ Token address ${token} not in the list of supportedTokens ${supportedTokens}`
        );
        return 1;
      }

      spinner.stop();
      console.log(
        `✅ Token ${token} is supported by Chainlink CCIP on the ${sourceBlockchain} blockchain`
      );

      const tokenToSend: IERC20 = IERC20__factory.connect(token, signer);

      console.log(
        `ℹ️  Attempting to approve the BasicTokenSender smart contract (${basicTokenSenderAddress}) to spend ${amount} of ${token} tokens on behalf of ${signer.address}`
      );
      spinner.start();

      const approvalTx = await tokenToSend.approve(
        basicTokenSenderAddress,
        amount
      );
      await approvalTx.wait();

      spinner.stop();
      console.log(
        `✅ Approved successfully, transaction hash: ${approvalTx.hash}`
      );
    }

    const basicTokenSender: BasicTokenSender =
      BasicTokenSender__factory.connect(basicTokenSenderAddress, signer);

    const fees = getPayFeesIn(payFeesIn);

    console.log(
      `ℹ️  Attempting to send tokens [${tokensToSendDetails.map(
        (t) => t.token
      )}] from the BasicTokenSender smart contract (${basicTokenSenderAddress}) from ${sourceBlockchain} to ${receiver} on the ${destinationBlockchain}`
    );
    spinner.start();

    const sendTx = await basicTokenSender.send(
      targetChainSelector,
      receiver,
      tokensToSendDetails,
      fees
    );

    const receipt = await sendTx.wait();

    spinner.stop();
    console.log(`✅ Tokens sent, transaction hash: ${sendTx.hash}`);

    await getCcipMessageId(sendTx, receipt, provider);
  });
