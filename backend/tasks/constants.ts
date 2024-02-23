
export type AddressMap = { [blockchain: string]: string };
export type TokenAmounts = { token: string, amount: string }

export enum PayFeesIn {
    Native,
    LINK
}

export const supportedNetworks = [
    `ethereumSepolia`,
    `optimismGoerli`,
    `arbitrumSepolia`,
    `avalancheFuji`,
    `polygonMumbai`,
    `bnbChainTestnet`,
    `baseGoerli`
];

export const LINK_ADDRESSES: AddressMap = {
    [`ethereumSepolia`]: `0x779877A7B0D9E8603169DdbD7836e478b4624789`,
    [`polygonMumbai`]: `0x326C977E6efc84E512bB9C30f76E30c160eD06FB`,
    [`optimismGoerli`]: `0xdc2CC710e42857672E7907CF474a69B63B93089f`,
    [`arbitrumSepolia`]: `0xb1D4538B4571d411F07960EF2838Ce337FE1E80E`,
    [`avalancheFuji`]: `0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846`,
    [`bnbChainTestnet`]: `0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06`,
    [`baseGoerli`]: `0xD886E2286Fd1073df82462ea1822119600Af80b6`
};

export const CCIP_BnM_ADDRESSES: AddressMap = {
    [`ethereumSepolia`]: `0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05`,
    [`polygonMumbai`]: `0xf1E3A5842EeEF51F2967b3F05D45DD4f4205FF40`,
    [`optimismGoerli`]: `0xaBfE9D11A2f1D61990D1d253EC98B5Da00304F16`,
    [`arbitrumSepolia`]: `0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D`,
    [`avalancheFuji`]: `0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4`,
    [`bnbChainTestnet`]: `0xbFA2ACd33ED6EEc0ed3Cc06bF1ac38d22b36B9e9`,
    [`baseGoerli`]: `0xbf9036529123DE264bFA0FC7362fE25B650D4B16`
}

export const CCIP_LnM_ADDRESSES: AddressMap = {
    [`ethereumSepolia`]: `0x466D489b6d36E7E3b824ef491C225F5830E81cC1`,
    [`polygonMumbai`]: `0xc1c76a8c5bFDE1Be034bbcD930c668726E7C1987`,
    [`optimismGoerli`]: `0x835833d556299CdEC623e7980e7369145b037591`,
    [`arbitrumSepolia`]: `0x139E99f0ab4084E14e6bb7DacA289a91a2d92927`,
    [`avalancheFuji`]: `0x70F5c5C40b873EA597776DA2C21929A8282A3b35`,
    [`bnbChainTestnet`]: `0x79a4Fc27f69323660f5Bfc12dEe21c3cC14f5901`,
    [`baseGoerli`]: `0x73ed16c1a61b098fd6924CCE5cC6a9A30348D944`
}

export const USDC_ADDRESSES: AddressMap = {
    [`polygonMumbai`]: `0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97`,
    [`optimismGoerli`]: `0xe05606174bac4A6364B31bd0eCA4bf4dD368f8C6`,
    [`avalancheFuji`]: `0x5425890298aed601595a70AB815c96711a31Bc65`,
    [`baseGoerli`]: `0xF175520C52418dfE19C8098071a252da48Cd1C19`
}

export const routerConfig = {
    ethereumSepolia: {
        address: `0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`,
        chainSelector: `16015286601757825753`,
        feeTokens: [LINK_ADDRESSES[`ethereumSepolia`], `0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534`]
    },
    optimismGoerli: {
        address: `0xcc5a0B910D9E9504A7561934bed294c51285a78D`,
        chainSelector: `2664363617261496610`,
        feeTokens: [LINK_ADDRESSES[`optimismGoerli`], `0x4200000000000000000000000000000000000006`]
    },
    avalancheFuji: {
        address: `0xF694E193200268f9a4868e4Aa017A0118C9a8177`,
        chainSelector: `14767482510784806043`,
        feeTokens: [LINK_ADDRESSES[`avalancheFuji`], `0xd00ae08403B9bbb9124bB305C09058E32C39A48c`]
    },
    arbitrumSepolia: {
        address: `0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165`,
        chainSelector: `3478487238524512106`,
        feeTokens: [LINK_ADDRESSES[`arbitrumSepolia`], `0xE591bf0A0CF924A0674d7792db046B23CEbF5f34`]
    },
    polygonMumbai: {
        address: `0x1035CabC275068e0F4b745A29CEDf38E13aF41b1`,
        chainSelector: `12532609583862916517`,
        feeTokens: [LINK_ADDRESSES[`polygonMumbai`], `0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889`]
    },
    bnbChainTestnet: {
        address: `0xE1053aE1857476f36A3C62580FF9b016E8EE8F6f`,
        chainSelector: `13264668187771770619`,
        feeTokens: [LINK_ADDRESSES[`bnbChainTestnet`], `0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd`]
    },
    baseGoerli: {
        address: `0x80AF2F44ed0469018922c9F483dc5A909862fdc2`,
        chainSelector: `5790810961207155433`,
        feeTokens: [LINK_ADDRESSES[`baseGoerli`], `0x4200000000000000000000000000000000000006`]
    }
}