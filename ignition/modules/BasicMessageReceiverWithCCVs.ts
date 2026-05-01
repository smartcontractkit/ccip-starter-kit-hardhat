import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/*
 * Deploy BasicMessageReceiverWithCCVs (Sepolia):
 *   npx hardhat ignition deploy ignition/modules/BasicMessageReceiverWithCCVs.ts --network sepolia --parameters ignition/paramsEthSepolia.json
 * Deploy (Fuji):
 *   npx hardhat ignition deploy ignition/modules/BasicMessageReceiverWithCCVs.ts --network fuji --parameters ignition/paramsFuji.json
 */

export default buildModule("BasicMessageReceiverWithCCVsModule", (m) => {
  const routerAddress = m.getParameter("routerAddress");
  const basicMessageReceiverWithCCVs = m.contract("BasicMessageReceiverWithCCVs", [routerAddress]);

  return { basicMessageReceiverWithCCVs };
});
