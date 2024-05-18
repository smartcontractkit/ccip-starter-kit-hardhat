import { CCIP_BnM_ADDRESSES, CCIP_LnM_ADDRESSES, PayFeesIn, routerConfig } from "./constants";

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