import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { getAddress, type Address } from "viem";
import example09Step1Action from "../tasks/Example09-Step1.js";
import example09Step2Action from "../tasks/Example09-Step2.js";
import { quietly } from "../test/utils/localSimulator.js";
import { expectRevertWithError } from "../test/utils/reverts.js";
import { AMOY, balanceOf, SEPOLIA, sendAndRoute, totalSupply, TRANSFER_AMOUNT, type Fork } from "./utils/cctFork.js";
import { setupHooksForks, type HooksForks } from "./utils/advancedPoolHooksFork.js";

type CountingCCV = ContractReturnType<"CountingCCV">;

/**
 * Example 09 (CCT 04): pool-based CCV requirements on AdvancedPoolHooks, Sepolia -> Amoy.
 * Runs against pinned forks of the live testnets. See `utils/cctFork.ts` for what is and is not simulated.
 * A pool-required CCV must exist at the same address on both chains: the source OnRamp consults it outbound and the
 * destination OffRamp resolves `getInboundImplementation` on the same address. The tests deploy a counting no-op CCV on
 * Sepolia and copy its code to the same address on Amoy (real CCVs are CREATE2-deployed to matching addresses). Like the
 * simulator's own CCVs, it performs no real verification.
 */
describe("Example09 (fork)", () => {
  let env: HooksForks;
  let sepoliaCcv: CountingCCV;
  let sepoliaThresholdCcv: CountingCCV;
  let amoyCcv: CountingCCV;
  let amoyThresholdCcv: CountingCCV;

  /** Deploys a CountingCCV on Sepolia and puts the same runtime code at the same address on Amoy. */
  async function deployCcvOnBothForks(): Promise<[CountingCCV, CountingCCV]> {
    const { sepolia, amoy } = env.forks;
    const onSepolia = await sepolia.viem.deployContract("CountingCCV");
    const code = await sepolia.publicClient.getCode({ address: onSepolia.address });
    assert.ok(code && code !== "0x", "CountingCCV has no code on Sepolia");
    await (await amoy.viem.getTestClient()).setCode({ address: onSepolia.address, bytecode: code });
    return [onSepolia, await amoy.viem.getContractAt("CountingCCV", onSepolia.address)];
  }

  beforeEach(async () => {
    env = await setupHooksForks();
    [sepoliaCcv, amoyCcv] = await deployCcvOnBothForks();
    [sepoliaThresholdCcv, amoyThresholdCcv] = await deployCcvOnBothForks();
  });

  const setCcvConfig = (
    fork: Fork,
    hook: Address,
    remoteChainSelector: bigint,
    config: { base?: Address[]; threshold?: Address[] } = {},
  ) =>
    quietly(() =>
      example09Step1Action(
        {
          advancedPoolHook: hook,
          remoteChainSelector,
          outboundCcvs: (config.base ?? []).join(","),
          thresholdOutboundCcvs: (config.threshold ?? []).join(","),
          inboundCcvs: (config.base ?? []).join(","),
          thresholdInboundCcvs: (config.threshold ?? []).join(","),
        },
        fork.taskHre,
      ),
    );

  const setThreshold = (fork: Fork, hook: Address, thresholdAmount: bigint) =>
    quietly(() => example09Step2Action({ advancedPoolHook: hook, thresholdAmount }, fork.taskHre));

  /** Configures the CCV (and optional threshold CCV) on both hooks, for traffic in both directions. */
  async function setCcvConfigOnBothHooks(base: Address[], threshold: Address[] = []): Promise<void> {
    await setCcvConfig(env.forks.sepolia, env.sepolia.hook.address, AMOY.chainSelector, { base, threshold });
    await setCcvConfig(env.forks.amoy, env.amoy.hook.address, SEPOLIA.chainSelector, { base, threshold });
  }

  it("setPoolCCVConfig stores the config on both hooks", async () => {
    await setCcvConfigOnBothHooks([sepoliaCcv.address]);

    const sepoliaConfig = await env.sepolia.hook.read.getCCVConfig([AMOY.chainSelector]);
    assert.deepEqual(sepoliaConfig.outboundCCVs, [getAddress(sepoliaCcv.address)]);
    assert.deepEqual(sepoliaConfig.inboundCCVs, [getAddress(sepoliaCcv.address)]);

    const amoyConfig = await env.amoy.hook.read.getCCVConfig([SEPOLIA.chainSelector]);
    assert.deepEqual(amoyConfig.outboundCCVs, [getAddress(sepoliaCcv.address)]);
    assert.deepEqual(amoyConfig.inboundCCVs, [getAddress(sepoliaCcv.address)]);
  });

  it("send consults the pool-required CCV on both sides", async () => {
    await setCcvConfigOnBothHooks([sepoliaCcv.address]);
    const destinationSupplyBefore = await totalSupply(env.forks.amoy, env.amoy.token.address);

    await sendAndRoute(env.forks, env.sepolia.token.address, TRANSFER_AMOUNT);

    // The transfer still succeeds end to end.
    assert.equal(await balanceOf(env.forks.amoy, env.amoy.token.address, env.forks.receiver), TRANSFER_AMOUNT);
    assert.equal(
      await totalSupply(env.forks.amoy, env.amoy.token.address),
      destinationSupplyBefore + TRANSFER_AMOUNT,
    );
    // The source OnRamp consulted the CCV outbound (getOutboundImplementation + forwardToVerifier).
    assert.equal(await sepoliaCcv.read.outboundConsultations(), 1n, "source OnRamp did not consult the CCV");
    // The destination OffRamp verified the message inbound (getInboundImplementation + verifyMessage).
    assert.equal(await amoyCcv.read.inboundVerifications(), 1n, "destination OffRamp did not verify with the CCV");
  });

  it("send requires the threshold CCVs only at or above the threshold amount", async () => {
    // Base CCVs: the double. Threshold CCVs: a second CCV, as duplicates within a config are rejected.
    // First raise the threshold above the transfer amount: only the base CCV is required.
    await setThreshold(env.forks.sepolia, env.sepolia.hook.address, TRANSFER_AMOUNT + 1n);
    await setThreshold(env.forks.amoy, env.amoy.hook.address, TRANSFER_AMOUNT + 1n);
    await setCcvConfigOnBothHooks([sepoliaCcv.address], [sepoliaThresholdCcv.address]);

    await sendAndRoute(env.forks, env.sepolia.token.address, TRANSFER_AMOUNT);

    assert.equal(await sepoliaCcv.read.outboundConsultations(), 1n);
    assert.equal(await sepoliaThresholdCcv.read.outboundConsultations(), 0n, "threshold CCV consulted below threshold");
    assert.equal(await amoyCcv.read.inboundVerifications(), 1n);
    assert.equal(await amoyThresholdCcv.read.inboundVerifications(), 0n, "threshold CCV verified below threshold");

    // Now lower the threshold to 1 wei: the same transfer amount requires the threshold CCV too.
    await setThreshold(env.forks.sepolia, env.sepolia.hook.address, 1n);
    await setThreshold(env.forks.amoy, env.amoy.hook.address, 1n);

    await sendAndRoute(env.forks, env.sepolia.token.address, TRANSFER_AMOUNT);

    assert.equal(await sepoliaCcv.read.outboundConsultations(), 2n);
    assert.equal(await sepoliaThresholdCcv.read.outboundConsultations(), 1n, "threshold CCV not consulted at threshold");
    assert.equal(await amoyCcv.read.inboundVerifications(), 2n);
    assert.equal(await amoyThresholdCcv.read.inboundVerifications(), 1n, "threshold CCV not verified at threshold");
  });

  it("setPoolCCVConfig with empty lists clears the config", async () => {
    await setCcvConfig(env.forks.sepolia, env.sepolia.hook.address, AMOY.chainSelector, { base: [sepoliaCcv.address] });
    assert.ok((await env.sepolia.hook.read.getCCVConfig([AMOY.chainSelector])).outboundCCVs.length > 0);

    // Clearing with empty lists removes the selector from the configured set.
    await setCcvConfig(env.forks.sepolia, env.sepolia.hook.address, AMOY.chainSelector);

    const cleared = await env.sepolia.hook.read.getCCVConfig([AMOY.chainSelector]);
    assert.equal(cleared.outboundCCVs.length, 0);
    assert.equal(cleared.inboundCCVs.length, 0);
    assert.equal((await env.sepolia.hook.read.getAllCCVConfigs()).length, 0);
  });

  it("setPoolCCVConfig reverts when threshold CCVs have no base CCVs", async () => {
    await expectRevertWithError(
      setCcvConfig(env.forks.sepolia, env.sepolia.hook.address, AMOY.chainSelector, {
        threshold: [sepoliaCcv.address],
      }),
      env.sepolia.hook.abi,
      "MustSpecifyUnderThresholdCCVsForThresholdCCVs",
    );
  });
});
