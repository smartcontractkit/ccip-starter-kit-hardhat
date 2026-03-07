# Example 05: ExtraArgsV3 No-Execution-Tag (Manual Execution Path)

This example sends a Hello World data message from an EOA, but disables automatic execution by setting `executor` to `NO_EXECUTION_ADDRESS` inside `ExtraArgsV3`.

Task: `example05` (implementation: `tasks/Example05.ts`).

## What You Will Do

1. Ensure destination `BasicMessageReceiver` exists (deploy via Ignition if needed; see Example 02).
2. Send a CCIP data message with `ExtraArgsV3` no-execution-tag using the `example05` task.
3. Observe pending execution in CCIP Explorer and execute manually.

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

> **If you do not have a receiver deployed yet**
>
> Deploy `BasicMessageReceiver` on the destination chain with Ignition (see Example 02):
>
> ```bash
> npx hardhat ignition deploy ignition/modules/BasicMessageReceiver.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
> ```
>
> `--parameters` is the path to the chain's Ignition parameters JSON; it supplies router and other addresses to the module.
>
> Save the deployed receiver address for use as `--receiver` below.

## Understanding ExtraArgsV3

The `ExtraArgsV3` is a structured set of delivery/execution options encoded and attached to a CCIP message.

```c++
struct GenericExtraArgsV3 {
    uint32 gasLimit;
    uint16 blockConfirmations;
    address[] ccvs;
    bytes[] ccvArgs;
    address executor;
    bytes executorArgs;
    bytes tokenReceiver;
    bytes tokenArgs;
}
```

- `gasLimit`: gas allocated for callback execution on destination. If `0` and message data is empty, no callback executes.
- `blockConfirmations`: confirmation depth before execution. `0` means default finality for the lane.
- `ccvs`: list of cross-chain verifier addresses. Empty means default verifiers.
- `ccvArgs`: optional arguments for each CCV. Must match `ccvs` length.
- `executor`: executor address on source chain. `address(0)` uses default executor.
- `executorArgs`: chain/executor-specific args (format depends on chain family/executor implementation).
- `tokenReceiver`: encoded destination token receiver. If empty, receiver address is used.
- `tokenArgs`: extra token transfer args (pool-specific format).

Related helpers in `scripts/CallEncodeExtraArgsOffchain.ts`:

- `encodeV3Basic(gasLimit, blockConfirmations)` for a minimal V3 payload.
- `getNoExecutionAddress()` returns `Client.NO_EXECUTION_ADDRESS` for the manual execution path.

The `example05` task uses these to build ExtraArgsV3 with the no-execution tag.

## Step 1: Send Message With No-Execution-Tag

Run the `example05` task. It sends a data-only message with executor set to `NO_EXECUTION_ADDRESS`, so execution stays pending until triggered manually.

```bash
npx hardhat example05 --network <NETWORK_NAME> \
  --source-router <SOURCE_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS> \
  --message-text "Hello, World" \
  --gas-limit <GAS_LIMIT> \
  --block-confirmations <BLOCK_CONFIRMATIONS> \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--gas-limit` must be `> 0` because the receiver callback needs gas (e.g. `200000`).
- `--block-confirmations` can be `0` (default finality) or `> 0`.
- `--fee-token-address`: LINK token address on the source chain to pay fees in LINK, or `0x0000000000000000000000000000000000000000` to pay in native coin.
- This example sets executor to `NO_EXECUTION_ADDRESS`, so execution is not automatic; the message remains in a pending/manual execution state.

Defaults (can be omitted): `--gas-limit 200000`, `--block-confirmations 1`, `--fee-token-address 0x0000000000000000000000000000000000000000`.

## Verify Result

The `example05` task logs the CCIP message ID and a link to monitor.

**Monitor and execute manually:** https://ccip.chain.link

Expected behavior:

- Message is delivered to a pending/manual execution state because automatic execution is disabled.
- Use the CCIP Explorer to view the message and trigger execution manually when supported.
