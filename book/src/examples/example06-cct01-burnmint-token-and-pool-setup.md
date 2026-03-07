# Example 06: CCT Burn and Mint

This example covers the full BurnMint CCT flow on Fuji → Sepolia:

1. Deploy BurnMint token + BurnMint pool on both chains (Hardhat Ignition).
2. Configure pools to trust each other (`example06-step1`).
3. Send a token transfer across the lane (`example06-step2`).
4. Verify BurnMint behavior (burn on source, mint on destination) with helper tasks.

Modules and tasks used:

- **Deploy token + pool:** Hardhat Ignition module `ignition/modules/BurnMintTokenPool.ts` (deploy on each chain with the appropriate parameters file).
- **Configure remote lane:** Hardhat task `example06-step1`.
- **Send CCIP token transfer:** Hardhat task `example06-step2`.
- **Verify:** Helper tasks `token-admin-registry-get-pool`, `pool-get-remote-token`, `pool-get-remote-pools`, `erc20-balance-of`, `erc20-total-supply`.

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
> Ensure `ignition/paramsFuji.json` and `ignition/paramsEthSepolia.json` contain the correct `routerAddress`, `armProxy`, `registryModuleOwnerCustom`, and `tokenAdminRegistry` for each chain.

## Deployment Defaults

The BurnMintTokenPool Ignition module deploys:

- **Token:** `TestToken` (`TEST`), 18 decimals, 1_000_000 × 10¹⁸ premint, 100_000_000 × 10¹⁸ max supply.
- **Pool:** BurnMintTokenPool with no advanced pool hook (CCT 01).

## Step 1: Deploy Token + Pool on Fuji

```bash
npx hardhat ignition deploy ignition/modules/BurnMintTokenPool.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

`--parameters` is the path to the chain's Ignition parameters JSON (e.g. `ignition/paramsFuji.json` or `ignition/paramsEthSepolia.json`); it supplies router, arm proxy, token admin registry, and other addresses to the module.

Save from the deployment output:

- `<FUJI_TOKEN_ADDRESS>` (FactoryBurnMintERC20 / token)
- `<FUJI_POOL_ADDRESS>` (BurnMintTokenPool)

## Step 2: Deploy Token + Pool on Sepolia

```bash
npx hardhat ignition deploy ignition/modules/BurnMintTokenPool.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

Use the parameters file for the chain you are deploying to.

Save from the deployment output:

- `<SEPOLIA_TOKEN_ADDRESS>`
- `<SEPOLIA_POOL_ADDRESS>`

## Step 3: Configure Fuji Pool With Sepolia Remote

```bash
npx hardhat example06-step1 --network <NETWORK_NAME> \
  --local-pool <FUJI_POOL_ADDRESS> \
  --remote-chain-selector <SEPOLIA_CHAIN_SELECTOR> \
  --remote-token <SEPOLIA_TOKEN_ADDRESS> \
  --remote-pool <SEPOLIA_POOL_ADDRESS>
```

## Step 4: Configure Sepolia Pool With Fuji Remote

```bash
npx hardhat example06-step1 --network <NETWORK_NAME> \
  --local-pool <SEPOLIA_POOL_ADDRESS> \
  --remote-chain-selector <FUJI_CHAIN_SELECTOR> \
  --remote-token <FUJI_TOKEN_ADDRESS> \
  --remote-pool <FUJI_POOL_ADDRESS>
```

## Step 5: Send BurnMint Transfer (ExtraArgsV3 + Default Finality)

```bash
npx hardhat example06-step2 --network <NETWORK_NAME> \
  --source-router <FUJI_ROUTER> \
  --destination-chain-selector <SEPOLIA_CHAIN_SELECTOR> \
  --receiver <RECEIVER_ON_SEPOLIA> \
  --token-to-send <FUJI_TOKEN_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit <GAS_LIMIT> \
  --block-confirmations 0 \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--amount`: token amount in wei (e.g. `1000000000000000000` for 1 token with 18 decimals).
- For token-only transfer to an EOA receiver, use `--gas-limit 0`.
- This task uses ExtraArgsV3 with `blockConfirmations = 0` (default finality).
- `--fee-token-address`: use `0x0000000000000000000000000000000000000000` for native fee, or the LINK token address on Fuji for LINK fee.

## Step 6: Verify BurnMint Behavior

Verify token→pool registration:

```bash
# Fuji: pool for token
npx hardhat token-admin-registry-get-pool --network <NETWORK_NAME> --registry <TOKEN_ADMIN_REGISTRY> --token <TOKEN_ADDRESS>
```

Verify remote lane mapping (tasks decode bytes to address):

```bash
# Fuji pool: remote token and pools for Sepolia chain
npx hardhat pool-get-remote-token --network <NETWORK_NAME> --pool <POOL_ADDRESS> --chain-selector <CHAIN_SELECTOR>
npx hardhat pool-get-remote-pools --network <NETWORK_NAME> --pool <POOL_ADDRESS> --chain-selector <CHAIN_SELECTOR>
```

Verify balances and supplies after transfer finalizes:

```bash
npx hardhat erc20-balance-of --network <NETWORK_NAME> --token <OKEN_ADDRESS> --account <SOURCE_EOA_ADDRESS>
npx hardhat erc20-total-supply --network <NETWORK_NAME> --token <TOKEN_ADDRESS>
```

Monitor message status with the message ID on:

- https://ccip.chain.link
