import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/*
 * Example07 (CCT 02): Deploy LockRelease token + lock box + pool.
 * Params: advancedPoolHooks (use 0), routerAddress, armProxy, registryModuleOwnerCustom, tokenAdminRegistry.
 *
 * Deploy (Sepolia):
 *   npx hardhat ignition deploy ignition/modules/LockAndReleaseTokenPool.ts --network sepolia --parameters ignition/paramsEthSepolia.json
 * Deploy (Fuji):
 *   npx hardhat ignition deploy ignition/modules/LockAndReleaseTokenPool.ts --network fuji --parameters ignition/paramsFuji.json
 */

const TOKEN_NAME = "TestToken";
const TOKEN_SYMBOL = "TEST";
const TOKEN_DECIMALS = 18;
const TOKEN_PREMINT = 1_000_000n * 10n ** 18n;
const TOKEN_MAX_SUPPLY = 100_000_000n * 10n ** 18n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Use a distinct name so Ignition deploys a new token for Lock Release instead of reusing
// the token from BurnMintTokenPoolModule (which would cause AlreadyRegistered on registerAdminViaGetCCIPAdmin).
const CrossChainTokenLockReleaseModule = buildModule("CrossChainTokenLockReleaseModule", (m) => {
  const broadcaster = m.getAccount(0);

  const tokenParams = [
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_MAX_SUPPLY,
    TOKEN_PREMINT,
    broadcaster,
    TOKEN_DECIMALS,
    broadcaster,
  ] as const;

  const crossChainToken = m.contract("CrossChainToken", [tokenParams, broadcaster, broadcaster]);

  return { crossChainToken };
});

const LockAndReleaseTokenPoolModule = buildModule("LockAndReleaseTokenPoolModule", (m) => {
  const { crossChainToken } = m.useModule(CrossChainTokenLockReleaseModule);

  const router = m.getParameter("routerAddress");
  const armProxy = m.getParameter("armProxy");
  const registryModuleOwnerCustomAddress = m.getParameter("registryModuleOwnerCustom");
  const tokenAdminRegistryAddress = m.getParameter("tokenAdminRegistry");

  const erc20LockBox = m.contract("ERC20LockBox", [crossChainToken]);

  const lockReleaseTokenPool = m.contract("LockReleaseTokenPool", [
    crossChainToken,
    TOKEN_DECIMALS,
    ZERO_ADDRESS, // No advanced pool hook in CCT 02
    armProxy,
    router,
    erc20LockBox,
  ]);

  m.call(erc20LockBox, "applyAuthorizedCallerUpdates", [
    { addedCallers: [lockReleaseTokenPool], removedCallers: [] },
  ]);

  const registryModuleOwnerCustom = m.contractAt("RegistryModuleOwnerCustom", registryModuleOwnerCustomAddress);

  const registerAdminCall = m.call(registryModuleOwnerCustom, "registerAdminViaGetCCIPAdmin", [crossChainToken]);

  const tokenAdminRegistry = m.contractAt("ITokenAdminRegistry", tokenAdminRegistryAddress);

  const acceptAdminRoleCall = m.call(tokenAdminRegistry, "acceptAdminRole", [crossChainToken], {
    after: [registerAdminCall],
  });

  m.call(tokenAdminRegistry, "setPool", [crossChainToken, lockReleaseTokenPool], {
    after: [acceptAdminRoleCall],
  });

  return { crossChainToken, erc20LockBox, lockReleaseTokenPool };
});

export default LockAndReleaseTokenPoolModule;
