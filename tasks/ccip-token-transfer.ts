import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getRouterConfig } from "./utils";
import { utils, constants } from "ethers";
import { IRouterClient, IRouterClient__factory, IERC20, IERC20__factory } from "../typechain-types";
import { Spinner } from "../utils/spinner";
import { getCcipMessageId } from "./helpers";

task(`ccip-token-transfer`, `Transfers tokens from one blockchain to another using Chainlink CCIP`)
    .addParam(`destinationBlockchain`, `The name of the destination blockchain (for example polygonMumbai)`)
    .addParam(`receiver`, `The address of the receiver account on the destination blockchain`)
    .addParam(`tokenAddress`, `The address of a token to be sent on the source blockchain`)
    .addParam(`amount`, `The amount of token to be sent in units (eg wei, satoshi, etc))`)
    .addOptionalParam(`feeTokenAddress`, `The address of token for paying fees. If not provided, the source blockchain's native coin will be used`)
    .addOptionalParam(`router`, `The address of the Router contract on the source blockchain`)
    .addOptionalParam(`gasLimit`, `The maximum amount of gas CCIP can consume to execute ccipReceive() on the contract located on the destination blockchain. Unspent gas will not be refunded. Should be 0 for transfer to EOA.`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const { destinationBlockchain, receiver, tokenAddress, amount, feeTokenAddress, gasLimit } = taskArguments;

        const [signer] = await hre.ethers.getSigners();

        const spinner: Spinner = new Spinner();

        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;
        const targetChainSelector = getRouterConfig(destinationBlockchain).chainSelector;

        const router: IRouterClient = IRouterClient__factory.connect(routerAddress, signer);
        const supportedTokens = await router.getSupportedTokens(targetChainSelector);

        console.log(`ℹ️  Checking whether the ${tokenAddress} token is supported by Chainlink CCIP on the ${hre.network.name} blockchain`);
        spinner.start();

        if (!supportedTokens.includes(tokenAddress)) {
            spinner.stop();
            console.error(`❌ Token address ${tokenAddress} not in the list of supportedTokens ${supportedTokens}`);
            return 1;
        }

        spinner.stop();
        console.log(`✅ Token ${tokenAddress} is supported by Chainlink CCIP on the ${hre.network.name} blockchain`);

        const tokenToSend: IERC20 = IERC20__factory.connect(tokenAddress, signer);

        console.log(`ℹ️  Attempting to approve Router smart contract (${routerAddress}) to spend ${amount} of ${tokenAddress} tokens on behalf of ${signer.address}`);
        spinner.start();

        const approvalTx = await tokenToSend.approve(routerAddress, amount);
        await approvalTx.wait();

        spinner.stop();
        console.log(`✅ Approved successfully, transaction hash: ${approvalTx.hash}`);

        const tokenAmounts = [
            {
                token: tokenAddress,
                amount: amount,
            },
        ];

        const gasLimitValue = taskArguments.gasLimit ? taskArguments.gasLimit : 200_000;

        const functionSelector = utils.id("CCIP EVMExtraArgsV1").slice(0, 10);
        const extraArgs = utils.defaultAbiCoder.encode(["uint256", "bool"], [gasLimitValue, false]); // for transfers to EOA gas limit is 0
        const encodedExtraArgs = `${functionSelector}${extraArgs.slice(2)}`;

        const message = {
            receiver: utils.defaultAbiCoder.encode(["address"], [receiver]),
            data: utils.defaultAbiCoder.encode(["string"], [""]), // no data
            tokenAmounts: tokenAmounts,
            feeToken: feeTokenAddress ? feeTokenAddress : constants.AddressZero,
            extraArgs: encodedExtraArgs,
        };

        console.log(`ℹ️  Calculating CCIP fees...`);
        spinner.start();

        const fees = await router.getFee(targetChainSelector, message);

        if (feeTokenAddress) {
            spinner.stop();
            console.log(`ℹ️  Estimated fees (juels): ${fees}`);

            const supportedFeeTokens = getRouterConfig(hre.network.name).feeTokens;

            if (!supportedFeeTokens.includes(feeTokenAddress)) {
                console.error(`❌ Token address ${feeTokenAddress} not in the list of supportedTokens ${supportedFeeTokens}`);
                return 1;
            }

            const feeToken: IERC20 = IERC20__factory.connect(feeTokenAddress, signer);

            console.log(`ℹ️  Attempting to approve Router smart contract (${routerAddress}) to spend ${fees} of ${feeTokenAddress} tokens for Chainlink CCIP fees on behalf of ${signer.address}`);
            spinner.start();

            const approvalTx = await feeToken.approve(routerAddress, fees);
            await approvalTx.wait();

            spinner.stop();
            console.log(`✅ Approved successfully, transaction hash: ${approvalTx.hash}`);

            console.log(`ℹ️  Attempting to send ${amount} of ${tokenAddress} tokens from the ${hre.network.name} blockchain to ${receiver} address on the ${destinationBlockchain} blockchain`);
            spinner.start();

            const sendTx = await router.ccipSend(targetChainSelector, message);
            const receipt = await sendTx.wait();

            spinner.stop()
            console.log(`✅ Sent successfully! Transaction hash: ${sendTx.hash}`);

            await getCcipMessageId(sendTx, receipt, hre.ethers.provider);

        } else {
            spinner.stop();
            console.log(`ℹ️  Estimated fees (wei): ${fees}`);

            console.log(`ℹ️  Attempting to send ${amount} of ${tokenAddress} tokens from the ${hre.network.name} blockchain to ${receiver} address on the ${destinationBlockchain} blockchain`);
            spinner.start();

            const sendTx = await router.ccipSend(targetChainSelector, message, { value: fees });
            const receipt = await sendTx.wait();

            spinner.stop()
            console.log(`✅ Sent successfully! Transaction hash: ${sendTx.hash}`);

            await getCcipMessageId(sendTx, receipt, hre.ethers.provider);
        }

        console.log(`✅ Task ccip-token-transfer finished with the execution`);
    });
