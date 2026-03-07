# Chainlink CCIP Starter Kit V2 (Hardhat 3)

> **Note**
>
> _This repository represents an example of using a Chainlink product or service. It is provided to help you understand how to interact with Chainlink's systems so that you can integrate them into your own. This template is provided "AS IS" without warranties of any kind, has not been audited, and may be missing key checks or error handling to make the usage of the product more clear. Take everything in this repository as an example and not something to be copy pasted into a production ready service._

Reference starter kit for learning and testing **CCIP v2** with Hardhat 3: tasks, Ignition deployments, Solidity contracts, and SDK examples.

## Start Here

The primary documentation lives in the book. Run it locally:

```bash
mdbook serve book --open
```

## Repo Scope

- **`tasks/`** — Hardhat tasks for CCIP examples (e.g. `example01`, `example02`, `faucet`) and helpers (e.g. `erc20-balance-of`, `get-allow-list`). Task definitions are in `tasks/hardhat.tasks.ts`.
- **`ignition/`** — Hardhat Ignition modules and parameter files for deploying receivers, senders, and token pools. Fill in `ignition/paramsEthSepolia.json` and `ignition/paramsFuji.json` with chain addresses before deploying.
- **`contracts/`** — Solidity contracts used by the examples.
- **`book/src/`** — Step-by-step tutorial chapters (mdbook source).
- **`sdk-examples/`** — Minimal CCIP SDK demos (`ccip-send`, `ccip-track`).

## Minimal Setup

1. **Keystore** — Set private keys and RPC URLs for the networks you use:

   ```bash
   npx hardhat keystore set SEPOLIA_PRIVATE_KEY
   npx hardhat keystore set FUJI_PRIVATE_KEY
   npx hardhat keystore set SEPOLIA_RPC_URL
   npx hardhat keystore set FUJI_RPC_URL
   ```

2. **Ignition parameters** — Edit `ignition/paramsEthSepolia.json` and `ignition/paramsFuji.json`: replace the placeholder values (`<ROUTER_ADDRESS>`, etc.) with the correct addresses for each chain (e.g. from the [CCIP Directory](https://docs.chain.link/ccip/directory/)).

3. **Run examples** — Follow the book chapters. Example:

   ```bash
   npx hardhat faucet --network <NETWORK_NAME> --ccip-bnm <CCIP_BNM_TOKEN_ADDRESS>
   npx hardhat example01 --network <NETWORK_NAME> --source-router <ROUTER> --destination-chain-selector <SELECTOR> --receiver <RECEIVER> --token-to-send <TOKEN> --amount <AMOUNT>
   ```

List all tasks:

```bash
npx hardhat --help
```
