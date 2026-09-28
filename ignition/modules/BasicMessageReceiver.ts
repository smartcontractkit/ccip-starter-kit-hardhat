import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/*
 * Deploy (Sepolia):
 *   npx hardhat ignition deploy ignition/modules/BasicMessageReceiver.ts --network sepolia --parameters ignition/paramsEthSepolia.json
 * Deploy (Amoy):
 *   npx hardhat ignition deploy ignition/modules/BasicMessageReceiver.ts --network amoy --parameters ignition/paramsAmoy.json
 */

export default buildModule("BasicMessageReceiverModule", (m) => {

  //Router address pulled from --parameters flag (either json file or json string)
  const routerAddress = m.getParameter("routerAddress");
  const basicMessageReceiver = m.contract("BasicMessageReceiver", [routerAddress]);

  return { basicMessageReceiver };
});
