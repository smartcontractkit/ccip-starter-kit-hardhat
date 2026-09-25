# Example 07: CCT Lock and Release

This example covers the full LockRelease CCT flow on Sepolia → Amoy:

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
> npx hardhat keystore set AMOY_PRIVATE_KEY
> npx hardhat keystore set SEPOLIA_PRIVATE_KEY
> npx hardhat keystore set AMOY_RPC_URL
> npx hardhat keystore set SEPOLIA_RPC_URL
> ```
>
> Ensure `ignition/paramsEthSepolia.json` and `ignition/paramsAmoy.json` contain the correct `routerAddress`, `armProxy`, `registryModuleOwnerCustom`, and `tokenAdminRegistry` for each chain.

## Deployment Defaults

The LockAndReleaseTokenPool Ignition module deploys:

- **Token:** **CrossChainToken** with the same defaults and `registerAdminViaGetCCIPAdmin` flow as Example 06: `TestToken` (`TEST`), 18 decimals, 1_000_000 × 10¹⁸ premint, 100_000_000 × 10¹⁸ max supply.
- **Lock box:** ERC20LockBox bound to the token.
- **Pool:** LockReleaseTokenPool with no advanced pool hook (CCT 02).

## Step 1: Deploy Token + Lock Box + Pool on Sepolia

```bash
npx hardhat ignition deploy ignition/modules/LockAndReleaseTokenPool.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

`--parameters` is the path to the chain's Ignition parameters JSON (e.g. `ignition/paramsEthSepolia.json` or `ignition/paramsAmoy.json`); it supplies router, arm proxy, token admin registry, and other addresses to the module.

Save from the deployment output:

- `<SEPOLIA_TOKEN_ADDRESS>` (CrossChainToken; same defaults as Example 06)
- `<SEPOLIA_LOCKBOX_ADDRESS>` (ERC20LockBox)
- `<SEPOLIA_POOL_ADDRESS>` (LockReleaseTokenPool)

## Step 2: Deploy Token + Lock Box + Pool on Amoy

```bash
npx hardhat ignition deploy ignition/modules/LockAndReleaseTokenPool.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

Use the parameters file for the chain you are deploying to.

Save from the deployment output:

- `<AMOY_TOKEN_ADDRESS>`
- `<AMOY_LOCKBOX_ADDRESS>`
- `<AMOY_POOL_ADDRESS>`

## Step 3: Configure Sepolia Pool With Amoy Remote

```bash
npx hardhat example07-step1 --network <NETWORK_NAME> \
  --local-pool <SEPOLIA_POOL_ADDRESS> \
  --remote-chain-selector <AMOY_CHAIN_SELECTOR> \
  --remote-token <AMOY_TOKEN_ADDRESS> \
  --remote-pool <AMOY_POOL_ADDRESS>
```

## Step 4: Configure Amoy Pool With Sepolia Remote

```bash
npx hardhat example07-step1 --network <NETWORK_NAME> \
  --local-pool <AMOY_POOL_ADDRESS> \
  --remote-chain-selector <SEPOLIA_CHAIN_SELECTOR> \
  --remote-token <SEPOLIA_TOKEN_ADDRESS> \
  --remote-pool <SEPOLIA_POOL_ADDRESS>
```

## Step 5: Fund Destination Lock Box Liquidity

For Sepolia → Amoy transfers, fund the Amoy lock box first:

```bash
npx hardhat example07-step2 --network <NETWORK_NAME> \
  --token <AMOY_TOKEN_ADDRESS> \
  --lock-box <AMOY_LOCKBOX_ADDRESS> \
  --amount <LIQUIDITY_AMOUNT>
```

Use an amount in wei (e.g. `1000000000000000000000` for 1000 tokens with 18 decimals). If you also want Amoy → Sepolia transfers, fund the Sepolia lock box the same way:

```bash
npx hardhat example07-step2 --network <NETWORK_NAME> \
  --token <SEPOLIA_TOKEN_ADDRESS> \
  --lock-box <SEPOLIA_LOCKBOX_ADDRESS> \
  --amount <LIQUIDITY_AMOUNT>
```

## Step 6: Send LockRelease Transfer (ExtraArgsV3 + Default Finality)

```bash
npx hardhat example07-step3 --network <NETWORK_NAME> \
  --source-router <SEPOLIA_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <RECEIVER_ON_AMOY> \
  --token-to-send <SEPOLIA_TOKEN_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit 0 \
  --block-confirmations 0 \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--amount`: token amount in wei (e.g. `1000000000000000000` for 1 token with 18 decimals).
- `--gas-limit 0`: token-only transfer to an EOA receiver.
- This task uses ExtraArgsV3 with `blockConfirmations = 0` (default finality).
- `--fee-token-address`: use `0x0000000000000000000000000000000000000000` for native fee, or the LINK token address on Sepolia for LINK fee.

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
