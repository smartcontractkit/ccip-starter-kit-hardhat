import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/*
 * Example08 (CCT 03): Deploy CrossChainToken + AdvancedPoolHooks + BurnMint pool.
 * Params: routerAddress, armProxy, registryModuleOwnerCustom, tokenAdminRegistry, thresholdAmountForAdditionalCCVs.
 *
 * Deploy (Sepolia):
 *   npx hardhat ignition deploy ignition/modules/BurnMintTokenPoolAdvancedPoolHook.ts --network sepolia --parameters ignition/paramsEthSepolia.json
 * Deploy (Fuji):
 *   npx hardhat ignition deploy ignition/modules/BurnMintTokenPoolAdvancedPoolHook.ts --network fuji --parameters ignition/paramsFuji.json
 */

const TOKEN_NAME = "TestToken";
const TOKEN_SYMBOL = "TEST";
const TOKEN_DECIMALS = 18;
const TOKEN_PREMINT = 1_000_000n * 10n ** 18n;
const TOKEN_MAX_SUPPLY = 100_000_000n * 10n ** 18n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Distinct token module so we deploy a new token (avoids AlreadyRegistered).
const CrossChainTokenAdvancedHookModule = buildModule("CrossChainTokenAdvancedHookModule", (m) => {
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

const BurnMintTokenPoolAdvancedPoolHookModule = buildModule("BurnMintTokenPoolAdvancedPoolHookModule", (m) => {
  const { crossChainToken } = m.useModule(CrossChainTokenAdvancedHookModule);
  const broadcaster = m.getAccount(0);

  const router = m.getParameter("routerAddress");
  const armProxy = m.getParameter("armProxy");
  const registryModuleOwnerCustomAddress = m.getParameter("registryModuleOwnerCustom");
  const tokenAdminRegistryAddress = m.getParameter("tokenAdminRegistry");
  const thresholdAmountForAdditionalCCVs = m.getParameter("thresholdAmountForAdditionalCCVs");

  const allowlist = [broadcaster];
  const authorizedCallers: string[] = [];
  const advancedPoolHooks = m.contract("AdvancedPoolHooks", [
    allowlist,
    thresholdAmountForAdditionalCCVs,
    ZERO_ADDRESS, // policyEngine disabled
    authorizedCallers,
  ]);

  const burnMintTokenPool = m.contract("BurnMintTokenPool", [
    crossChainToken,
    TOKEN_DECIMALS,
    advancedPoolHooks,
    armProxy,
    router,
  ]);

  m.call(advancedPoolHooks, "applyAuthorizedCallerUpdates", [
    { addedCallers: [burnMintTokenPool], removedCallers: [] },
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

  return { crossChainToken, advancedPoolHooks, burnMintTokenPool };
});

export default BurnMintTokenPoolAdvancedPoolHookModule;
