
export type AddressMap = { [blockchain: string]: string };
export type TokenAmounts = { token: string, amount: string }

export enum PayFeesIn {
    Native,
    LINK
}

export const supportedNetworks = [
    `ethereumSepolia`,
    `polygonAmoy`,
    `optimismSepolia`,
    `arbitrumSepolia`,
    `avalancheFuji`,
    `bnbChainTestnet`,
    `baseSepolia`,
    `kromaSepolia`,
    `wemixTestnet`,
    `gnosisChiado`,
    `celoAlfajores`,
    `metisSepolia`,
    `zksyncSepolia`
];

export const LINK_ADDRESSES: AddressMap = {
    [`ethereumSepolia`]: `0x779877A7B0D9E8603169DdbD7836e478b4624789`,
    [`polygonAmoy`]: `0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904`,
    [`optimismSepolia`]: `0xE4aB69C077896252FAFBD49EFD26B5D171A32410`,
    [`arbitrumSepolia`]: `0xb1D4538B4571d411F07960EF2838Ce337FE1E80E`,
    [`avalancheFuji`]: `0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846`,
    [`bnbChainTestnet`]: `0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06`,
    [`baseSepolia`]: `0xE4aB69C077896252FAFBD49EFD26B5D171A32410`,
    [`kromaSepolia`]: `0xa75cCA5b404ec6F4BB6EC4853D177FE7057085c8`,
    [`wemixTestnet`]: `0x3580c7A817cCD41f7e02143BFa411D4EeAE78093`,
    [`gnosisChiado`]: `0xDCA67FD8324990792C0bfaE95903B8A64097754F`,
    [`celoAlfajores`]: `0x32E08557B14FaD8908025619797221281D439071`,
    [`metisSepolia`]: `0x9870D6a0e05F867EAAe696e106741843F7fD116D`,
    [`zksyncSepolia`]: `0x23A1aFD896c8c8876AF46aDc38521f4432658d1e`
};

export const CCIP_BnM_ADDRESSES: AddressMap = {
    [`ethereumSepolia`]: `0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05`,
    [`polygonAmoy`]: `0xcab0EF91Bee323d1A617c0a027eE753aFd6997E4`,
    [`optimismSepolia`]: `0x8aF4204e30565DF93352fE8E1De78925F6664dA7`,
    [`arbitrumSepolia`]: `0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D`,
    [`avalancheFuji`]: `0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4`,
    [`bnbChainTestnet`]: `0xbFA2ACd33ED6EEc0ed3Cc06bF1ac38d22b36B9e9`,
    [`baseSepolia`]: `0x88A2d74F47a237a62e7A51cdDa67270CE381555e`,
    [`kromaSepolia`]: `0x6AC3e353D1DDda24d5A5416024d6E436b8817A4e`,
    [`wemixTestnet`]: `0xF4E4057FbBc86915F4b2d63EEFFe641C03294ffc`,
    [`gnosisChiado`]: `0xA189971a2c5AcA0DFC5Ee7a2C44a2Ae27b3CF389`,
    [`celoAlfajores`]: `0x7e503dd1dAF90117A1b79953321043d9E6815C72`,
    [`metisSepolia`]: `0x20Aa09AAb761e2E600d65c6929A9fd1E59821D3f`
}

export const CCIP_LnM_ADDRESSES: AddressMap = {
    [`ethereumSepolia`]: `0x466D489b6d36E7E3b824ef491C225F5830E81cC1`,
    [`polygonAmoy`]: `0x3d357fb52253e86c8Ee0f80F5FfE438fD9503FF2`,
    [`optimismSepolia`]: `0x044a6B4b561af69D2319A2f4be5Ec327a6975D0a`,
    [`arbitrumSepolia`]: `0x139E99f0ab4084E14e6bb7DacA289a91a2d92927`,
    [`avalancheFuji`]: `0x70F5c5C40b873EA597776DA2C21929A8282A3b35`,
    [`bnbChainTestnet`]: `0x79a4Fc27f69323660f5Bfc12dEe21c3cC14f5901`,
    [`baseSepolia`]: `0xA98FA8A008371b9408195e52734b1768c0d1Cb5c`,
    [`kromaSepolia`]: `0x835fcBB6770E1246CfCf52F83cDcec3177d0bb6b`,
    [`wemixTestnet`]: `0xcb342aE3D65E3fEDF8F912B0432e2B8F88514d5D`,
    [`gnosisChiado`]: `0x30DeCD269277b8094c00B0bacC3aCaF3fF4Da7fB`,
    [`celoAlfajores`]: `0x7F4e739D40E58BBd59dAD388171d18e37B26326f`,
    [`metisSepolia`]: `0x705b364CadE0e515577F2646529e3A417473a155`,
}

export const USDC_ADDRESSES: AddressMap = {
    [`polygonAmoy`]: `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`,
    [`optimismSepolia`]: `0x5fd84259d66Cd46123540766Be93DFE6D43130D7`,
    [`avalancheFuji`]: `0x5425890298aed601595a70AB815c96711a31Bc65`,
    [`baseSepolia`]: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
}

export const routerConfig = {
    ethereumSepolia: {
        address: `0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`,
        chainSelector: `16015286601757825753`,
        feeTokens: [LINK_ADDRESSES[`ethereumSepolia`], `0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534`]
    },
    polygonAmoy: {
        address: `0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2`,
        chainSelector: `16281711391670634445`,
        feeTokens: [LINK_ADDRESSES[`polygonAmoy`], `0x360ad4f9a9A8EFe9A8DCB5f461c4Cc1047E1Dcf9`]
    },
    optimismSepolia: {
        address: `0x114A20A10b43D4115e5aeef7345a1A71d2a60C57`,
        chainSelector: `5224473277236331295`,
        feeTokens: [LINK_ADDRESSES[`optimismSepolia`], `0x4200000000000000000000000000000000000006`]
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
    bnbChainTestnet: {
        address: `0xE1053aE1857476f36A3C62580FF9b016E8EE8F6f`,
        chainSelector: `13264668187771770619`,
        feeTokens: [LINK_ADDRESSES[`bnbChainTestnet`], `0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd`]
    },
    baseSepolia: {
        address: `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93`,
        chainSelector: `10344971235874465080`,
        feeTokens: [LINK_ADDRESSES[`baseSepolia`], `0x4200000000000000000000000000000000000006`]
    },
    kromaSepolia: {
        address: `0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D`,
        chainSelector: `5990477251245693094`,
        feeTokens: [LINK_ADDRESSES[`kromaSepolia`], `0x4200000000000000000000000000000000000001`]
    },
    wemixTestnet: {
        address: `0xA8C0c11bf64AF62CDCA6f93D3769B88BdD7cb93D`,
        chainSelector: `9284632837123596123`,
        feeTokens: [LINK_ADDRESSES[`wemixTestnet`], `0xbE3686643c05f00eC46e73da594c78098F7a9Ae7`]
    },
    gnosisChiado: {
        address: `0x19b1bac554111517831ACadc0FD119D23Bb14391`,
        chainSelector: `8871595565390010547`,
        feeTokens: [LINK_ADDRESSES[`gnosisChiado`], `0x18c8a7ec7897177E4529065a7E7B0878358B3BfF`]
    },
    celoAlfajores: {
        address: `0xb00E95b773528E2Ea724DB06B75113F239D15Dca`,
        chainSelector: `3552045678561919002`,
        feeTokens: [LINK_ADDRESSES[`celoAlfajores`], `0x99604d0e2EfE7ABFb58BdE565b5330Bb46Ab3Dca`]
    },
    metisSepolia: {
        address: `0xaCdaBa07ECad81dc634458b98673931DD9d3Bc14`,
        chainSelector: `3777822886988675105`,
        feeTokens: [LINK_ADDRESSES[`metisSepolia`], `0x5c48e07062aC4E2Cf4b9A768a711Aef18e8fbdA0`]
    },
    zksyncSepolia: {
        address: `0xA1fdA8aa9A8C4b945C45aD30647b01f07D7A0B16`,
        chainSelector: `6898391096552792247`,
        feeTokens: [LINK_ADDRESSES[`zksyncSepolia`], `0x4317b2eCD41851173175005783322D29E9bAee9E`]
    },
}
