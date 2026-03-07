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

const FactoryBurnMintERC20Module = buildModule("FactoryBurnMintERC20Module", (m) => {
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

const BurnMintTokenPoolModule = buildModule("BurnMintTokenPoolModule", (m) => {
  const { factoryBurnMintERC20 } = m.useModule(FactoryBurnMintERC20Module);

  const router = m.getParameter("routerAddress");
  const armProxy = m.getParameter("armProxy");
  const registryModuleOwnerCustomAddress = m.getParameter("registryModuleOwnerCustom");
  const tokenAdminRegistryAddress = m.getParameter("tokenAdminRegistry");

  const burnMintTokenPool = m.contract("BurnMintTokenPool", [
    factoryBurnMintERC20,
    TOKEN_DECIMALS,
    ZERO_ADDRESS, // No advanced pool hook in CCT 02
    armProxy,
    router,
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


  return { factoryBurnMintERC20, burnMintTokenPool };
});

export default BurnMintTokenPoolModule;