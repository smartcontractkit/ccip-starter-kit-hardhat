import { Wallet, providers } from "ethers";
import { CCIP_BnM_ADDRESSES, CCIP_LnM_ADDRESSES, PayFeesIn, routerConfig } from "./constants";

export const getProviderRpcUrl = (network: string) => {
    let rpcUrl;

    switch (network) {
        case "ethereumSepolia":
            rpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL;
            break;
        case "optimismGoerli":
            rpcUrl = process.env.OPTIMISM_GOERLI_RPC_URL;
            break;
        case "arbitrumSepolia":
            rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL;
            break;
        case "avalancheFuji":
            rpcUrl = process.env.AVALANCHE_FUJI_RPC_URL;
            break;
        case "polygonMumbai":
            rpcUrl = process.env.POLYGON_MUMBAI_RPC_URL;
            break;
        case "bnbChainTestnet":
            rpcUrl = process.env.BNB_CHAIN_TESTNET_RPC_URL;
            break;
        case "baseGoerli":
            rpcUrl = process.env.BASE_GOERLI_RPC_URL;
            break;
        default:
            throw new Error("Unknown network: " + network);
    }

    if (!rpcUrl)
        throw new Error(
            `rpcUrl empty for network ${network} - check your environment variables`
        );

    return rpcUrl;
};

export const getPrivateKey = () => {
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey)
        throw new Error(
            "private key not provided - check your environment variables"
        );

    return privateKey;
};


export const getRouterConfig = (network: string) => {
    switch (network) {
        case "ethereumSepolia":
            return routerConfig.ethereumSepolia;
        case "optimismGoerli":
            return routerConfig.optimismGoerli;
        case "arbitrumSepolia":
            return routerConfig.arbitrumSepolia;
        case "avalancheFuji":
            return routerConfig.avalancheFuji;
        case "polygonMumbai":
            return routerConfig.polygonMumbai;
        case "bnbChainTestnet":
            return routerConfig.bnbChainTestnet;
        case "baseGoerli":
            return routerConfig.baseGoerli;
        default:
            throw new Error("Unknown network: " + network);
    }
};


export const getPayFeesIn = (payFeesIn: string) => {
    let fees;

    switch (payFeesIn) {
        case "Native":
            fees = PayFeesIn.Native;
            break;
        case "native":
            fees = PayFeesIn.Native;
            break;
        case "LINK":
            fees = PayFeesIn.LINK;
            break;
        case "link":
            fees = PayFeesIn.LINK;
            break;
        default:
            fees = PayFeesIn.Native;
            break;
    }

    return fees;
}

export const getFaucetTokensAddresses = (network: string) => {
    return { ccipBnM: CCIP_BnM_ADDRESSES[network], ccipLnM: CCIP_LnM_ADDRESSES[network] };
}

/**
 * The function `getSignerAndProvider` returns a provider and signer object for a given network using a
 * private key and RPC provider URL.
 * @param {string} network - The `network` parameter is a string that represents the network you want
 * to connect to. It could be the name of a specific blockchain network like "mainnet" or "ropsten", or
 * it could be a custom network configuration.
 * @returns An object is being returned with two properties: "provider" and "signer".
 */
export const getSignerAndProvider = (network: string) => {
    const privateKey = getPrivateKey();
    const rpcProviderUrl = getProviderRpcUrl(network);
    const provider = new providers.JsonRpcProvider(rpcProviderUrl);
    const wallet = new Wallet(privateKey);
    const signer = wallet.connect(provider);
    return {
        provider,
        signer
    };
}

/**
 * The function `getSigner` returns the signer from the `getSignerAndProvider` function based on the
 * provided network.
 * @param {string} network - The `network` parameter is a string that represents the network on which
 * the signer will be used. It could be the name or identifier of a specific blockchain network, such
 * as "mainnet", "ropsten", "rinkeby", etc.
 * @returns The `signer` object is being returned.
 */
export const getSigner = (network: string) => {
    const { signer } = getSignerAndProvider(network);
    return signer;
}

/**
 * The function `getProvider` returns the provider from the `getSignerAndProvider` function based on
 * the specified network.
 * @param {string} network - The `network` parameter is a string that represents the network on which
 * the provider is being used. It could be the name of a blockchain network such as "mainnet",
 * "ropsten", "rinkeby", etc.
 * @returns The provider object is being returned.
 */
export const getProvider = (network: string) => {
    const { provider } = getSignerAndProvider(network);
    return provider;
}