import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getFaucetTokensAddresses, getSigner } from "./utils";
import { BurnMintERC677Helper, BurnMintERC677Helper__factory } from "../typechain-types";
import { Spinner } from "../utils/spinner";


task(`faucet`, `Mints 10**18 units of CCIP-BnM and CCIP-LnM tokens to receiver address`)
    .addParam(`receiver`, `The address to receive tokens`)
    .addOptionalParam(`ccipBnm`, `The address of the CCIP-BnM token`)
    .addOptionalParam(`ccipLnm`, `The address of the CCIP-LnM token`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const { receiver, ccipBnm, ccipLnm } = taskArguments;
        const blockchainNetwork = hre.network.name;
        const ccipBnmAddress = ccipBnm ? ccipBnm : getFaucetTokensAddresses(blockchainNetwork).ccipBnM;

        const signer = getSigner(blockchainNetwork);

        const spinner: Spinner = new Spinner();

        console.log(`ℹ️  Attempting to mint 10**18 units of CCIP-BnM token (${ccipBnmAddress}) on ${blockchainNetwork} blockchain`);
        spinner.start();

        const ccipBnM: BurnMintERC677Helper = BurnMintERC677Helper__factory.connect(ccipBnmAddress, signer);
        const tx = await ccipBnM.drip(receiver);
        await tx.wait();

        spinner.stop();
        console.log(`✅ CCIP-BnM tokens minted, transaction hash: ${tx.hash}`);

        console.log(`ℹ️  CCIP-LnM tokens can be minted only on Ethereum Sepolia testnet`);

        if (blockchainNetwork === `ethereumSepolia`) {
            const ccipLnmAddress = ccipLnm ? ccipLnm : getFaucetTokensAddresses(blockchainNetwork).ccipLnM;

            console.log(`ℹ️  Attempting to mint 10**18 units of CCIP-LnM token (${ccipLnmAddress}) on ${blockchainNetwork} blockchain`);
            spinner.start();

            const ccipLnM: BurnMintERC677Helper = BurnMintERC677Helper__factory.connect(ccipLnmAddress, signer);
            const tx = await ccipLnM.drip(receiver);
            await tx.wait();

            spinner.stop();
            console.log(`✅ CCIP-LnM tokens minted, transaction hash: ${tx.hash}`);
        }

        console.log(`✅ Task faucet finished with the execution`);
    })