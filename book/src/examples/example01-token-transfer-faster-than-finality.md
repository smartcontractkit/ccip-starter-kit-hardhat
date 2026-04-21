# Example 01: Token Transfer + Faster Than Finality

This example sends one token transfer message using `ExtraArgsV3` with Faster Than Finality (`blockConfirmations > 0`).

Task: `example01` (implementation: `tasks/example01.ts`).

## What You Will Do

1. Mint 1 CCIP-BnM token to your EOA with the `faucet` task.
2. (Optional) Check the executor allowed finality config with the `executor-allowed-finality-config` task.
3. Send that token from source chain to destination chain with the `example01` task.

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

## Step 1: Get 1 CCIP-BnM Token

Use the faucet task on the source chain. Pass the CCIP-BnM token address for that chain:

```bash
npx hardhat faucet --network <NETWORK_NAME> --ccip-bnm <CCIP_BNM_TOKEN_ADDRESS>
```

## Step 2: (Optional) Check Executor Allowed Finality

Before picking a block depth for Faster Than Finality, you can read the executor’s allowed finality (`FinalityCodec` `bytes4`) with:

```bash
npx hardhat executor-allowed-finality-config --network <NETWORK_NAME> --executor <EXECUTOR_ADDRESS>
```

The task prints: `Allowed finality config (bytes4) 0x…`.

Why this matters:

- Your requested finality in `ExtraArgsV3` must be **allowed** by the executor and destination policy (`FinalityCodec`); mismatches can revert.
- If your requested mode is stricter than needed, behavior follows CCIP / pool rules (see chain-specific docs).

## Step 3: Send Token With Faster Than Finality

Run the `example01` task with the required and optional arguments:

```bash
npx hardhat example01 --network <NETWORK_NAME> \
  --source-router <SOURCE_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <RECEIVER_ON_DESTINATION_CHAIN> \
  --token-to-send <CCIP_BNM_SOURCE_TOKEN_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit <GAS_LIMIT> \
  --block-confirmations <BLOCK_CONFIRMATIONS_GT_ZERO> \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--amount`: token amount in wei (e.g. `1000000000000000000` for 1 token with 18 decimals).
- `--gas-limit`: set to `0` for token-only transfer to an EOA receiver; use e.g. `200000` for contract receivers.
- `--block-confirmations`: must be `> 0` in this Faster Than Finality example; use at least the executor minimum from Step 2.
- `--fee-token-address`: LINK token address on the source chain to pay CCIP fees in LINK, or `0x0000000000000000000000000000000000000000` to pay in native coin.

Defaults (can be omitted): `--gas-limit 200000`, `--block-confirmations 1`, `--fee-token-address 0x0000000000000000000000000000000000000000`.

## Verify Result

The `example01` task logs the message ID and a link to monitor:

- **Monitor:** https://ccip.chain.link

Use the message ID in the CCIP Explorer to track status.
