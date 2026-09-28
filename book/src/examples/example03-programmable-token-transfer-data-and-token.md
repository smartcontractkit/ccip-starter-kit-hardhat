# Example 03: Programmable Token Transfer (Faster Than Finality)

This example sends a programmable token transfer from an EOA on Ethereum Sepolia to a receiver that supports Faster Than Finality on Polygon Amoy:

- Data payload: `"Hello, World"`
- Tokens: `CCIP-BnM`

Task: `example03` (implementation: `tasks/Example03.ts`).

## What You Will Do

1. Ensure a destination `BasicMessageReceiverWithCCVs` exists on Amoy.
2. Mint 1 `CCIP-BnM` on Sepolia using the `faucet` task.
3. Send one CCIP message containing both data and tokens using the `example03` task.
4. (Optional) Verify receiver state with the `basic-message-receiver-latest-*` tasks.

## Receiver Compatibility Note

This chapter uses Faster Than Finality (`blockConfirmations > 0`), so the destination receiver should return a non-zero minimum block depth for your source chain.

- If your receiver is default-finality-only, this message can fail on destination.
- Deploy `BasicMessageReceiverWithCCVs` before running this chapter and configure `setMinBlockDepth` for your source chain.
- For default-finality programmable token transfer (`blockConfirmations = 0`), use Example 04.

## Before You Start

> **Important: Keystore first**
>
> Use a local keystore account for task execution:
>
> ```bash
> npx hardhat keystore set AMOY_PRIVATE_KEY
> npx hardhat keystore set SEPOLIA_PRIVATE_KEY
> npx hardhat keystore set AMOY_RPC_URL
> npx hardhat keystore set SEPOLIA_RPC_URL
> ```
>

> **If you do not have a receiver deployed yet**
>
> Deploy `BasicMessageReceiverWithCCVs` on Amoy with Ignition (see Example 02):
>
> ```bash
> npx hardhat ignition deploy ignition/modules/BasicMessageReceiverWithCCVs.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
> ```
>
> Then configure min block depth for your source chain:
>
> ```bash
> npx hardhat set-basic-message-receiver-with-ccvs-min-block-depth --network <NETWORK_NAME> \
>   --receiver <BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS> \
>   --source-chain-selector <SOURCE_CHAIN_SELECTOR> \
>   --min-block-depth <MIN_BLOCK_DEPTH>
> ```
>
> For this Faster Than Finality example, use `<MIN_BLOCK_DEPTH> > 0` and check the source pool minimum too.
>
> The user-facing input for this example is `--min-block-depth <MIN_BLOCK_DEPTH>` (a `uint16` passed to `BasicMessageReceiverWithCCVs.setMinBlockDepth`). On-chain, the receiver does not return that integer directly to CCIP: `getCCVsAndFinalityConfig` sets `allowedFinalityConfig` to `FinalityCodec._encodeBlockDepth(minBlockDepth)` — the same `bytes4` finality encoding CCIP 2.0 uses elsewhere for allowed finality (depth `0` means wait for full/default finality).
>
> `--parameters` is the path to the chain's Ignition parameters JSON (e.g. `ignition/paramsAmoy.json`); it supplies router and other addresses to the module.
>
> Save the deployed receiver address and use it as `--receiver` in Step 2.

## Step 1: Get 1 CCIP-BnM Token on Sepolia

Use the token and finality check from [Example 01](example01-token-transfer-faster-than-finality.md):

```bash
npx hardhat faucet --network <NETWORK_NAME> --ccip-bnm <CCIP_BNM_SOURCE_TOKEN_ADDRESS>
```

## Step 2: Send Hello World + CCIP-BnM

From Sepolia, run `example03` with the Amoy receiver and Sepolia CCIP-BnM token.

```bash
npx hardhat example03 --network <NETWORK_NAME> \
  --source-router <SOURCE_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS> \
  --message-text "Hello, World" \
  --token-to-send <CCIP_BNM_SOURCE_TOKEN_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit <GAS_LIMIT> \
  --block-confirmations <BLOCK_CONFIRMATIONS_GT_ZERO> \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--amount`: token amount in wei (e.g. `1000000000000000000` for 1 token with 18 decimals).
- `--gas-limit` must be `> 0` because the receiver contract callback handles data (e.g. `200000`).
- `--block-confirmations` must meet the source pool and receiver minimums.
- Executor may enforce a minimum block confirmation value and revert if too low.
- If requested confirmations exceed chain finality, default finality is used.
- `--fee-token-address`: LINK token address on the source chain to pay fees in LINK, or `0x0000000000000000000000000000000000000000` to pay in native coin.

Defaults (can be omitted): `--gas-limit 200000`, `--block-confirmations 1`, `--fee-token-address 0x0000000000000000000000000000000000000000`.

## Verify Result

The `example03` task logs the CCIP message ID and a link to monitor.

**Monitor message status:** https://ccip.chain.link

**Optional: read receiver state on Amoy** using the Hardhat tasks (receiver address = `<BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS>`):

```bash
# Decoded latest message (string)
npx hardhat basic-message-receiver-latest-message --network <NETWORK_NAME> --basic-message-receiver <BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS>

# Latest sender address
npx hardhat basic-message-receiver-latest-sender --network <NETWORK_NAME> --basic-message-receiver <BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS>

# Latest source chain selector (uint64)
npx hardhat basic-message-receiver-latest-source-chain-selector --network <NETWORK_NAME> --basic-message-receiver <BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS>
```
