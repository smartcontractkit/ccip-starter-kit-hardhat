import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/*
 * Deploy (Sepolia):
 *   npx hardhat ignition deploy ignition/modules/BurnMintTokenPool.ts --network sepolia --parameters ignition/paramsEthSepolia.json
 * Deploy (Fuji):
 *   npx hardhat ignition deploy ignition/modules/BurnMintTokenPool.ts --network fuji --parameters ignition/paramsFuji.json
 */

const TOKEN_NAME = "TestToken";
const TOKEN_SYMBOL = "TEST";
const TOKEN_DECIMALS = 18;
const TOKEN_PREMINT = 1_000_000n * 10n ** 18n;
const TOKEN_MAX_SUPPLY = 100_000_000n * 10n ** 18n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const CrossChainTokenModule = buildModule("CrossChainTokenModule", (m) => {
  const broadcaster = m.getAccount(0);

  const tokenParams = {
    name: TOKEN_NAME,
    symbol: TOKEN_SYMBOL,
    maxSupply: TOKEN_MAX_SUPPLY,
    preMint: TOKEN_PREMINT,
    preMintRecipient: broadcaster,
    decimals: TOKEN_DECIMALS,
    ccipAdmin: broadcaster,
  };

  const crossChainToken = m.contract("CrossChainToken", [tokenParams, broadcaster, broadcaster]);

  return { crossChainToken };
});

const BurnMintTokenPoolModule = buildModule("BurnMintTokenPoolModule", (m) => {
  const { crossChainToken } = m.useModule(CrossChainTokenModule);

  const router = m.getParameter("routerAddress");
  const armProxy = m.getParameter("armProxy");
  const registryModuleOwnerCustomAddress = m.getParameter("registryModuleOwnerCustom");
  const tokenAdminRegistryAddress = m.getParameter("tokenAdminRegistry");

  const burnMintTokenPool = m.contract("BurnMintTokenPool", [
    crossChainToken,
    TOKEN_DECIMALS,
    ZERO_ADDRESS, // No advanced pool hook in CCT 01
    armProxy,
    router,
  ]);

  m.call(crossChainToken, "grantMintAndBurnRoles", [burnMintTokenPool]);

  const registryModuleOwnerCustom = m.contractAt("RegistryModuleOwnerCustom", registryModuleOwnerCustomAddress);

  const registerAdminCall = m.call(registryModuleOwnerCustom, "registerAdminViaGetCCIPAdmin", [crossChainToken]);

  const tokenAdminRegistry = m.contractAt("ITokenAdminRegistry", tokenAdminRegistryAddress);

  const acceptAdminRoleCall = m.call(tokenAdminRegistry, "acceptAdminRole", [crossChainToken], {
    after: [registerAdminCall],
  });

  m.call(tokenAdminRegistry, "setPool", [crossChainToken, burnMintTokenPool], {
    after: [acceptAdminRoleCall],
  });

  return { crossChainToken, burnMintTokenPool };
});

export default BurnMintTokenPoolModule;
