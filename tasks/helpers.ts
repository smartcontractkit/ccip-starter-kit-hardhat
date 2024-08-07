import {
  TransactionRequest,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  JsonRpcProvider,
} from "ethers";

export const getCcipMessageId = async (
  tx: ContractTransactionResponse,
  receipt: ContractTransactionReceipt | null,
  provider: JsonRpcProvider
) => {
  if (receipt === null) throw new Error("Transaction not included in a block");

  // Simulate a call to the router to fetch the messageID
  const call: TransactionRequest = {
    from: tx.from,
    to: tx.to,
    data: tx.data,
    gasLimit: tx.gasLimit,
    gasPrice: tx.gasPrice,
    value: tx.value,
    blockTag: receipt.blockNumber - 1,
  };

  // Simulate a contract call with the transaction data at the block before the transaction
  const messageId = await provider.call(call);

  console.log(
    `✅ You can now monitor the token transfer status via CCIP Explorer (https://ccip.chain.link) by searching for CCIP Message ID: ${messageId}`
  );
};
