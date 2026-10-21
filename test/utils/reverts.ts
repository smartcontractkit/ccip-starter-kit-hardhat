import assert from "node:assert/strict";
import { decodeErrorResult, parseAbi, type Abi, type Hex } from "viem";

/** Errors raised by CCIP libraries and the local router that do not appear in the example contracts' ABIs. */
export const ccipErrorsAbi = parseAbi([
  "error InvalidRequestedFinality(bytes4 requestedFinality, bytes4 allowedFinality)",
  "error CanOnlySendOneTokenPerMessage()",
  "error InvalidRouter(address router)",
]);

/** Walks a viem error's `cause` chain and returns the first revert payload it finds (`0x` for an empty revert). */
function findRevertData(error: unknown): Hex | undefined {
  let current = error as { data?: unknown; raw?: unknown; cause?: unknown } | undefined;
  while (current) {
    // viem's `ContractFunctionRevertedError` decodes `data` itself and keeps the raw revert bytes in `raw`.
    if (typeof current.raw === "string" && current.raw.startsWith("0x")) return current.raw as Hex;
    const data = current.data;
    if (typeof data === "string" && data.startsWith("0x")) return data as Hex;
    if (typeof data === "object" && data !== null && typeof (data as { data?: unknown }).data === "string") {
      return (data as { data: Hex }).data;
    }
    current = current.cause as typeof current;
  }
  return undefined;
}

async function revertErrorOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  return assert.fail("expected the call to revert, but it succeeded");
}

async function revertDataOf(promise: Promise<unknown>): Promise<Hex> {
  const error = await revertErrorOf(promise);
  return findRevertData(error) ?? assert.fail(`reverted without revert data: ${String(error)}`);
}

/** Asserts the call reverts with the named custom error (or `Error(string)`/`Panic`) and, optionally, these arguments. */
export async function expectRevertWithError(
  promise: Promise<unknown>,
  abi: Abi,
  errorName: string,
  args?: readonly unknown[],
): Promise<void> {
  const data = await revertDataOf(promise);
  const decoded = decodeErrorResult({ abi: [...abi, ...ccipErrorsAbi], data });
  assert.equal(decoded.errorName, errorName);
  if (args !== undefined) assert.deepEqual(decoded.args, args);
}

/** Asserts the call reverts with `Error(reason)`. */
export async function expectRevertWithReason(promise: Promise<unknown>, reason: string): Promise<void> {
  await expectRevertWithError(promise, [], "Error", [reason]);
}

/** Asserts the call reverts with no revert data at all. */
export async function expectEmptyRevert(promise: Promise<unknown>): Promise<void> {
  const error = await revertErrorOf(promise);
  assert.match(String(error), /revert/i);
  const data = findRevertData(error);
  assert.ok(data === undefined || data === "0x", `expected an empty revert, got ${data}`);
}
