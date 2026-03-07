# Example 07: CCT Lock and Release

This example covers the full LockRelease CCT flow on Fuji → Sepolia:

1. Deploy token + lock box + LockRelease pool on both chains (Hardhat Ignition).
2. Configure pools to trust each other (`example07-step1`).
3. Fund destination lock box liquidity (`example07-step2`).
4. Send a token transfer across the lane (`example07-step3`).
5. Verify lock/release behavior with helper tasks.

Modules and tasks used:

- **Deploy token + lock box + pool:** Hardhat Ignition module `ignition/modules/LockAndReleaseTokenPool.ts` (deploy on each chain with the appropriate parameters file).
- **Configure remote lane:** Hardhat task `example07-step1`.
- **Fund lock box:** Hardhat task `example07-step2`.
- **Send CCIP token transfer:** Hardhat task `example07-step3`.
- **Verify:** Helper tasks `token-admin-registry-get-pool`, `pool-get-remote-token`, `pool-get-remote-pools`, `erc20-balance-of`.

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

The LockAndReleaseTokenPool Ignition module deploys:

- **Token:** `TestToken` (`TEST`), 18 decimals, 1_000_000 × 10¹⁸ premint, 100_000_000 × 10¹⁸ max supply.
- **Lock box:** ERC20LockBox bound to the token.
- **Pool:** LockReleaseTokenPool with no advanced pool hook (CCT 02).

## Step 1: Deploy Token + Lock Box + Pool on Fuji

```bash
npx hardhat ignition deploy ignition/modules/LockAndReleaseTokenPool.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

`--parameters` is the path to the chain's Ignition parameters JSON (e.g. `ignition/paramsFuji.json` or `ignition/paramsEthSepolia.json`); it supplies router, arm proxy, token admin registry, and other addresses to the module.

Save from the deployment output:

- `<FUJI_TOKEN_ADDRESS>` (FactoryBurnMintERC20 / token)
- `<FUJI_LOCKBOX_ADDRESS>` (ERC20LockBox)
- `<FUJI_POOL_ADDRESS>` (LockReleaseTokenPool)

## Step 2: Deploy Token + Lock Box + Pool on Sepolia

```bash
npx hardhat ignition deploy ignition/modules/LockAndReleaseTokenPool.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

Use the parameters file for the chain you are deploying to.

Save from the deployment output:

- `<SEPOLIA_TOKEN_ADDRESS>`
- `<SEPOLIA_LOCKBOX_ADDRESS>`
- `<SEPOLIA_POOL_ADDRESS>`

## Step 3: Configure Fuji Pool With Sepolia Remote

```bash
npx hardhat example07-step1 --network <NETWORK_NAME> \
  --local-pool <FUJI_POOL_ADDRESS> \
  --remote-chain-selector <SEPOLIA_CHAIN_SELECTOR> \
  --remote-token <SEPOLIA_TOKEN_ADDRESS> \
  --remote-pool <SEPOLIA_POOL_ADDRESS>
```

## Step 4: Configure Sepolia Pool With Fuji Remote

```bash
npx hardhat example07-step1 --network <NETWORK_NAME> \
  --local-pool <SEPOLIA_POOL_ADDRESS> \
  --remote-chain-selector <FUJI_CHAIN_SELECTOR> \
  --remote-token <FUJI_TOKEN_ADDRESS> \
  --remote-pool <FUJI_POOL_ADDRESS>
```

## Step 5: Fund Destination Lock Box Liquidity

For Fuji → Sepolia transfers, fund the Sepolia lock box first:

```bash
npx hardhat example07-step2 --network <NETWORK_NAME> \
  --token <SEPOLIA_TOKEN_ADDRESS> \
  --lock-box <SEPOLIA_LOCKBOX_ADDRESS> \
  --amount <LIQUIDITY_AMOUNT>
```

Use an amount in wei (e.g. `1000000000000000000000` for 1000 tokens with 18 decimals). If you also want Sepolia → Fuji transfers, fund the Fuji lock box the same way:

```bash
npx hardhat example07-step2 --network <NETWORK_NAME> \
  --token <FUJI_TOKEN_ADDRESS> \
  --lock-box <FUJI_LOCKBOX_ADDRESS> \
  --amount <LIQUIDITY_AMOUNT>
```

## Step 6: Send LockRelease Transfer (ExtraArgsV3 + Default Finality)

```bash
npx hardhat example07-step3 --network <NETWORK_NAME> \
  --source-router <FUJI_ROUTER> \
  --destination-chain-selector <SEPOLIA_CHAIN_SELECTOR> \
  --receiver <RECEIVER_ON_SEPOLIA> \
  --token-to-send <FUJI_TOKEN_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit 0 \
  --block-confirmations 0 \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--amount`: token amount in wei (e.g. `1000000000000000000` for 1 token with 18 decimals).
- `--gas-limit 0`: token-only transfer to an EOA receiver.
- This task uses ExtraArgsV3 with `blockConfirmations = 0` (default finality).
- `--fee-token-address`: use `0x0000000000000000000000000000000000000000` for native fee, or the LINK token address on Fuji for LINK fee.

## Step 7: Verify LockRelease Behavior

Verify token→pool registration:

```bash
npx hardhat token-admin-registry-get-pool --network <NETWORK_NAME> --registry <TOKEN_ADMIN_REGISTRY> --token <TOKEN_ADDRESS>
```

Verify remote lane mapping (tasks decode bytes to address):

```bash
npx hardhat pool-get-remote-token --network <NETWORK_NAME> --pool <POOL_ADDRESS> --chain-selector <REMOTE_CHAIN_SELECTOR>
npx hardhat pool-get-remote-pools --network <NETWORK_NAME> --pool <POOL_ADDRESS> --chain-selector <REMOTE_CHAIN_SELECTOR>
```

Verify lock box and receiver balances after transfer finalizes:

```bash
npx hardhat erc20-balance-of --network <NETWORK_NAME> --token <TOKEN_ADDRESS> --account <ACCOUNT_ADDRESS>
```

Monitor message status with the message ID on:

- https://ccip.chain.link
