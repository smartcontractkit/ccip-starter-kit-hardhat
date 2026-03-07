# Example 03: Programmable Token Transfer (Hello World + CCIP-BnM)

This example sends a programmable token transfer from an EOA on Avalanche Fuji to a `BasicMessageReceiver` on Ethereum Sepolia:

- Data payload: `"Hello, World"`
- Tokens: `CCIP-BnM`

Task: `example03` (implementation: `tasks/Example03.ts`).

## What You Will Do

1. Ensure a destination `BasicMessageReceiver` exists on Sepolia (deploy via Ignition if needed).
2. Mint 1 `CCIP-BnM` on Fuji using the `faucet` task.
3. Send one CCIP message containing both data and tokens using the `example03` task.
4. (Optional) Verify receiver state with the `basic-message-receiver-latest-*` tasks.

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
> `--parameters` is the path to the chain's Ignition parameters JSON (e.g. `ignition/paramsEthSepolia.json`); it supplies router and other addresses to the module.
>
> Save the deployed receiver address and use it as `--receiver` in Step 2.

## Step 1: Get 1 CCIP-BnM Token on Fuji

Use the `faucet` task on Fuji with the CCIP-BnM token address for Fuji:

```bash
npx hardhat faucet --network <NETWORK_NAME> --ccip-bnm <CCIP_BNM_TOKEN_ADDRESS>
```

## Step 2: Send Hello World + CCIP-BnM

From Fuji (source chain), run the `example03` task. Pass the deployed receiver on Sepolia as `--receiver`, your message as `--message-text`, and the Fuji CCIP-BnM token as `--token-to-send`.

```bash
npx hardhat example03 --network <NETWORK_NAME> \
  --source-router <SOURCE_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS> \
  --message-text "Hello, World" \
  --token-to-send <CCIP_BNM_FUJI_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit <GAS_LIMIT> \
  --block-confirmations <BLOCK_CONFIRMATIONS_GT_ZERO> \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--amount`: token amount in wei (e.g. `1000000000000000000` for 1 token with 18 decimals).
- `--gas-limit` must be `> 0` because the receiver contract callback handles data (e.g. `200000`).
- `--block-confirmations` must be `> 0` for Faster Than Finality.
- Executor may enforce a minimum block confirmation value and revert if too low.
- If requested confirmations exceed chain finality, default finality is used.
- `--fee-token-address`: LINK token address on the source chain to pay fees in LINK, or `0x0000000000000000000000000000000000000000` to pay in native coin.

Defaults (can be omitted): `--gas-limit 200000`, `--block-confirmations 1`, `--fee-token-address 0x0000000000000000000000000000000000000000`.

## Verify Result

The `example03` task logs the CCIP message ID and a link to monitor.

**Monitor message status:** https://ccip.chain.link

**Optional: read receiver state on Sepolia** using the Hardhat tasks (receiver address = `<DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS>`):

```bash
# Decoded latest message (string)
npx hardhat basic-message-receiver-latest-message --network <NETWORK_NAME> --basic-message-receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS>

# Latest sender address
npx hardhat basic-message-receiver-latest-sender --network <NETWORK_NAME> --basic-message-receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS>

# Latest source chain selector (uint64)
npx hardhat basic-message-receiver-latest-source-chain-selector --network <NETWORK_NAME> --basic-message-receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS>
```
