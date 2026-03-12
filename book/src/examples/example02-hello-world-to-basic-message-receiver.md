# Example 02: Hello World to BasicMessageReceiver (Faster Than Finality)

This example deploys a destination receiver contract and sends a Hello World data message to it from an EOA using Faster Than Finality (`blockConfirmations > 0`).

Tasks and modules used:

- **Deploy receiver:** Hardhat Ignition module `ignition/modules/BasicMessageReceiver.ts` (deploy on destination chain).
- **Send message:** Hardhat task `example02` (implementation: `tasks/Example02.ts`).
- **Read latest message:** Hardhat task `basic-message-receiver-latest-message` (implementation: `tasks/helpers/BasicMessageReceiverLatestMessage.ts`).

## What You Will Do

1. Deploy `BasicMessageReceiver` on the destination chain using Ignition.
2. Send a Hello World CCIP data message from source chain to the deployed receiver using the `example02` task.
3. (Optional) Verify the received message with the `basic-message-receiver-latest-message` task.

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

In v2.0, receivers expose CCV and finality requirements via `getCCVsAndMinBlockDepth`:

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

`minBlockDepth = 0` means finality is required. Any non-zero value allows Faster Than Finality messages with sufficient block depth.

In this starter kit:

- `contracts/BasicMessageReceiver.sol` is the baseline receiver flow used in this example.
- `contracts/BasicMessageReceiverWithCCVs.sol` extends it with configurable `getCCVsAndMinBlockDepth` behavior for Modular Trust Layer examples.

## Step 1: Deploy `BasicMessageReceiver` on Destination Chain

Deploy the receiver on the **destination** chain using Hardhat Ignition.

```bash
npx hardhat ignition deploy ignition/modules/BasicMessageReceiver.ts --network <NETWORK_NAME> --parameters <PARAMETERS_FILE>
```

`--parameters` must be the path to the chain's Ignition parameters JSON (e.g. `ignition/paramsFuji.json` or `ignition/paramsEthSepolia.json`). That file supplies router and other addresses to the module.

Save the deployed receiver address from the deployment output (e.g. from `deployed_addresses.json` or the console).

## Step 2: Send Hello World Data Message from EOA

From the **source** chain, run the `example02` task. Pass the deployed receiver address as `--receiver` and your message as `--message-text`.

```bash
npx hardhat example02 --network <NETWORK_NAME> \
  --source-router <SOURCE_ROUTER> \
  --destination-chain-selector <DESTINATION_CHAIN_SELECTOR> \
  --receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS> \
  --message-text "Hello, World" \
  --gas-limit <GAS_LIMIT> \
  --block-confirmations <BLOCK_CONFIRMATIONS_GT_ZERO> \
  --fee-token-address <FEE_TOKEN_ADDRESS>
```

Parameter notes:

- `--gas-limit` must be `> 0` because the destination receiver contract callback needs gas (e.g. `200000`).
- `--block-confirmations` must be `> 0` for Faster Than Finality.
- Executor may enforce a minimum block confirmations value and revert if too low.
- If requested confirmations exceed chain finality, default finality is used.
- `--fee-token-address`: LINK token address on the source chain to pay fees in LINK, or `0x0000000000000000000000000000000000000000` to pay in native coin.

Defaults (can be omitted): `--gas-limit 200000`, `--block-confirmations 1`, `--fee-token-address 0x0000000000000000000000000000000000000000`.

## Verify Result

The `example02` task logs the CCIP message ID and a link to monitor.

**Monitor message status:** https://ccip.chain.link

**Read the latest message on the receiver** (destination chain). The task decodes the stored bytes as the string that was sent:

```bash
npx hardhat basic-message-receiver-latest-message --network <NETWORK_NAME> --basic-message-receiver <DEPLOYED_BASIC_MESSAGE_RECEIVER_ADDRESS>
```
Output is the decoded string (e.g. `Hello, World`). If no message has been received yet, the task prints `(empty)`.
