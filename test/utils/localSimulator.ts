import hre from "hardhat";
import type { Address } from "viem";

export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

/**
 * Shared setup for tests that run the book's example tasks against the Chainlink Local no-fork simulator.
 * Each call returns an isolated in-process chain. The example tasks' sender is `broadcaster` (the first wallet).
 */
export async function setupLocalSimulator() {
  const connection = await hre.network.connect();
  const { viem } = connection;
  const publicClient = await viem.getPublicClient();
  const [broadcaster, other, beneficiary] = await viem.getWalletClients();

  const simulator = await viem.deployContract("CCIPLocalSimulator");
  const [chainSelector, routerAddress, , , linkAddress, bnmAddress] = await simulator.read.configuration();

  const router = await viem.getContractAt("CCIPLocalRouter", routerAddress);
  const link = await viem.getContractAt("LinkToken", linkAddress);
  const ccipBnM = await viem.getContractAt("BurnMintERC677Helper", bnmAddress);

  // The example tasks open their own connection with `hre.network.connect()`, which would be a fresh chain.
  // Hand them an hre whose `connect()` returns this test's connection instead.
  const taskHre = Object.create(hre, { network: { value: { connect: async () => connection } } }) as typeof hre;

  return {
    connection,
    viem,
    publicClient,
    broadcaster,
    other,
    beneficiary,
    simulator,
    chainSelector,
    router,
    link,
    ccipBnM,
    taskHre,
  };
}

export type LocalSimulator = Awaited<ReturnType<typeof setupLocalSimulator>>;

/** Runs an example task with its `console.log` progress output muted, so test output stays readable. */
export async function quietly<T>(run: () => Promise<T>): Promise<T> {
  const originalLog = console.log;
  console.log = () => {};
  try {
    return await run();
  } finally {
    console.log = originalLog;
  }
}
