import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { getAddress } from "viem";
import ExamplePolicyEngineModule from "../ignition/modules/ExamplePolicyEngine.js";
import example10Step1Action from "../tasks/Example10-Step1.js";
import example10Step2Action from "../tasks/Example10-Step2.js";
import { quietly, ZERO_ADDRESS } from "../test/utils/localSimulator.js";
import { expectRevertWithError } from "../test/utils/reverts.js";
import {
  balanceOf,
  deployModule,
  routeLatestSend,
  send,
  sendAndRoute,
  totalSupply,
  TRANSFER_AMOUNT,
  type Fork,
} from "./utils/cctFork.js";
import { setupHooksForks, type HooksForks } from "./utils/advancedPoolHooksFork.js";

type PolicyEngine = ContractReturnType<"ExamplePolicyEngine">;

/**
 * Example 10 (CCT 05): policy engine on AdvancedPoolHooks, Sepolia -> Amoy.
 * Runs against pinned forks of the live testnets. See `utils/cctFork.ts` for what is and is not simulated.
 * The hook calls the engine locally on each chain, so the source and destination engines are independent instances
 * (unlike pool-required CCVs, they do not need to share an address).
 */
describe("Example10 (fork)", () => {
  let env: HooksForks;

  beforeEach(async () => {
    env = await setupHooksForks();
  });

  async function deployEngine(fork: Fork): Promise<PolicyEngine> {
    const { examplePolicyEngine } = await deployModule(fork, ExamplePolicyEngineModule);
    return fork.viem.getContractAt("ExamplePolicyEngine", examplePolicyEngine.address);
  }

  const attach = (fork: Fork, hook: PolicyEngine["address"], policyEngine: PolicyEngine["address"]) =>
    quietly(() => example10Step1Action({ advancedPoolHook: hook, policyEngine }, fork.taskHre));

  const detach = (fork: Fork, hook: PolicyEngine["address"]) =>
    quietly(() => example10Step2Action({ advancedPoolHook: hook }, fork.taskHre));

  /** Deploys an engine on Sepolia and attaches it to the Sepolia hook. */
  async function attachSourceEngine(): Promise<PolicyEngine> {
    const engine = await deployEngine(env.forks.sepolia);
    await attach(env.forks.sepolia, env.sepolia.hook.address, engine.address);
    return engine;
  }

  it("attach attaches the engine to the hook", async () => {
    const engine = await attachSourceEngine();

    assert.equal(await env.sepolia.hook.read.getPolicyEngine(), getAddress(engine.address));
    assert.ok(await engine.read.isAttached([env.sepolia.hook.address]), "engine did not record the hook as attached");
  });

  it("send is allowed within the engine cap", async () => {
    await attachSourceEngine();
    const destinationSupplyBefore = await totalSupply(env.forks.amoy, env.amoy.token.address);

    // The default cap (10 ether) is above the transfer amount, so the engine allows the transfer.
    await sendAndRoute(env.forks, env.sepolia.token.address, TRANSFER_AMOUNT);

    assert.equal(await balanceOf(env.forks.amoy, env.amoy.token.address, env.forks.receiver), TRANSFER_AMOUNT);
    assert.equal(
      await totalSupply(env.forks.amoy, env.amoy.token.address),
      destinationSupplyBefore + TRANSFER_AMOUNT,
    );
  });

  it("send reverts when the amount exceeds the engine cap", async () => {
    const engine = await attachSourceEngine();

    // Lower the cap below the transfer amount: the source-side preflight check rejects the send.
    // The engine is owned by the broadcaster (the deployer), so it can set the cap.
    await engine.write.setCap([TRANSFER_AMOUNT / 2n]);

    await expectRevertWithError(
      send(env.forks, env.sepolia.token.address, TRANSFER_AMOUNT),
      engine.abi,
      "AmountExceedsCap",
    );
  });

  it("send fails to execute when the destination engine rejects", async () => {
    await attachSourceEngine();

    // Attach a destination engine with a cap below the transfer amount: the send succeeds on the source, but the
    // destination-side postflight check rejects the execution.
    const destinationEngine = await deployEngine(env.forks.amoy);
    await attach(env.forks.amoy, env.amoy.hook.address, destinationEngine.address);
    await destinationEngine.write.setCap([TRANSFER_AMOUNT / 2n]);

    await send(env.forks, env.sepolia.token.address, TRANSFER_AMOUNT);

    // Routing surfaces the recorded destination-side failure.
    await assert.rejects(routeLatestSend(env.forks));
  });

  it("detach restores unrestricted transfers", async () => {
    const engine = await attachSourceEngine();
    await engine.write.setCap([TRANSFER_AMOUNT / 2n]);

    await detach(env.forks.sepolia, env.sepolia.hook.address);
    assert.equal(await env.sepolia.hook.read.getPolicyEngine(), ZERO_ADDRESS);
    assert.equal(
      await engine.read.isAttached([env.sepolia.hook.address]),
      false,
      "engine still records the hook as attached",
    );

    // With the engine detached, the same transfer that was rejected now succeeds.
    await sendAndRoute(env.forks, env.sepolia.token.address, TRANSFER_AMOUNT);
    assert.equal(await balanceOf(env.forks.amoy, env.amoy.token.address, env.forks.receiver), TRANSFER_AMOUNT);
  });
});
