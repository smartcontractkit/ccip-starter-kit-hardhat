# Example 02: Hello World to BasicMessageReceiverWithCCVs (Faster Than Finality)

This example deploys a destination `BasicMessageReceiverWithCCVs` contract and sends a Hello World data message from an EOA using Faster Than Finality (`blockConfirmations > 0`).

Tasks and modules used:

- **Deploy receiver:** Hardhat Ignition module `ignition/modules/BasicMessageReceiverWithCCVs.ts` (deploy on destination chain).
- **Configure min block depth:** Hardhat task `set-basic-message-receiver-with-ccvs-min-block-depth` (implementation: `tasks/helpers/SetBasicMessageReceiverWithCCVsMinBlockDepth.ts`).
- **Send message:** Hardhat task `example02` (implementation: `tasks/Example02.ts`).
- **Read latest message:** Hardhat task `basic-message-receiver-latest-message` (implementation: `tasks/helpers/BasicMessageReceiverLatestMessage.ts`).

## What You Will Do

1. Deploy `BasicMessageReceiverWithCCVs` on the destination chain using Ignition.
2. Configure minimum block depth for the source chain.
3. Send a Hello World CCIP data message from the source chain to `BasicMessageReceiverWithCCVs` using the `example02` task.
4. (Optional) Verify the received message with the `basic-message-receiver-latest-message` task.

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

## Receiver Contract Context

### Pre-v2.0

To receive CCIP messages (data or data+tokens), contracts implemented `IAny2EVMMessageReceiver`:

```ts
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Client} from "../libraries/Client.sol";

interface IAny2EVMMessageReceiver {
  function ccipReceive(
    Client.Any2EVMMessage calldata message
  ) external;
}
```

As a convenience, applications generally inherited `CCIPReceiver.sol` and implemented `_ccipReceive`.

### CCIP v2.0

In v2.0, receivers expose Cross Chain Verifiers and finality requirements via `getCCVsAndMinBlockDepth`:

```ts
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Client} from "../libraries/Client.sol";

interface IAny2EVMMessageReceiverV2 {
  function ccipReceive(
    Client.Any2EVMMessage calldata message
  ) external;

 function getCCVsAndMinBlockDepth(
    uint64 sourceChainSelector,
    bytes calldata sender
  )
    external
    view
    returns (
      address[] memory requiredCCVs,
      address[] memory optionalCCVs,
      uint8 optionalThreshold,
      uint16 minBlockDepth
    );
}
```

The receiver controls two independent dimensions:

- `requiredCCVs` and `optionalCCVs` define additional verifiers required for acceptance.
- `minBlockDepth` defines minimum block depth for Faster Than Finality execution.
- `minBlockDepth = 0` means default finality is required.

You can combine these independently:

- Add additional verifiers while keeping `minBlockDepth = 0`.
- Use default verifiers only, while setting `minBlockDepth > 0`.

In this starter kit, `contracts/BasicMessageReceiverWithCCVs.sol` adds configurable verifier sets and configurable minimum block depth.

## Step 1: Deploy `BasicMessageReceiverWithCCVs` on Destination Chain

Deploy the receiver on the **destination** chain using Hardhat Ignition.

```bash
npx hardhat ignition deploy ignition/modules/BasicMessageReceiverWithCCVs.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

`--parameters` must be the path to the chain's Ignition parameters JSON (e.g. `ignition/paramsFuji.json` or `ignition/paramsEthSepolia.json`). That file supplies router and other addresses to the module.

Save the deployed address as `<BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS>`.

By default, this receiver starts with `minBlockDepth = 0` (default finality only) for all source chains until you configure it.

## Step 2: Configure Minimum Block Depth for Your Source Chain

On the **destination** chain, run:

```bash
npx hardhat set-basic-message-receiver-with-ccvs-min-block-depth --network <NETWORK_NAME> \
  --receiver <BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS> \
  --source-chain-selector <SOURCE_CHAIN_SELECTOR> \
  --min-block-depth <MIN_BLOCK_DEPTH>
```

For this chapter, use `<MIN_BLOCK_DEPTH> = 1`.

- `0` means default finality-only behavior for that source chain.
- `> 0` enables Faster Than Finality with that minimum depth.

## Step 3: Send Hello World Data Message from EOA

From the **source** chain, run the `example02` task. Pass the deployed receiver address as `--receiver` and your message as `--message-text`.

```bash
npx hardhat example02 --network <NETWORK_NAME> \
  --source-router <SOURCE_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS> \
  --message-text "Hello, World" \
  --gas-limit <GAS_LIMIT> \
  --block-confirmations <BLOCK_CONFIRMATIONS_GT_ZERO> \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--gas-limit` must be `> 0` because the destination receiver callback needs gas (e.g. `200000`).
- `--block-confirmations` must be `> 0` for Faster Than Finality.
- `--block-confirmations` should be greater than or equal to `<MIN_BLOCK_DEPTH>`.
- Executor may enforce a minimum block confirmations value and revert if too low.
- If requested confirmations exceed chain finality, default finality is used.
- `--fee-token-address`: LINK token address on the source chain to pay fees in LINK, or `0x0000000000000000000000000000000000000000` to pay in native coin.

Defaults (can be omitted): `--gas-limit 200000`, `--block-confirmations 1`, `--fee-token-address 0x0000000000000000000000000000000000000000`.

## Verify Result

The `example02` task logs the CCIP message ID and a link to monitor.

**Monitor message status:** https://ccip.chain.link

**Read the latest message on the receiver** (destination chain). The task decodes the stored bytes as the string that was sent:

```bash
npx hardhat basic-message-receiver-latest-message --network <NETWORK_NAME> --basic-message-receiver <BASIC_MESSAGE_RECEIVER_WITH_CCVS_ADDRESS>
```

Output is the decoded string (e.g. `Hello, World`). If no message has been received yet, the task prints `(empty)`.
