# Example 06: CCT Burn and Mint

This example covers the full BurnMint CCT flow on Sepolia → Amoy:

1. Deploy [`CrossChainToken`](https://github.com/smartcontractkit/chainlink-ccip/blob/develop/chains/evm/contracts/tokens/CrossChainToken.sol) + BurnMint pool on both chains (Hardhat Ignition).
2. Configure pools to trust each other (`example06-step1`).
3. Enable FTF on both pools and check the source lane gates.
4. Send at default finality or Faster Than Finality (`example06-step2`).
5. Verify BurnMint behavior (burn on source, mint on destination) with helper tasks.

Modules and tasks used:

- **Deploy token + pool:** Hardhat Ignition module `ignition/modules/BurnMintTokenPool.ts` (deploy on each chain with the appropriate parameters file).
- **Configure remote lane:** Hardhat task `example06-step1`.
- **Set pool FTF policy:** Hardhat task `example06-set-pool-finality`.
- **Inspect FTF gates:** Hardhat task `example06-check-finality-gates`.
- **Send CCIP token transfer:** Hardhat task `example06-step2`.
- **Verify:** Helper tasks `token-admin-registry-get-pool`, `pool-get-remote-token`, `pool-get-remote-pools`, `erc20-balance-of`, `erc20-total-supply`.

## Before You Start

> **Important: Keystore first**
>
> Use a local keystore account for task execution:
>
> ```bash
> npx hardhat keystore set SEPOLIA_PRIVATE_KEY
> npx hardhat keystore set AMOY_PRIVATE_KEY
> npx hardhat keystore set SEPOLIA_RPC_URL
> npx hardhat keystore set AMOY_RPC_URL
> ```
>
> Ensure `ignition/paramsAmoy.json` and `ignition/paramsEthSepolia.json` contain the correct `routerAddress`, `armProxy`, `registryModuleOwnerCustom`, and `tokenAdminRegistry` for each chain.

## Deployment Defaults

The BurnMintTokenPool Ignition module deploys:

- **Token:** **CrossChainToken** via `BaseERC20.ConstructorParams`: `TestToken` (`TEST`), 18 decimals, 1_000_000 × 10¹⁸ premint, 100_000_000 × 10¹⁸ max supply. The deployer EOA is pre-mint recipient, CCIP admin, burn/mint admin, and default admin. Registration uses `RegistryModuleOwnerCustom.registerAdminViaGetCCIPAdmin`.
- **Pool:** BurnMintTokenPool with no advanced pool hook (CCT 01).

## Step 1: Deploy Token + Pool on Sepolia (source)

```bash
npx hardhat ignition deploy ignition/modules/BurnMintTokenPool.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

`--parameters` is the path to the chain's Ignition parameters JSON (e.g. `ignition/paramsAmoy.json` or `ignition/paramsEthSepolia.json`); it supplies router, arm proxy, token admin registry, and other addresses to the module.

Save from the deployment output:

- `<SEPOLIA_TOKEN_ADDRESS>` (CrossChainToken)
- `<SEPOLIA_POOL_ADDRESS>` (BurnMintTokenPool)

## Step 2: Deploy Token + Pool on Amoy (destination)

```bash
npx hardhat ignition deploy ignition/modules/BurnMintTokenPool.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

Use the parameters file for the chain you are deploying to.

Save from the deployment output:

- `<AMOY_TOKEN_ADDRESS>`
- `<AMOY_POOL_ADDRESS>`

## Step 3: Configure Sepolia Pool With Amoy Remote

```bash
npx hardhat example06-step1 --network <NETWORK_NAME> \
  --local-pool <SEPOLIA_POOL_ADDRESS> \
  --remote-chain-selector <AMOY_CHAIN_SELECTOR> \
  --remote-token <AMOY_TOKEN_ADDRESS> \
  --remote-pool <AMOY_POOL_ADDRESS>
```

## Step 4: Configure Amoy Pool With Sepolia Remote

```bash
npx hardhat example06-step1 --network <NETWORK_NAME> \
  --local-pool <AMOY_POOL_ADDRESS> \
  --remote-chain-selector <SEPOLIA_CHAIN_SELECTOR> \
  --remote-token <SEPOLIA_TOKEN_ADDRESS> \
  --remote-pool <SEPOLIA_POOL_ADDRESS>
```

## Step 5: Enable Faster Than Finality on Both Pools

New pools allow full finality only (`0x00000000`). FTF is a pool setting; configure both pools:

```bash
npx hardhat example06-set-pool-finality --network <NETWORK_NAME> --local-pool <SEPOLIA_POOL_ADDRESS> --min-block-depth <MIN_BLOCK_DEPTH>
npx hardhat example06-set-pool-finality --network <NETWORK_NAME> --local-pool <AMOY_POOL_ADDRESS> --min-block-depth <MIN_BLOCK_DEPTH>
```

The task reads back each value. `0` disables FTF; `1`–`65535` set the minimum depth. The staged
wait-for-safe flag is not usable on this lane.

## Step 6: Check the Finality Gates

```bash
npx hardhat example06-check-finality-gates --network <NETWORK_NAME> \
  --source-router <SEPOLIA_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --token-to-send <SEPOLIA_TOKEN_ADDRESS> \
  --block-confirmations <BLOCK_CONFIRMATIONS_GT_ZERO>
```

The read-only task checks the pool, executor, and CCVs. A `getFee` quote alone does not prove
`ccipSend` will succeed for a non-`IPoolV2` pool.

## Step 7: Send BurnMint Transfer

```bash
npx hardhat example06-step2 --network <NETWORK_NAME> \
  --source-router <SEPOLIA_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <RECEIVER_ON_AMOY> \
  --token-to-send <SEPOLIA_TOKEN_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit <GAS_LIMIT> \
  --block-confirmations 0 \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--amount`: token amount in wei (e.g. `1000000000000000000` for 1 token with 18 decimals).
- For token-only transfer to an EOA receiver, use `--gas-limit 0`.
- This task uses ExtraArgsV3 with `blockConfirmations = 0` (default finality).
- `--fee-token-address`: use `0x0000000000000000000000000000000000000000` for native fee, or the LINK token address on Sepolia for LINK fee.

For the FTF version, run the same task after Steps 5 and 6 with a permitted depth:

```bash
npx hardhat example06-step2 --network <NETWORK_NAME> \
  --source-router <SEPOLIA_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <RECEIVER_ON_AMOY> \
  --token-to-send <SEPOLIA_TOKEN_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit <GAS_LIMIT> \
  --block-confirmations <BLOCK_CONFIRMATIONS_GT_ZERO> \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

## Step 8: Verify BurnMint Behavior

Verify token→pool registration:

```bash
npx hardhat token-admin-registry-get-pool --network <NETWORK_NAME> --registry <TOKEN_ADMIN_REGISTRY> --token <TOKEN_ADDRESS>
```

Verify remote lane mapping (tasks decode bytes to address):

```bash
npx hardhat pool-get-remote-token --network <NETWORK_NAME> --pool <POOL_ADDRESS> --chain-selector <CHAIN_SELECTOR>
npx hardhat pool-get-remote-pools --network <NETWORK_NAME> --pool <POOL_ADDRESS> --chain-selector <CHAIN_SELECTOR>
```

Verify balances and supplies after transfer finalizes:

```bash
npx hardhat erc20-balance-of --network <NETWORK_NAME> --token <TOKEN_ADDRESS> --account <ACCOUNT_ADDRESS>
npx hardhat erc20-total-supply --network <NETWORK_NAME> --token <TOKEN_ADDRESS>
```

Monitor message status with the message ID on:

- https://ccip.chain.link
