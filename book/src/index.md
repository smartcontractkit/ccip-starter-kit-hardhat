# Overview

This book showcases practical usage of CCIP v2.0 in this Hardhat 3 starter kit.

The goal is not to re-teach CCIP fundamentals. It is to provide runnable example flows you can execute and adapt.

## Before You Run Any Example

> **Important: Complete the 3 steps below before proceeding.
>
> **1. Keystore** — Use a local keystore account for task and script execution:
>
> ```bash
> npx hardhat keystore set SEPOLIA_PRIVATE_KEY
> npx hardhat keystore set FUJI_PRIVATE_KEY
> npx hardhat keystore set SEPOLIA_RPC_URL
> npx hardhat keystore set FUJI_RPC_URL
> ```
>
> The values from your local keystore are used at runtime (e.g. by `hardhat.config.ts` for network accounts and RPC URLs).
>
> **2. Ignition parameters** — Update the JSON parameter files used by Hardhat Ignition for deployment:
>
> - **Ethereum Sepolia:** `ignition/paramsEthSepolia.json`
> - **Avalanche Fuji:** `ignition/paramsFuji.json`
>
> These files supply `$global` values (such as `routerAddress`, `armProxy`, `registryModuleOwnerCustom`, `tokenAdminRegistry`, and for some modules `thresholdAmountForAdditionalCCVs`) to the Ignition modules. 
>
>Each module that deploys pools or receivers reads these parameters when you run `npx hardhat ignition deploy ... --parameters <file>`.
>
>Ensure the addresses in each file match the correct chain (e.g. use the [CCIP Directory](https://docs.chain.link/ccip/directory/) or your deployment context). If you use the wrong file or outdated addresses, deployments will fail or point to the wrong contracts.
>
> **3. Compile** — Generate the build artifacts required for deployment and tasks:
>
> ```bash
> npx hardhat compile
> ```
>
> Run this before deploying or running examples so that contract ABIs and artifacts are available.

## Chain Configuration

Always pull the latest values from the [CCIP Directory](https://docs.chain.link/ccip/directory/) before running examples.
