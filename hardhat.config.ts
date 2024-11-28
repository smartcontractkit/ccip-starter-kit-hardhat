import * as dotenvenc from "@chainlink/env-enc";
dotenvenc.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./tasks";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHEREUM_SEPOLIA_RPC_URL = process.env.ETHEREUM_SEPOLIA_RPC_URL;
const OPTIMISM_SEPOLIA_RPC_URL = process.env.OPTIMISM_SEPOLIA_RPC_URL;
const ARBITRUM_SEPOLIA_RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL;
const AVALANCHE_FUJI_RPC_URL = process.env.AVALANCHE_FUJI_RPC_URL;
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const BNB_CHAIN_TESTNET_RPC_URL = process.env.BNB_CHAIN_TESTNET_RPC_URL;
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL;
const KROMA_SEPOLIA_RPC_URL = process.env.KROMA_SEPOLIA_RPC_URL;
const WEMIX_TESTNET_RPC_URL = process.env.WEMIX_TESTNET_RPC_URL;
const GNOSIS_CHIADO_RPC_URL = process.env.GNOSIS_CHIADO_RPC_URL;
const CELO_ALFAJORES_RPC_URL = process.env.CELO_ALFAJORES_RPC_URL;
const METIS_SEPOLIA_RPC_URL = process.env.METIS_SEPOLIA_RPC_URL;
const ZKSYNC_SEPOLIA_RPC_URL = process.env.ZKSYNC_SEPOLIA_RPC_URL;
const SCROLL_SEPOLIA_RPC_URL = process.env.SCROLL_SEPOLIA_RPC_URL;
const ZIRCUIT_SEPOLIA_RPC_URL = process.env.ZIRCUIT_SEPOLIA_RPC_URL;
const XLAYER_SEPOLIA_RPC_URL = process.env.XLAYER_SEPOLIA_RPC_URL;
const POLYGON_ZKEVM_SEPOLIA_RPC_URL = process.env.POLYGON_ZKEVM_SEPOLIA_RPC_URL;
const POLKADOT_ASTAR_SHIBUYA_RPC_URL = process.env.POLKADOT_ASTAR_SHIBUYA_RPC_URL;
const MANTLE_SEPOLIA_RPC_URL = process.env.MANTLE_SEPOLIA_RPC_URL;
const SONEIUM_MINATO_SEPOLIA_RPC_URL = process.env.SONEIUM_MINATO_SEPOLIA_RPC_URL;
const BSQUARED_TESTNET_RPC_URL = process.env.BSQUARED_TESTNET_RPC_URL;
const BOB_SEPOLIA_RPC_URL = process.env.BOB_SEPOLIA_RPC_URL;
const WORLDCHAIN_SEPOLIA_RPC_URL = process.env.WORLDCHAIN_SEPOLIA_RPC_URL;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "paris",
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    ethereumSepolia: {
      url:
        ETHEREUM_SEPOLIA_RPC_URL !== undefined ? ETHEREUM_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    polygonAmoy: {
      url: POLYGON_AMOY_RPC_URL !== undefined ? POLYGON_AMOY_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 80002,
    },
    optimismSepolia: {
      url:
        OPTIMISM_SEPOLIA_RPC_URL !== undefined ? OPTIMISM_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 11155420,
    },
    arbitrumSepolia: {
      url:
        ARBITRUM_SEPOLIA_RPC_URL !== undefined ? ARBITRUM_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 421614,
    },
    avalancheFuji: {
      url: AVALANCHE_FUJI_RPC_URL !== undefined ? AVALANCHE_FUJI_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 43113,
    },
    bnbChainTestnet: {
      url:
        BNB_CHAIN_TESTNET_RPC_URL !== undefined
          ? BNB_CHAIN_TESTNET_RPC_URL
          : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 97,
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL !== undefined ? BASE_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 84532,
    },
    kromaSepolia: {
      url: KROMA_SEPOLIA_RPC_URL !== undefined ? KROMA_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 2358,
    },
    wemixTestnet: {
      url: WEMIX_TESTNET_RPC_URL !== undefined ? WEMIX_TESTNET_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 1112,
    },
    gnosisChiado: {
      url: GNOSIS_CHIADO_RPC_URL !== undefined ? GNOSIS_CHIADO_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 10200,
    },
    celoAlfajores: {
      url: CELO_ALFAJORES_RPC_URL !== undefined ? CELO_ALFAJORES_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 44787,
    },
    metisSepolia: {
      url: METIS_SEPOLIA_RPC_URL !== undefined ? METIS_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 59902,
    },
    zksyncSepolia: {
      url: ZKSYNC_SEPOLIA_RPC_URL !== undefined ? ZKSYNC_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 300,
    },
    scrollSepolia: {
      url: SCROLL_SEPOLIA_RPC_URL !== undefined ? SCROLL_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 534351,
    },
    zircuitSepolia: {
      url: ZIRCUIT_SEPOLIA_RPC_URL !== undefined ? ZIRCUIT_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 48899,
    },
    xlayerSepolia: {
      url: XLAYER_SEPOLIA_RPC_URL !== undefined ? XLAYER_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 195,
    },
    polygonZkevmSepolia: {
      url: POLYGON_ZKEVM_SEPOLIA_RPC_URL !== undefined ? POLYGON_ZKEVM_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 2442,
    },
    polkadotAstarShibuya: {
      url: POLKADOT_ASTAR_SHIBUYA_RPC_URL !== undefined ? POLKADOT_ASTAR_SHIBUYA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 81,
    },
    mantleSepolia: {
      url: MANTLE_SEPOLIA_RPC_URL !== undefined ? MANTLE_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 5003,
    },
    soneiumMinatoSepolia: {
      url: SONEIUM_MINATO_SEPOLIA_RPC_URL !== undefined ? SONEIUM_MINATO_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 1946,
    },
    bsquaredTestnet: {
      url: BSQUARED_TESTNET_RPC_URL !== undefined ? BSQUARED_TESTNET_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 1113,
    },
    bobSepolia: {
      url: BOB_SEPOLIA_RPC_URL !== undefined ? BOB_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 808813,
    },
    worldchainSepolia: {
      url: WORLDCHAIN_SEPOLIA_RPC_URL !== undefined ? WORLDCHAIN_SEPOLIA_RPC_URL : "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 4801,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
