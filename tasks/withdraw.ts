import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl } from "../helpers/utils";
import { Wallet, JsonRpcProvider } from "ethers";
import { Withdraw } from "../typechain-types/contracts/utils";
import { Withdraw__factory } from "../typechain-types/factories/contracts/utils";
import { Spinner } from "../helpers/spinner";

task(
  `withdraw`,
  `Withdraws tokens and coins from Withdraw.sol. Must be called by an Owner, otherwise it will revert`
)
  .addParam(
    `blockchain`,
    `The name of the blockchain (for example ethereumSepolia)`
  )
  .addParam(
    `from`,
    `The address of the Withdraw.sol smart contract from which funds should be withdrawn`
  )
  .addParam(`beneficiary`, `The address to withdraw to`)
  .addOptionalParam(`tokenAddress`, `The address of a token to withdraw`)
  .setAction(async (taskArguments: TaskArguments) => {
    const { blockchain, from, beneficiary, tokenAddress } = taskArguments;

    const privateKey = getPrivateKey();
    const rpcProviderUrl = getProviderRpcUrl(blockchain);

    const provider = new JsonRpcProvider(rpcProviderUrl);
    const wallet = new Wallet(privateKey);
    const signer = wallet.connect(provider);

    const withdraw: Withdraw = Withdraw__factory.connect(from, signer);

    const spinner: Spinner = new Spinner();

    if (tokenAddress) {
      console.log(
        `ℹ️  Attempting to withdraw ${tokenAddress} tokens from ${from} to ${beneficiary}`
      );
      spinner.start();

      const withdrawalTx = await withdraw.withdrawToken(
        beneficiary,
        tokenAddress
      );
      await withdrawalTx.wait();

      spinner.stop();
      console.log(
        `✅ Withdrawal successful, transaction hash: ${withdrawalTx.hash}`
      );
    } else {
      console.log(
        `ℹ️  Attempting to withdraw coins from ${from} to ${beneficiary}`
      );
      spinner.start();

      const withdrawalTx = await withdraw.withdraw(beneficiary);
      await withdrawalTx.wait();

      spinner.stop();
      console.log(
        `✅ Withdrawal successful, transaction hash: ${withdrawalTx.hash}`
      );
    }
  });
