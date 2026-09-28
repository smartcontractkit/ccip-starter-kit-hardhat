# Legacy 01: ExtraArgsV1 Token Transfer

This example sends a token transfer using `ExtraArgsV1` from an EOA.

Task: `legacy01` (implementation: `tasks/Legacy01.ts`).

## What You Will Do

1. Mint test token(s) to your EOA on the source chain with the `faucet` task.
2. Send token(s) using `ExtraArgsV1` with the `legacy01` task.
3. Observe the message on CCIP Explorer.

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

You do not need to deploy a receiver contract for this token-only example.
Use a destination EOA as the receiver and pass `--gas-limit 0`.

## Step 1: Get 1 CCIP-BnM Token on Source Chain

```bash
npx hardhat faucet --network <NETWORK_NAME> --ccip-bnm <CCIP_BNM_SOURCE_TOKEN_ADDRESS>
```

## Step 2: Send Token With ExtraArgsV1

```bash
npx hardhat legacy01 --network <NETWORK_NAME> \
  --source-router <SOURCE_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <DESTINATION_EOA_ADDRESS> \
  --token-to-send <CCIP_BNM_SOURCE_TOKEN_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit <GAS_LIMIT> \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--amount`: token amount in wei (for 18 decimals, `1000000000000000000` is 1 token).
- `--gas-limit`: set `0` for token-only transfer to an EOA receiver. Use `> 0` for contract callback.
- `--fee-token-address`: LINK token address on the source chain to pay in LINK, or `0x0000000000000000000000000000000000000000` to pay in native coin.

## Verify Result

Use the logged message ID in:

- https://ccip.chain.link
