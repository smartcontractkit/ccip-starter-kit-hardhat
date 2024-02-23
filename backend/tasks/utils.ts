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