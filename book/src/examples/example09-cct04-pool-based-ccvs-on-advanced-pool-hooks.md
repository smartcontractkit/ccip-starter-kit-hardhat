# Example 09: Pool-Based CCV Requirements on AdvancedPoolHooks

This example covers pool-based CCV (Cross-Chain Verifier) requirements on `AdvancedPoolHooks`, continuing the setup from Example 08.

## Pool-Based CCVs

A token pool can require specific CCVs for its transfers. When a pool requires CCVs:

- the source OnRamp consults the pool's `getRequiredCCVs(...)` outbound and calls each CCV's `getOutboundImplementation` and `forwardToVerifier` on the source chain
- the destination OffRamp resolves the same CCV addresses on the destination chain and calls `getInboundImplementation` and `verifyMessage` before releasing or minting tokens

Because the destination OffRamp resolves the same address, **a pool-required CCV must exist at the same address on both chains**. Real CCVs are CREATE2-deployed to matching addresses on each chain.

`AdvancedPoolHooks` exposes this through per-remote-chain CCV configs:

- `outboundCCVs` / `inboundCCVs`: base CCVs, always required for transfers to/from that chain
- `thresholdOutboundCCVs` / `thresholdInboundCCVs`: additional CCVs, required only when the transfer amount is at or above `thresholdAmountForAdditionalCCVs`
- `address(0)` in a base list means "use the lane defaults alongside the other listed CCVs"

Threshold CCV lists require non-empty base lists (use `address(0)` in the base list if you want defaults below the threshold). Duplicates within and across lists are rejected.

## What This Example Covers

1. Deploy CrossChainToken + `AdvancedPoolHooks` + BurnMint pool on both chains (Example 08 steps 1-4).
2. Set pool CCV configs on both hooks (`example09-step1`).
3. Send a token transfer and observe the CCV being consulted on both sides.
4. Adjust the threshold amount and observe threshold CCVs becoming required (`example09-step2`).
5. Clear the CCV config.

Modules and tasks used:

- **Deploy token + hook + pool, configure lanes:** Example 08 (Ignition module `ignition/modules/BurnMintTokenPoolAdvancedPoolHook.ts` and task `example08-step1`)
- **Set pool CCV config:** Hardhat task `example09-step1`
- **Set threshold amount:** Hardhat task `example09-step2`
- **Send CCIP token transfer:** Hardhat task `example06-step2`

> **Note on real CCVs**
>
> This starter kit does not deploy a real CCV. To try pool-based CCVs end to end on the live testnets, deploy your own CCV with the [CCV starter kit](https://docs.chain.link/ccip/ccv-starter-kit) and use its resolver address as `<CCV_ADDRESS>` below. The short version:
>
> 1. **On-chain contracts, on both chains** — use the [on-chain contracts kit](https://github.com/smartcontractkit/chainlink-ccv-starter-kit-contracts) to deploy the CREATE2 factory, the `VersionedVerifierResolver`, and the committee verifier, then apply the lane and signature config. The kit's [full flow](https://github.com/smartcontractkit/chainlink-ccv-starter-kit-contracts/blob/main/docs/src/full-flow.md) walks the exact `make` commands; the resolver lands at the same address on both chains by construction (`make deployments-check` asserts the parity).
> 2. **Off-chain cell** — use the [off-chain kit](https://github.com/smartcontractkit/chainlink-ccv-starter-kit) to run the verifier and aggregator that actually attest messages (a Helm chart in Kubernetes, or the [local docker-compose stack](https://github.com/smartcontractkit/chainlink-ccv-starter-kit/tree/main/local) for testing). Without a running cell, the CCV exists on-chain but never attests, so messages requiring it will not execute.
>
> Use the **resolver** address (not the committee verifier implementation) as `<CCV_ADDRESS>`: a pool that lists the implementation address reverts during the fee quote.

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

## Step 2: Set Pool CCV Config on Sepolia

Require `<CCV_ADDRESS>` for both outbound and inbound traffic to Amoy:

```bash
npx hardhat example09-step1 --network <NETWORK_NAME> \
  --advanced-pool-hook <SEPOLIA_ADVANCED_POOL_HOOK_ADDRESS> \
  --remote-chain-selector <AMOY_CHAIN_SELECTOR> \
  --outbound-ccvs "<CCV_ADDRESS>" \
  --inbound-ccvs "<CCV_ADDRESS>"
```

The four list options (`--outbound-ccvs`, `--threshold-outbound-ccvs`, `--inbound-ccvs`, `--threshold-inbound-ccvs`) take comma-separated addresses and default to empty.

## Step 3: Set Pool CCV Config on Amoy

Require the same `<CCV_ADDRESS>` for traffic to Sepolia:

```bash
npx hardhat example09-step1 --network <NETWORK_NAME> \
  --advanced-pool-hook <AMOY_ADVANCED_POOL_HOOK_ADDRESS> \
  --remote-chain-selector <SEPOLIA_CHAIN_SELECTOR> \
  --outbound-ccvs "<CCV_ADDRESS>" \
  --inbound-ccvs "<CCV_ADDRESS>"
```

## Step 4: Send Transfer (Reuse the Example 06 Sender)

```bash
npx hardhat example06-step2 --network <NETWORK_NAME> \
  --source-router <SEPOLIA_ROUTER> \
  --destination-chain-selector <AMOY_CHAIN_SELECTOR> \
  --receiver <RECEIVER_ON_AMOY> \
  --token-to-send <SEPOLIA_TOKEN_ADDRESS> \
  --amount <AMOUNT> \
  --gas-limit 0 \
  --block-confirmations 0 \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

The source OnRamp now consults `<CCV_ADDRESS>` outbound, and the destination OffRamp verifies the message with the same address before minting.

> **Note on execution with a self-run CCV**
>
> Until your CCV is onboarded into the CCIP indexer, the default executor cannot fetch its attestation, so the message sits at `UNTOUCHED` after it is sent. Execute it yourself with the [CCIP CLI](https://docs.chain.link/ccip/tools/cli/) (1.14.0 or later), reading the attestation directly from your own aggregator:
>
> ```bash
> ccip-cli manual-exec <SOURCE_TX_HASH> --verifiers grpcs://<YOUR_AGGREGATOR_HOST>:443
> ```
>
> See [Test your setup](https://docs.chain.link/ccip/ccv-starter-kit/evm/test-your-setup) in the CCV starter kit docs for the full walkthrough.

## Step 5: Adjust the Threshold Amount

Threshold CCVs are required only for transfers at or above `thresholdAmountForAdditionalCCVs`. Example 08 deployed the hook with the threshold from your Ignition parameters file (`1` in the sample files), so threshold CCVs are effectively always required. Raise the threshold so they apply only to large transfers:

```bash
npx hardhat example09-step2 --network <NETWORK_NAME> \
  --advanced-pool-hook <SEPOLIA_ADVANCED_POOL_HOOK_ADDRESS> \
  --threshold-amount 10000000000000000000000
```

Repeat on Amoy for the inbound side:

```bash
npx hardhat example09-step2 --network <NETWORK_NAME> \
  --advanced-pool-hook <AMOY_ADVANCED_POOL_HOOK_ADDRESS> \
  --threshold-amount 10000000000000000000000
```

To use threshold CCVs, set a config with non-empty threshold lists, for example `--outbound-ccvs "<CCV_ADDRESS>" --inbound-ccvs "<CCV_ADDRESS>" --threshold-outbound-ccvs "<SECOND_CCV_ADDRESS>" --threshold-inbound-ccvs "<SECOND_CCV_ADDRESS>"` (duplicates across lists are rejected).

## Step 6: Clear the CCV Config

Re-run `example09-step1` with no lists to remove the config for that lane:

```bash
npx hardhat example09-step1 --network <NETWORK_NAME> \
  --advanced-pool-hook <SEPOLIA_ADVANCED_POOL_HOOK_ADDRESS> \
  --remote-chain-selector <AMOY_CHAIN_SELECTOR>
```

## Step 7: Verify Hook State

The `example09-step1` and `example09-step2` tasks print the stored config and threshold after each update. To check them later, use your RPC and a contract read on each hook:

- `getCCVConfig(uint64 remoteChainSelector)` returns the four stored lists for that lane
- `getThresholdAmount()` returns the threshold amount

Monitor message status with the message ID on:

- https://ccip.chain.link
