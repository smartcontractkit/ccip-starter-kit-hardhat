# Chainlink CCIP Starter Kit V2 (Hardhat 3)

> **Note**
>
> _This repository represents an example of using a Chainlink product or service. It is provided to help you understand how to interact with Chainlink's systems so that you can integrate them into your own. This template is provided "AS IS" without warranties of any kind, has not been audited, and may be missing key checks or error handling to make the usage of the product more clear. Take everything in this repository as an example and not something to be copy pasted into a production ready service._

Disclaimer: Please note, this repo contains community examples only  — these are not Chainlink products or services and are not supported or maintained by Chainlink. This code represents an example of using a Chainlink product or service, and is intended for demonstration and educational purposes only. It is provided “AS IS” and “AS AVAILABLE” without warranties of any kind, may not have been audited, and may omit checks or error handling. Each party intending to use this example code does so entirely at their own risk and must perform its own audits, security and code review, key management, and testing before any production deployment and ensure the operation and performance of such code matches expectations. Neither Chainlink Labs nor the Chainlink Foundation deploys, operates, monitors, maintains or endorses any deployment of this code. Note that this is not a Chainlink product, feature or service, and there are no commitments made with respect to the code, including compatibility with future Chainlink releases. You should not rely on this code without first conducting your own technical, engineering, and security review. This code is also outside the scope of any Chainlink bug bounty programs. Neither Chainlink Labs, the Chainlink Foundation, nor Chainlink node operators are responsible for outcomes due to errors in this example or how it is deployed or operated, or liable for any resulting claims or damages. Use of the Chainlink Network is subject to the Chainlink Foundation [Terms of Service](https://chain.link/terms), which provides important information and disclosures. By using this code, you acknowledge and agree to these terms.

Reference starter kit for learning and testing **CCIP v2** with Hardhat 3: tasks, Ignition deployments, Solidity contracts, and SDK examples.

Examples 01–08 use Ethereum Sepolia → Polygon Amoy as their primary CCIP 2.0 lane.
[Example 01](book/src/examples/example01-token-transfer-faster-than-finality.md), Example 03, and
Example 04 use faucet-issued CCIP-BnM.
[Examples 06–08](book/src/examples/example06-cct01-burnmint-token-and-pool-setup.md) teach custom
token and pool deployment. The legacy chapters retain their older-lane demonstrations.

## Start Here

The primary documentation lives in the book. Run it locally:

```bash
mdbook serve book --open
```

## Repo Scope

- **`tasks/`** — Hardhat tasks for CCIP examples (e.g. `example01`, `example02`, `faucet`) and helpers (e.g. `erc20-balance-of`, `get-allow-list`). Task definitions are in `tasks/hardhat.tasks.ts`.
- **`ignition/`** — Hardhat Ignition modules and parameter files for deploying receivers, senders, and token pools. Fill in `ignition/paramsEthSepolia.json` and `ignition/paramsAmoy.json` with chain addresses before deploying.
- **`contracts/`** — Solidity contracts used by the examples.
- **`book/src/`** — Step-by-step tutorial chapters (mdbook source).
- **`sdk-examples/`** — Minimal CCIP SDK demos (`ccip-send`, `ccip-track`).

## Minimal Setup

1. **Keystore** — Set private keys and RPC URLs for the networks you use:

   ```bash
   npx hardhat keystore set SEPOLIA_PRIVATE_KEY
   npx hardhat keystore set AMOY_PRIVATE_KEY
   npx hardhat keystore set SEPOLIA_RPC_URL
   npx hardhat keystore set AMOY_RPC_URL
   ```

2. **Ignition parameters** — Edit `ignition/paramsEthSepolia.json` and `ignition/paramsAmoy.json`: replace the placeholder values (`<ROUTER_ADDRESS>`, etc.) with the correct addresses for each chain (e.g. from the [CCIP Directory](https://docs.chain.link/ccip/directory/)).

3. **Run examples** — Start with the faucet and [Example 01](book/src/examples/example01-token-transfer-faster-than-finality.md). Use [Example 06](book/src/examples/example06-cct01-burnmint-token-and-pool-setup.md) when you want to deploy your own CCT. The `faucet` task also serves the legacy token examples.

List all tasks:

```bash
npx hardhat --help
```
