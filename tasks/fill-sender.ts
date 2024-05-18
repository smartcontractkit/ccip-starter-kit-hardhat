import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPayFeesIn } from "./utils";
import { IERC20, IERC20__factory } from "../typechain-types";
import { LINK_ADDRESSES, PayFeesIn } from "./constants";
import { Spinner } from "../utils/spinner";


task(`fill-sender`, `Transfers the provided amount of LINK token or native coin to the sender contract to serve for paying CCIP fees`)
    .addParam(`senderAddress`, `The address of a sender contract on the source blockchain`)
    .addParam(`amount`, `Amount to send`)
    .addParam(`payFeesIn`, `Choose between 'Native' and 'LINK'`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const { senderAddress, amount, payFeesIn } = taskArguments;

        const [signer] = await hre.ethers.getSigners();

        const fees = getPayFeesIn(payFeesIn);

        const spinner: Spinner = new Spinner();

        if (fees === PayFeesIn.Native) {
            console.log(`ℹ️  Attempting to send ${amount} of ${hre.network.name} native coins from ${signer.address} to ${senderAddress}`);
            spinner.start();

            const tx = await signer.sendTransaction({ to: senderAddress, value: amount });
            await tx.wait();

            spinner.stop();
            console.log(`✅ Coins sent, transaction hash: ${tx.hash}`)
        } else {
            const link: IERC20 = IERC20__factory.connect(LINK_ADDRESSES[hre.network.name], signer);

            console.log(`ℹ️  Attempting to send ${amount} of ${link.address} tokens from ${signer.address} to ${senderAddress}`);
            spinner.start();

            const tx = await link.transfer(senderAddress, amount);
            await tx.wait();

            spinner.stop();
            console.log(`✅ LINKs sent, transaction hash: ${tx.hash}`)
        }
    })