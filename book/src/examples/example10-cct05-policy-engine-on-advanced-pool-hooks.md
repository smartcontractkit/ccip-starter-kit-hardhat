# Example 10: Policy Engine on AdvancedPoolHooks

This example covers policy engine integration on `AdvancedPoolHooks`, continuing the setup from Example 08.

## Policy Engine

`AdvancedPoolHooks` optionally calls a policy engine on every transfer:

- on the source chain, the hook's `preflightCheck` calls `policyEngine.run(...)` before the pool locks or burns
- on the destination chain, the hook's `postflightCheck` calls `policyEngine.run(...)` before the pool releases or mints

The hook passes its own `preflightCheck`/`postflightCheck` calldata (minus the selector) as the payload, so the engine can decode the transfer details and enforce policies. If `run` reverts, the transfer is rejected: on the source side the send reverts, on the destination side the message execution fails and can be retried.

The engine is called locally on each chain, so the source and destination engines are independent instances — unlike pool-required CCVs, they do not need to share an address.

For production-grade policy engines, use [Chainlink ACE](https://docs.chain.link/ace). This example attaches an existing engine by address and uses a minimal example engine (`contracts/ExamplePolicyEngine.sol`) that enforces a simple transfer-amount cap. To use a real ACE policy engine instead of the example engine, see [Use a real ACE policy engine](#use-a-real-ace-policy-engine) below.

## What This Example Covers

1. Deploy CrossChainToken + `AdvancedPoolHooks` + BurnMint pool on both chains (Example 08 steps 1-4).
2. Deploy the minimal example policy engine.
3. Attach the engine to the hook (`example10-step1`).
4. Send a transfer within the cap (allowed) and above the cap (rejected).
5. Detach the engine (`example10-step2`).

Modules and tasks used:

- **Deploy token + hook + pool, configure lanes:** Example 08 (Ignition module `ignition/modules/BurnMintTokenPoolAdvancedPoolHook.ts` and task `example08-step1`)
- **Deploy the example policy engine:** Hardhat Ignition module `ignition/modules/ExamplePolicyEngine.ts`
- **Attach the engine:** Hardhat task `example10-step1`
- **Detach the engine:** Hardhat task `example10-step2`
- **Send CCIP token transfer:** Hardhat task `example06-step2`

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

## Step 1: Deploy Token + Hook + Pool on Both Chains

Follow Example 08 steps 1-4 to deploy the token, hook and pool on both chains and link the lanes. Save from the deployment output:

- `<SEPOLIA_TOKEN_ADDRESS>`, `<SEPOLIA_ADVANCED_POOL_HOOK_ADDRESS>`, `<SEPOLIA_POOL_ADDRESS>`
- `<AMOY_TOKEN_ADDRESS>`, `<AMOY_ADVANCED_POOL_HOOK_ADDRESS>`, `<AMOY_POOL_ADDRESS>`

## Step 2: Deploy the Example Policy Engine on Sepolia

```bash
npx hardhat ignition deploy ignition/modules/ExamplePolicyEngine.ts --network <NETWORK_NAME>
```

Save from the deployment output:

- `<SEPOLIA_POLICY_ENGINE_ADDRESS>`

The example engine's default cap is `10 ether`, and only its owner (the deploying account) can change it with `setCap`. To use a real ACE policy engine instead, skip this step and follow [Use a real ACE policy engine](#use-a-real-ace-policy-engine) below, then pass the ACE engine's onchain address to Step 3.

## Step 3: Attach the Engine to the Sepolia Hook

```bash
npx hardhat example10-step1 --network <NETWORK_NAME> \
  --advanced-pool-hook <SEPOLIA_ADVANCED_POOL_HOOK_ADDRESS> \
  --policy-engine <SEPOLIA_POLICY_ENGINE_ADDRESS>
```

The hook calls the engine's `attach()`, which records the hook as an attached target.

## Step 4: Send a Transfer Within the Cap

```bash
npx hardhat example06-step2 --network <NETWORK_NAME> \
  --source-router <SEPOLIA_ROUTER> \
  --destination-chain-selector <AMOY_CHAIN_SELECTOR> \
  --receiver <RECEIVER_ON_AMOY> \
  --token-to-send <SEPOLIA_TOKEN_ADDRESS> \
  --amount 1000000000000000000 \
  --gas-limit 0 \
  --block-confirmations 0 \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

`1 ether` is within the `10 ether` cap, so the engine allows the transfer.

## Step 5: Send a Transfer Above the Cap

Send more than the cap (for example `11 ether`):

```bash
npx hardhat example06-step2 --network <NETWORK_NAME> \
  --source-router <SEPOLIA_ROUTER> \
  --destination-chain-selector <AMOY_CHAIN_SELECTOR> \
  --receiver <RECEIVER_ON_AMOY> \
  --token-to-send <SEPOLIA_TOKEN_ADDRESS> \
  --amount 11000000000000000000 \
  --gas-limit 0 \
  --block-confirmations 0 \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

The source-side `preflightCheck` calls the engine, which reverts with `AmountExceedsCap`, and the send reverts.

## Step 6: Detach the Engine

```bash
npx hardhat example10-step2 --network <NETWORK_NAME> \
  --advanced-pool-hook <SEPOLIA_ADVANCED_POOL_HOOK_ADDRESS>
```

The hook calls the engine's `detach()`. Transfers are no longer policy-checked.

## Optional: Destination-Side Engine

Attach an engine to the Amoy hook too (deploy a second engine on Amoy, then attach it to `<AMOY_ADVANCED_POOL_HOOK_ADDRESS>`). A destination-side rejection does not revert the send — the message is sent, but its execution on Amoy fails; check the message status on https://ccip.chain.link.

## Use a real ACE policy engine

The example engine exists so this chapter runs without any Platform setup. For real policy enforcement, use Chainlink ACE: it provides managed policy engines, a built-in `CCIP-AdvancedPoolHooks` contract type with a pre-built extractor for the hook calldata, and policies you configure in the [Chainlink Platform](https://app.chain.link). You need an ACE-enabled organization on the Platform and a completed [ACE account setup](https://docs.chain.link/ace/getting-started/account-setup) first. The flow below summarizes the [Protect CCIP Token Pools with ACE](https://docs.chain.link/ace/guides/policy-manager/ccip-token-pools) guide, which has the complete Platform walkthrough.

1. **Create a policy engine** in the Platform's Policy Manager, including every EVM chain where you want to enforce policies (see [Create a policy engine](https://docs.chain.link/ace/guides/policy-manager/manage-engines)). Wait until the engine is **Active**, then copy its onchain address for each chain.
2. **Attach the hook to the engine** with Step 3 above, passing the ACE engine's onchain address for that chain. The hook's `attach()` call is detected on-chain by ACE, which automatically adds the hook as a target under the engine. Do not register the hook manually as a second target.
3. **Verify the detected target**: in the Platform, open the engine's **Contracts** tab, find the target matching your hook's address, and assign it the built-in `CCIP-AdvancedPoolHooks` contract type. It ships with `preflightCheck` and `postflightCheck` and their pre-built extractor, so no custom contract type or extractor is needed.
4. **Create a policy instance and protect a hook function**: create the policy under the same engine and chain as the hook function you want to protect, then create a target protection selecting `preflightCheck` (source-side) or `postflightCheck` (destination-side), mapping policy parameters to the extractor's outputs (for example `from`, `to`, `amount_post_fee`).

One mapping gotcha from the ACE guide: the hook sets the payload sender to `msg.sender`, which is the Token Pool, not the user who initiated the transfer. To evaluate the user, map the extracted `from` output to the policy parameter.

## Step 7: Verify Hook and Engine State

The `example10-step1` and `example10-step2` tasks print the engine address stored on the hook after each update. To check state later, use your RPC and a contract read:

- on the hook: `getPolicyEngine()` returns the attached engine (the zero address when detached)
- on the example engine: `isAttached(address)` returns whether the hook is recorded as attached, and `getCap()` returns the transfer cap

Monitor message status with the message ID on:

- https://ccip.chain.link
