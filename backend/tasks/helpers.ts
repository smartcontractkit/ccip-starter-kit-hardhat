import { ContractReceipt, ContractTransaction, providers } from "ethers";

export const getCcipMessageId = async (tx: ContractTransaction, receipt: ContractReceipt, provider: providers.JsonRpcProvider) => {
    // Simulate a call to the router to fetch the messageID
    const call = {
        from: tx.from,
        to: tx.to,
        data: tx.data,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        value: tx.value,
    };

    // Simulate a contract call with the transaction data at the block before the transaction
    const messageId = await provider.call(call, receipt.blockNumber - 1);

    console.log(`✅ You can now monitor the token transfer status via CCIP Explorer (https://ccip.chain.link) by searching for CCIP Message ID: ${messageId}`);
}