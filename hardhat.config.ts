import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

import { tasks } from "./tasks/hardhat.tasks.js";

export default defineConfig({
  // hardhat-ethers is only needed by the Chainlink Local fork helpers used in test/fork.
  plugins: [hardhatToolboxViemPlugin, hardhatEthersPlugin],
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
      "@chainlink/contracts-ccip/contracts/executor/Executor.sol",
      "@chainlink/local/src/ccip/CCIPLocalSimulator.sol",
      "@chainlink/local/src/ccip/CCIPLocalRouter.sol",
      "@chainlink/local/src/ccip/BurnMintERC677Helper.sol",
      "@chainlink/local/src/shared/LinkToken.sol"
    ],
    profiles: {
      default: {
        version: "0.8.26",
        settings: {
          evmVersion: "cancun",
        },
      },
      production: {
        version: "0.8.26",
        settings: {
          evmVersion: "cancun",
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
    amoy: {
      type: "http",
      chainType: "l1",
      url: configVariable("AMOY_RPC_URL"),
      accounts: [configVariable("AMOY_PRIVATE_KEY")],
    },
    // Forks of the live testnets, used by test/fork. The blocks are pinned so a fresh clone runs the same chain state;
    // override them per run with ETHEREUM_SEPOLIA_FORK_BLOCK / POLYGON_AMOY_FORK_BLOCK (see AGENTS.md "Re-pinning").
    sepoliaFork: {
      type: "edr-simulated",
      chainType: "generic",
      chainId: 11155111,
      forking: {
        url: configVariable("ETHEREUM_SEPOLIA_RPC_URL"),
        blockNumber: Number(process.env.ETHEREUM_SEPOLIA_FORK_BLOCK ?? 11_920_292),
      },
    },
    amoyFork: {
      type: "edr-simulated",
      chainType: "generic",
      chainId: 80002,
      forking: {
        url: configVariable("POLYGON_AMOY_RPC_URL"),
        blockNumber: Number(process.env.POLYGON_AMOY_FORK_BLOCK ?? 50_243_111),
      },
    },
    fuji: {
      type: "http",
      chainType: "l1",
      url: configVariable("FUJI_RPC_URL"),
      accounts: [configVariable("FUJI_PRIVATE_KEY")],
    }
  },
});
