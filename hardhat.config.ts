import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

import { tasks } from "./tasks/hardhat.tasks.js";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  tasks,
  solidity: {
    npmFilesToBuild: [
      "@chainlink/contracts-ccip/contracts/Router.sol",
      "@chainlink/contracts-ccip/contracts/onRamp/OnRamp.sol",
      "@openzeppelin/contracts-5.3.0/token/ERC20/ERC20.sol",
      "@chainlink/contracts-ccip/contracts/tokens/CrossChainToken.sol",
      "@chainlink/contracts-ccip/contracts/pools/BurnMintTokenPool.sol",
      "@chainlink/contracts-ccip/contracts/pools/AdvancedPoolHooks.sol",
      "@chainlink/contracts-ccip/contracts/tokenAdminRegistry/RegistryModuleOwnerCustom.sol",
      "@chainlink/contracts-ccip/contracts/interfaces/ITokenAdminRegistry.sol",
      "@chainlink/contracts-ccip/contracts/pools/LockReleaseTokenPool.sol",
      "@chainlink/contracts-ccip/contracts/pools/ERC20LockBox.sol",
      "@chainlink/contracts-ccip/contracts/executor/Executor.sol"
    ],
    profiles: {
      default: {
        version: "0.8.26",
      },
      production: {
        version: "0.8.26",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
    fuji: {
      type: "http",
      chainType: "l1",
      url: configVariable("FUJI_RPC_URL"),
      accounts: [configVariable("FUJI_PRIVATE_KEY")],
    }
  },
});
