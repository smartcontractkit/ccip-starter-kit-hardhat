import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import { decodeFunctionData, encodeAbiParameters } from "viem";
import { encodeV3, getNoExecutionAddress } from "../scripts/CallEncodeExtraArgsOffchain.js";
import example05Action from "../tasks/Example05.js";
import { quietly, setupLocalSimulator, ZERO_ADDRESS, type LocalSimulator } from "./utils/localSimulator.js";

/**
 * Example 05: ExtraArgsV3 with the NO_EXECUTION_ADDRESS executor (manual execution path).
 * Chainlink Local does not model executors or manual execution: the local router ignores `executor`, so these tests
 * only verify what the task sends. Whether the message stays pending until manually executed can only be observed on
 * a real lane (or a fork), and is deliberately not asserted here.
 */
describe("Example05", () => {
  const MESSAGE_TEXT = "Manual execution";
  const GAS_LIMIT = 200_000;
  const BLOCK_CONFIRMATIONS = 3;

  let s: LocalSimulator;
  let receiver: ContractReturnType<"BasicMessageReceiverWithCCVs">;

  beforeEach(async () => {
    s = await setupLocalSimulator();
    receiver = await s.viem.deployContract("BasicMessageReceiverWithCCVs", [s.router.address]);
    await receiver.write.setMinBlockDepth([s.chainSelector, BLOCK_CONFIRMATIONS]);
  });

  const send = (overrides: { receiver?: string } = {}) =>
    quietly(() =>
      example05Action(
        {
          sourceRouter: s.router.address,
          destinationChainSelector: s.chainSelector,
          receiver: overrides.receiver ?? receiver.address,
          messageText: MESSAGE_TEXT,
          gasLimit: GAS_LIMIT,
          blockConfirmations: BLOCK_CONFIRMATIONS,
          feeTokenAddress: ZERO_ADDRESS,
        },
        s.taskHre,
      ),
    );

  it("sends ExtraArgsV3 with the NO_EXECUTION executor", async () => {
    const expectedExtraArgs = await encodeV3({
      gasLimit: GAS_LIMIT,
      blockConfirmations: BLOCK_CONFIRMATIONS,
      executor: await getNoExecutionAddress(),
    });

    await send();

    // The task's `ccipSend` is the last transaction mined; decode what it sent to the router.
    const block = await s.publicClient.getBlock({ blockTag: "latest", includeTransactions: true });
    const tx = block.transactions.find((t) => t.to?.toLowerCase() === s.router.address.toLowerCase());
    assert.ok(tx, "no transaction to the router in the latest block");
    const { functionName, args } = decodeFunctionData({ abi: s.router.abi, data: tx.input });
    assert.equal(functionName, "ccipSend");
    const [destinationChainSelector, message] = args as readonly [bigint, any];
    assert.equal(destinationChainSelector, s.chainSelector);
    assert.equal(message.receiver, encodeAbiParameters([{ type: "address" }], [receiver.address]));
    assert.equal(message.data, encodeAbiParameters([{ type: "string" }], [MESSAGE_TEXT]));
    assert.deepEqual(message.tokenAmounts, []);
    assert.equal(message.extraArgs, expectedExtraArgs);
    assert.equal(message.feeToken, ZERO_ADDRESS);
  });

  it("rejects a zero receiver", async () => {
    await assert.rejects(send({ receiver: ZERO_ADDRESS }), /receiver required/);
  });
});
