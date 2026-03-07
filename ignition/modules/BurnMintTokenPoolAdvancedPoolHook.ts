import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/*
 * Example08 (CCT 03): Deploy BurnMint token + AdvancedPoolHooks + BurnMint pool.
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
const FactoryBurnMintERC20AdvancedHookModule = buildModule("FactoryBurnMintERC20AdvancedHookModule", (m) => {
  const newOwner = m.getAccount(0);

  const factoryBurnMintERC20 = m.contract("FactoryBurnMintERC20", [
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DECIMALS,
    TOKEN_MAX_SUPPLY,
    TOKEN_PREMINT,
    newOwner,
  ]);

  return { factoryBurnMintERC20 };
});

const BurnMintTokenPoolAdvancedPoolHookModule = buildModule("BurnMintTokenPoolAdvancedPoolHookModule", (m) => {
  const { factoryBurnMintERC20 } = m.useModule(FactoryBurnMintERC20AdvancedHookModule);
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
    factoryBurnMintERC20,
    TOKEN_DECIMALS,
    advancedPoolHooks,
    armProxy,
    router,
  ]);

  m.call(advancedPoolHooks, "applyAuthorizedCallerUpdates", [
    { addedCallers: [burnMintTokenPool], removedCallers: [] },
  ]);

  m.call(factoryBurnMintERC20, "grantMintAndBurnRoles", [burnMintTokenPool]);

  const registryModuleOwnerCustom = m.contractAt("RegistryModuleOwnerCustom", registryModuleOwnerCustomAddress);

  const registerAdminCall = m.call(registryModuleOwnerCustom, "registerAdminViaOwner", [factoryBurnMintERC20]);

  const tokenAdminRegistry = m.contractAt("ITokenAdminRegistry", tokenAdminRegistryAddress);

  const acceptAdminRoleCall = m.call(tokenAdminRegistry, "acceptAdminRole", [factoryBurnMintERC20], {
    after: [registerAdminCall],
  });

  m.call(tokenAdminRegistry, "setPool", [factoryBurnMintERC20, burnMintTokenPool], {
    after: [acceptAdminRoleCall],
  });

  return { factoryBurnMintERC20, advancedPoolHooks, burnMintTokenPool };
});

export default BurnMintTokenPoolAdvancedPoolHookModule;
