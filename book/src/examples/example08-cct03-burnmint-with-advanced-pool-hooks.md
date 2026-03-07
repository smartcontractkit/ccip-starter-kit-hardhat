# Example 08: CCT Burn and Mint With AdvancedPoolHooks

This example covers BurnMint CCT on Fuji → Sepolia with `AdvancedPoolHooks` attached to the pool.

## Token Pool Hooks Development

Token pool hooks are standalone contracts used by token pools for additional checks and behavior.

At a high level:

- pool calls hook `preflightCheck(...)` on source-side lock/burn
- pool calls hook `postflightCheck(...)` on destination-side release/mint
- hook can enforce allowlists and CCV requirements
- hook can optionally call a policy engine

For custom development, the pool-level integration point is `IAdvancedPoolHooks` and the pool constructor receives
the hook address.

## Chainlink ACE Context

`AdvancedPoolHooks` includes optional policy engine integration through `IPolicyEngine`.
In this example, policy engine is intentionally disabled (`address(0)`) to focus on hook attachment and allowlist flow.

When building policy-engine-driven flows, Chainlink ACE provides the policy engine interfaces and implementation model.

This flow still demonstrates the correct hook wiring pattern for ACE-enabled setups.

## What This Example Covers

1. Deploy BurnMint token + `AdvancedPoolHooks` + BurnMint pool on both chains (Hardhat Ignition).
2. Configure pools to trust each other (`example08-step1`).
3. Send token transfer with ExtraArgsV3 default-finality sender (`example08-step2`).
4. (Optional) Update hook allowlist (`example08-step3`).
5. Verify hook attachment and allowlist with helper tasks.

Modules and tasks used:

- **Deploy token + hook + pool:** Hardhat Ignition module `ignition/modules/BurnMintTokenPoolAdvancedPoolHook.ts` (deploy on each chain with the appropriate parameters file).
- **Configure remote lane:** Hardhat task `example08-step1`.
- **Send CCIP token transfer:** Hardhat task `example08-step2`.
- **Update allowlist:** Hardhat task `example08-step3`.
- **Verify:** Helper tasks `token-admin-registry-get-pool`, `get-allow-list`.

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
> Ensure `ignition/paramsFuji.json` and `ignition/paramsEthSepolia.json` contain the correct `routerAddress`, `armProxy`, `registryModuleOwnerCustom`, `tokenAdminRegistry`, and `thresholdAmountForAdditionalCCVs` for each chain.

## Deployment Defaults

The BurnMintTokenPoolAdvancedPoolHook Ignition module deploys:

- **Token:** `TestToken` (`TEST`), 18 decimals, 1_000_000 × 10¹⁸ premint, 100_000_000 × 10¹⁸ max supply.
- **Hook:** AdvancedPoolHooks with allowlist seeded with deployer EOA, `thresholdAmountForAdditionalCCVs` from params, policy engine disabled, pool authorized as caller.
- **Pool:** BurnMintTokenPool with the hook attached.

## Step 1: Deploy Token + Hook + Pool on Fuji

```bash
npx hardhat ignition deploy ignition/modules/BurnMintTokenPoolAdvancedPoolHook.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

`--parameters` is the path to the chain's Ignition parameters JSON (e.g. `ignition/paramsFuji.json` or `ignition/paramsEthSepolia.json`); it supplies router, arm proxy, token admin registry, `thresholdAmountForAdditionalCCVs`, and other addresses to the module.

Save from the deployment output:

- `<FUJI_TOKEN_ADDRESS>`
- `<FUJI_ADVANCED_POOL_HOOK_ADDRESS>`
- `<FUJI_POOL_ADDRESS>`

## Step 2: Deploy Token + Hook + Pool on Sepolia

```bash
npx hardhat ignition deploy ignition/modules/BurnMintTokenPoolAdvancedPoolHook.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

Use the parameters file for the chain you are deploying to.

Save from the deployment output:

- `<SEPOLIA_TOKEN_ADDRESS>`
- `<SEPOLIA_ADVANCED_POOL_HOOK_ADDRESS>`
- `<SEPOLIA_POOL_ADDRESS>`

## Step 3: Configure Fuji Pool With Sepolia Remote

```bash
npx hardhat example08-step1 --network <NETWORK_NAME> \
  --local-pool <FUJI_POOL_ADDRESS> \
  --remote-chain-selector <SEPOLIA_CHAIN_SELECTOR> \
  --remote-token <SEPOLIA_TOKEN_ADDRESS> \
  --remote-pool <SEPOLIA_POOL_ADDRESS>
```

## Step 4: Configure Sepolia Pool With Fuji Remote

```bash
npx hardhat example08-step1 --network <NETWORK_NAME> \
  --local-pool <SEPOLIA_POOL_ADDRESS> \
  --remote-chain-selector <FUJI_CHAIN_SELECTOR> \
  --remote-token <FUJI_TOKEN_ADDRESS> \
  --remote-pool <FUJI_POOL_ADDRESS>
```

## Step 5: Send Transfer (ExtraArgsV3 + Default Finality)

```bash
npx hardhat example08-step2 --network <NETWORK_NAME> \
  --source-router <FUJI_ROUTER> \
  --destination-chain-selector <SEPOLIA_CHAIN_SELECTOR> \
  --receiver <RECEIVER_ON_SEPOLIA> \
  --token-to-send <FUJI_TOKEN_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit 0 \
  --block-confirmations 0 \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

## Optional: Update Hook Allowlist

To add or remove senders in the allowlist after deployment, use the `example08-step3` task.

Add one sender address:

```bash
npx hardhat example08-step3 --network <NETWORK_NAME> \
  --advanced-pool-hook <ADVANCED_POOL_HOOK_ADDRESS> \
  --removes "" \
  --adds "<ADDRESS_TO_ADD>"
```

Remove one sender address:

```bash
npx hardhat example08-step3 --network <NETWORK_NAME> \
  --advanced-pool-hook <ADVANCED_POOL_HOOK_ADDRESS> \
  --removes "<ADDRESS_TO_REMOVE>" \
  --adds ""
```

To add or remove multiple addresses, use comma-separated values for `--adds` and `--removes`.

## Step 6: Verify Hook and Pool State

Verify token→pool registration:

```bash
npx hardhat token-admin-registry-get-pool --network <NETWORK_NAME> --registry <TOKEN_ADMIN_REGISTRY> --token <TOKEN_ADDRESS>
```

Verify allowlist (addresses in the hook):

```bash
npx hardhat get-allow-list --network <NETWORK_NAME> --advanced-pool-hook <ADVANCED_POOL_HOOK_ADDRESS>
```

To verify the attached hook address on each pool or the allowlist-enabled flag, use your RPC and a contract read (e.g. `getAdvancedPoolHooks()`, `getAllowListEnabled()`).

Monitor message status with the message ID on:

- https://ccip.chain.link
