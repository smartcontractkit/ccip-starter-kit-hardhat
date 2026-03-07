import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/*
 * Deploy (Sepolia):
 *   npx hardhat ignition deploy ignition/modules/BasicMessageSender.ts --network sepolia --parameters ignition/paramsEthSepolia.json
 * Deploy (Fuji):
 *   npx hardhat ignition deploy ignition/modules/BasicMessageSender.ts --network fuji --parameters ignition/paramsFuji.json
 */

export default buildModule("BasicMessageSenderModule", (m) => {

  //Router address pulled from --parameters flag (either json file or json string)
  const routerAddress = m.getParameter("routerAddress");
  const linkAddress = m.getParameter("linkAddress");
  const basicMessageSender = m.contract("BasicMessageSender", [routerAddress, linkAddress]);

  return { basicMessageSender };
});
