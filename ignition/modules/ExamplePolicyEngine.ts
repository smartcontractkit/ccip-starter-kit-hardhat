import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/*
 * Deploy the minimal example policy engine for Example 10 (Sepolia):
 *   npx hardhat ignition deploy ignition/modules/ExamplePolicyEngine.ts --network sepolia
 * Deploy (Amoy):
 *   npx hardhat ignition deploy ignition/modules/ExamplePolicyEngine.ts --network amoy
 *
 * THIS IS AN EXAMPLE CONTRACT, NOT AUDITED, NOT FOR PRODUCTION. For production-grade policy engines use
 * Chainlink ACE (https://docs.chain.link/ace).
 */

export default buildModule("ExamplePolicyEngineModule", (m) => {
  const examplePolicyEngine = m.contract("ExamplePolicyEngine");

  return { examplePolicyEngine };
});
