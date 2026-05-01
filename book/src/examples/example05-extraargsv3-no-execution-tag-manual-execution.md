# Example 05: ExtraArgsV3 No-Execution-Tag (Manual Execution Path)

This example sends a Hello World data message from an EOA, but disables automatic execution by setting `executor` to `NO_EXECUTION_ADDRESS` inside `ExtraArgsV3`.

Task: `example05` (implementation: `tasks/Example05.ts`).

## What You Will Do

1. Ensure a compatible destination receiver exists (default finality or Faster Than Finality based on your `blockConfirmations`).
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
> Choose deployment based on your `blockConfirmations`:
>
> ```bash
> npx hardhat ignition deploy ignition/modules/BasicMessageReceiver.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
> ```
>
> Use this for default finality (`blockConfirmations = 0`). Save this as `<BASIC_MESSAGE_RECEIVER_ADDRESS>`.
>
> ```bash
> npx hardhat ignition deploy ignition/modules/BasicMessageReceiverWithCCVs.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
> ```
>
> If you use Faster Than Finality (`blockConfirmations > 0`), configure min block depth for your source chain:
>
> ```bash
> npx hardhat set-basic-message-receiver-with-ccvs-min-block-depth --network <NETWORK_NAME> \
>   --receiver <BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS> \
>   --source-chain-selector <SOURCE_CHAIN_SELECTOR> \
>   --min-block-depth <MIN_BLOCK_DEPTH>
> ```
>
> Use `<MIN_BLOCK_DEPTH> > 0` for Faster Than Finality.
>
> Use this for Faster Than Finality (`blockConfirmations > 0`). Save this as `<BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS>`.
>
> `--parameters` is the path to the chain's Ignition parameters JSON; it supplies router and other addresses to the module.

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
- `encodeAllowedFinalityBlockDepthAndSafeFlag(blockDepth)` calls `EncodeExtraArgsOffchain.encodeAllowedFinalityBlockDepthAndSafeFlag`, which wraps `FinalityCodec._encodeBlockDepthAndSafeFlag` — for **allowed** finality (`bytes4`) on pools/receivers/policy, **not** for sender ExtraArgs `requestedFinalityConfig`.
- `getNoExecutionAddress()` returns `Client.NO_EXECUTION_ADDRESS` for the manual execution path.

The `example05` task uses these to build ExtraArgsV3 with the no-execution tag.

## Step 1: Send Message With No-Execution-Tag

Run the `example05` task. It sends a data-only message with executor set to `NO_EXECUTION_ADDRESS`, so execution stays pending until triggered manually.

```bash
npx hardhat example05 --network <NETWORK_NAME> \
  --source-router <SOURCE_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <BASIC_MESSAGE_RECEIVER_ADDRESS_OR_BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS> \
  --message-text "Hello, World" \
  --gas-limit <GAS_LIMIT> \
  --block-confirmations <BLOCK_CONFIRMATIONS> \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--gas-limit` must be `> 0` because the receiver callback needs gas (e.g. `200000`).
- `--block-confirmations` can be `0` (default finality) or `> 0`.
- If `<BLOCK_CONFIRMATIONS> > 0`, destination receiver must accept Faster Than Finality (`minBlockDepth > 0`) for this source chain.
- If `<BLOCK_CONFIRMATIONS> = 0`, a default-finality receiver is sufficient.
- `--fee-token-address`: LINK token address on the source chain to pay fees in LINK, or `0x0000000000000000000000000000000000000000` to pay in native coin.
- This example sets executor to `NO_EXECUTION_ADDRESS`, so execution is not automatic; the message remains in a pending/manual execution state.

Defaults (can be omitted): `--gas-limit 200000`, `--block-confirmations 1`, `--fee-token-address 0x0000000000000000000000000000000000000000`.

## Verify Result

The `example05` task logs the CCIP message ID and a link to monitor.

**Monitor and execute manually:** https://ccip.chain.link

Expected behavior:

- Message is delivered to a pending/manual execution state because automatic execution is disabled.
- Use the CCIP Explorer to view the message and trigger execution manually when supported.
