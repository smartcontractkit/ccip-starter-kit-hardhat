import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/*
 * Deploy BasicMessageReceiverWithCCVs (Sepolia):
 *   npx hardhat ignition deploy ignition/modules/BasicMessageReceiverWithCCVs.ts --network sepolia --parameters ignition/paramsEthSepolia.json
 * Deploy (Amoy):
 *   npx hardhat ignition deploy ignition/modules/BasicMessageReceiverWithCCVs.ts --network amoy --parameters ignition/paramsAmoy.json
 */

export default buildModule("BasicMessageReceiverWithCCVsModule", (m) => {
  const routerAddress = m.getParameter("routerAddress");
  const basicMessageReceiverWithCCVs = m.contract("BasicMessageReceiverWithCCVs", [routerAddress]);

  return { basicMessageReceiverWithCCVs };
});
