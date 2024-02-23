import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getPayFeesIn } from "./utils";
import { Wallet, providers } from "ethers";
import { IERC20, IERC20__factory } from "../typechain-types";
import { LINK_ADDRESSES, PayFeesIn } from "./constants";
import { Spinner } from "../utils/spinner";


task(`fill-sender`, `Transfers the provided amount of LINK token or native coin to the sender contract to serve for paying CCIP fees`)
    .addParam(`senderAddress`, `The address of a sender contract on the source blockchain`)
    .addParam(`blockchain`, `The name of the blockchain (for example ethereumSepolia)`)
    .addParam(`amount`, `Amount to send`)
    .addParam(`payFeesIn`, `Choose between 'Native' and 'LINK'`)
    .setAction(async (taskArguments: TaskArguments) => {
        const { senderAddress, blockchain, amount, payFeesIn } = taskArguments;

        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(blockchain);

        const provider = new providers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const signer = wallet.connect(provider);

        const fees = getPayFeesIn(payFeesIn);

        const spinner: Spinner = new Spinner();

        if (fees === PayFeesIn.Native) {
            console.log(`ℹ️  Attempting to send ${amount} of ${blockchain} native coins from ${signer.address} to ${senderAddress}`);
            spinner.start();

            const tx = await signer.sendTransaction({ to: senderAddress, value: amount });
            await tx.wait();

            spinner.stop();
            console.log(`✅ Coins sent, transaction hash: ${tx.hash}`)
        } else {
            const link: IERC20 = IERC20__factory.connect(LINK_ADDRESSES[blockchain], signer);

            console.log(`ℹ️  Attempting to send ${amount} of ${link.address} tokens from ${signer.address} to ${senderAddress}`);
            spinner.start();

            const tx = await link.transfer(senderAddress, amount);
            await tx.wait();

            spinner.stop();
            console.log(`✅ LINKs sent, transaction hash: ${tx.hash}`)
        }
    })