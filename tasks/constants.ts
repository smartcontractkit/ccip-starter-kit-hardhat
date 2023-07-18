
export type AddressMap = { [blockchain: string]: string };
export type TokenAmounts = { token: string, amount: string }

export enum PayFeesIn {
    Native,
    LINK
}

export const MAX_TOKENS_LENGTH = 5;

export const supportedNetworks = [
    `ethereumSepolia`,
    `optimismGoerli`,
    `arbitrumTestnet`,
    `avalancheFuji`,
    `polygonMumbai`,
];

export const LINK_ADDRESSES: AddressMap = {
    [`ethereumSepolia`]: `0x779877A7B0D9E8603169DdbD7836e478b4624789`,
    [`polygonMumbai`]: `0x326C977E6efc84E512bB9C30f76E30c160eD06FB`,
    [`optimismGoerli`]: `0xdc2CC710e42857672E7907CF474a69B63B93089f`,
    [`arbitrumTestnet`]: `0xd14838A68E8AFBAdE5efb411d5871ea0011AFd28`,
    [`avalancheFuji`]: `0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846`
};

export const CCIP_BnM_ADDRESSES: AddressMap = {
    [`ethereumSepolia`]: `0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05`,
    [`polygonMumbai`]: `0xf1E3A5842EeEF51F2967b3F05D45DD4f4205FF40`,
    [`optimismGoerli`]: `0xaBfE9D11A2f1D61990D1d253EC98B5Da00304F16`,
    [`arbitrumTestnet`]: `0x0579b4c1C8AcbfF13c6253f1B10d66896Bf399Ef`,
    [`avalancheFuji`]: `0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4`
}

export const CCIP_LnM_ADDRESSES: AddressMap = {
    [`ethereumSepolia`]: `0x466D489b6d36E7E3b824ef491C225F5830E81cC1`,
    [`polygonMumbai`]: `0xc1c76a8c5bFDE1Be034bbcD930c668726E7C1987`,
    [`optimismGoerli`]: `0x835833d556299CdEC623e7980e7369145b037591`,
    [`arbitrumTestnet`]: `0x0E14dBe2c8e1121902208be173A3fb91Bb125CDB`,
    [`avalancheFuji`]: `0x70F5c5C40b873EA597776DA2C21929A8282A3b35`
}

export const routerConfig = {
    ethereumSepolia: {
        address: `0xd0daae2231e9cb96b94c8512223533293c3693bf`,
        chainSelector: `16015286601757825753`,
        feeTokens: [LINK_ADDRESSES[`ethereumSepolia`], `0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534`]
    },
    optimismGoerli: {
        address: `0xeb52e9ae4a9fb37172978642d4c141ef53876f26`,
        chainSelector: `2664363617261496610`,
        feeTokens: [LINK_ADDRESSES[`optimismGoerli`], `0x4200000000000000000000000000000000000006`]
    },
    avalancheFuji: {
        address: `0x554472a2720e5e7d5d3c817529aba05eed5f82d8`,
        chainSelector: `14767482510784806043`,
        feeTokens: [LINK_ADDRESSES[`avalancheFuji`], `0xd00ae08403B9bbb9124bB305C09058E32C39A48c`]
    },
    arbitrumTestnet: {
        address: `0x88e492127709447a5abefdab8788a15b4567589e`,
        chainSelector: `6101244977088475029`,
        feeTokens: [LINK_ADDRESSES[`arbitrumTestnet`], `0x32d5D5978905d9c6c2D4C417F0E06Fe768a4FB5a`]
    },
    polygonMumbai: {
        address: `0x70499c328e1e2a3c41108bd3730f6670a44595d1`,
        chainSelector: `12532609583862916517`,
        feeTokens: [LINK_ADDRESSES[`polygonMumbai`], `0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889`]
    }
}