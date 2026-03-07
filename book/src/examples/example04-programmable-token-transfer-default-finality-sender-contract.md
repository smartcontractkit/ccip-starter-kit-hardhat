# Example 04: Programmable Token Transfer (Default Finality + Sender Contract)

This example sends a programmable token transfer from Avalanche Fuji to Ethereum Sepolia using a deployed `BasicMessageSender` contract:

- Data payload: `"Hello, World"`
- Tokens: `CCIP-BnM`
- Finality mode: default finality (`blockConfirmations = 0`)

Tasks and modules used:

- **Deploy sender:** Hardhat Ignition module `ignition/modules/BasicMessageSender.ts` (deploy on source chain; requires `routerAddress` and `linkAddress` in params).
- **Deploy receiver (if needed):** Hardhat Ignition module `ignition/modules/BasicMessageReceiver.ts` (see Example 02).
- **Mint token:** Hardhat task `faucet`.
- **Send message:** Hardhat task `example04` (implementation: `tasks/Example04.ts`).
- **Verify receiver:** Hardhat tasks `basic-message-receiver-latest-message`, `basic-message-receiver-latest-sender`, `basic-message-receiver-latest-source-chain-selector`.

## What You Will Do

1. Deploy `BasicMessageSender` on the source chain (Fuji) using Ignition.
2. Ensure destination `BasicMessageReceiver` exists on Sepolia (deploy via Ignition if needed; see Example 02).
3. Mint 1 `CCIP-BnM` on Fuji using the `faucet` task.
4. Run the `example04` task: it quotes the fee, funds the sender contract with that amount (when paying in native), then sends data + token.

## Before You Start

> **Important: Keystore first**
>
> Use a local keystore account for task execution:
>
> ```bash
> npx hardhat keystore set SEPOLIA_PRIVATE_KEY
> npx hardhat keystore set FUJI_PRIVATE_KEY
> npx hardhat keystore set SEPOLIA_RPC_URL
> npx hardhat keystore set FUJI_RPC_URL
> ```
>

> **If you do not have a receiver deployed yet**
>
> Deploy `BasicMessageReceiver` on Sepolia with Ignition (see Example 02):
>
> ```bash
> npx hardhat ignition deploy ignition/modules/BasicMessageReceiver.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
> ```
>
> `--parameters` is the path to the chain's Ignition parameters JSON; it supplies router and other addresses to the module.
>
> Save the deployed receiver address for use as `--receiver` in Step 4.

## Step 1: Deploy `BasicMessageSender` on Fuji

Deploy the sender on the source chain using Hardhat Ignition. The params file must include `routerAddress` and `linkAddress` for the BasicMessageSender module (see `ignition/modules/BasicMessageSender.ts`).

```bash
npx hardhat ignition deploy ignition/modules/BasicMessageSender.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

`--parameters` is the path to the chain's Ignition parameters JSON (e.g. `ignition/paramsFuji.json`); it supplies router, LINK address, and other values to the module.

Save the deployed sender address from the deployment output for use as `--basic-message-sender` in Step 4.

## Step 2: Get 1 CCIP-BnM Token on Fuji

```bash
npx hardhat faucet --network <NETWORK_NAME> --ccip-bnm <CCIP_BNM_TOKEN_ADDRESS>
```

## Step 3: Fund the Sender Contract (if paying in native)

The `example04` task funds the sender contract with the quoted fee when `--fee-token-address` is the zero address. Ensure your EOA has enough native token on Fuji to cover that fee (the task transfers it to the sender contract before calling `send`).

## Step 4: Send Hello World + CCIP-BnM Through Sender Contract

Run the `example04` task from the source chain (Fuji). Use default finality by setting `--block-confirmations 0`. Pass the deployed sender as `--basic-message-sender` and the receiver as `--receiver`.

```bash
npx hardhat example04 --network <NETWORK_NAME> \
  --basic-message-sender <DEPLOYED_BASIC_MESSAGE_SENDER_ADDRESS> \
  --source-router <SOURCE_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS> \
  --message-text "Hello, World" \
  --token-to-send <CCIP_BNM_FUJI_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit <GAS_LIMIT> \ 
  --block-confirmations 0 \
  --fee-token-address 0x0000000000000000000000000000000000000000
```  


Parameter notes:

- This example uses **default finality** by setting `--block-confirmations 0`.
- `--amount`: token amount in wei (e.g. `1000000000000000000` for 1 token with 18 decimals).
- `--gas-limit` must be `> 0` because the receiver contract callback handles data (e.g. `200000`).
- The task quotes the fee, then (when paying in native) funds the sender contract with that exact amount before calling `send`.
- If fee conditions change between quote and send, re-run the task to re-quote and retry.
- `--fee-token-address 0x0000000000000000000000000000000000000000` pays the CCIP fee in native token; the task transfers the quoted fee from your EOA to the sender contract.

## Verify Result

The `example04` task logs the CCIP message ID and a link to monitor.

**Monitor message status:** https://ccip.chain.link

**Optional: read receiver state on Sepolia** using the Hardhat tasks:

```bash
npx hardhat basic-message-receiver-latest-message --network <NETWORK_NAME> --basic-message-receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS>
npx hardhat basic-message-receiver-latest-sender --network <NETWORK_NAME> --basic-message-receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS>
npx hardhat basic-message-receiver-latest-source-chain-selector --network <NETWORK_NAME> --basic-message-receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS>
```
