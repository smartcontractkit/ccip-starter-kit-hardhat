import assert from "node:assert/strict";
import {
  getCCIPMessages,
  routeMessage,
  type EthersConnection,
  type RouteMessageResult,
} from "@chainlink/local/scripts/CCIPLocalSimulatorFork.js";
import type { ContractReturnType } from "@nomicfoundation/hardhat-viem/types";
import hre from "hardhat";
import { encodeAbiParameters, erc20Abi, getAddress, parseAbi, type Address } from "viem";
import { encodeV3Basic } from "../../scripts/CallEncodeExtraArgsOffchain.js";
import example06Step2Action from "../../tasks/Example06-Step2.js";
import { quietly, ZERO_ADDRESS } from "../../test/utils/localSimulator.js";

/**
 * Shared setup for fork tests of the CCT examples (Example06-10) on Ethereum Sepolia -> Polygon Amoy.
 *
 * Chainlink Local's no-fork mode has no token pools or TokenAdminRegistry, so these tests run the real example tasks
 * against forks of the live testnets and let the Chainlink Local fork helper route each message to the destination
 * OffRamp. Both forks are pinned to a block (see `forking.blockNumber` in hardhat.config.ts), so a run is reproducible.
 *
 * Not modelled by the helper (and not asserted): real CCV attestations, RMN, executor fees and manual execution. CCVs on
 * the lane are replaced by a synthetic verifier.
 */

/** Network details of the two chains, as listed in `@chainlink/local`'s `RegisterData.sol` (v0.3.1). */
export const SEPOLIA = {
  chainSelector: 16015286601757825753n,
  routerAddress: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  rmnProxyAddress: "0xba3f6251de62dED61Ff98590cB2fDf6871FbB991",
  registryModuleOwnerCustomAddress: "0xa3c796d480638d7476792230da1E2ADa86e031b0",
  tokenAdminRegistryAddress: "0x95F29FEE11c5C55d26cCcf1DB6772DE953B37B82",
} as const;

export const AMOY = {
  chainSelector: 16281711391670634445n,
  routerAddress: "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2",
  rmnProxyAddress: "0x7c1e545A40750Ee8761282382D51E017BAC68CBB",
  registryModuleOwnerCustomAddress: "0xAF2356327c6BBd644A273271B6cA301B49787970",
  tokenAdminRegistryAddress: "0x1e73f6842d7afDD78957ac143d1f315404Dd9e5B",
} as const;

export type ChainDetails = typeof SEPOLIA | typeof AMOY;

export const TRANSFER_AMOUNT = 10n ** 18n;
export const PREMINT = 1_000_000n * 10n ** 18n;
/** The value the book passes for `thresholdAmountForAdditionalCCVs`. */
export const THRESHOLD = 1n;
export const EOA_RECEIVER_GAS_LIMIT = 0;

const tokenAdminRegistryAbi = parseAbi([
  "function getTokenConfig(address token) view returns ((address administrator, address pendingAdministrator, address tokenPool))",
]);
const typeAndVersionAbi = parseAbi(["function typeAndVersion() view returns (string)"]);
const routerOnRampAbi = parseAbi(["function getOnRamp(uint64 destChainSelector) view returns (address)"]);

type ForkConnection = Awaited<ReturnType<typeof hre.network.connect>>;

/** One side of the lane: the fork connection plus what is needed to drive tasks and read state on it. */
export interface Fork {
  details: ChainDetails;
  connection: ForkConnection;
  viem: ForkConnection["viem"];
  publicClient: Awaited<ReturnType<ForkConnection["viem"]["getPublicClient"]>>;
  /** hre whose `network.connect()` returns this fork, for running example tasks against it. */
  taskHre: typeof hre;
  /** The account every example task sends from (Hardhat wallet 0). */
  broadcaster: Address;
}

async function connectFork(network: "sepoliaFork" | "amoyFork", details: ChainDetails): Promise<Fork> {
  const connection = await hre.network.connect({ network });
  const publicClient = await connection.viem.getPublicClient();
  const [broadcaster] = await connection.viem.getWalletClients();
  const taskHre = Object.create(hre, { network: { value: { connect: async () => connection } } }) as typeof hre;
  return {
    details,
    connection,
    viem: connection.viem,
    publicClient,
    taskHre,
    broadcaster: getAddress(broadcaster.account.address),
  };
}

export interface Forks {
  sepolia: Fork;
  amoy: Fork;
  /** Any EOA that is not the broadcaster; token receiver on Amoy. */
  receiver: Address;
}

/** Forks both testnets at their pinned blocks and checks the lane is the CCIP 2.0 lane the book describes. */
export async function setupForks(): Promise<Forks> {
  const sepolia = await connectFork("sepoliaFork", SEPOLIA);
  const amoy = await connectFork("amoyFork", AMOY);
  const [, receiverClient] = await sepolia.viem.getWalletClients();

  // Fail with a clear message if the pinned block or the lane is not what the book describes.
  const onRamp = await sepolia.publicClient.readContract({
    address: SEPOLIA.routerAddress,
    abi: routerOnRampAbi,
    functionName: "getOnRamp",
    args: [AMOY.chainSelector],
  });
  assert.notEqual(onRamp, ZERO_ADDRESS, "Sepolia router has no OnRamp for Amoy at the pinned block");
  assert.equal(
    await sepolia.publicClient.readContract({ address: onRamp, abi: typeAndVersionAbi, functionName: "typeAndVersion" }),
    "OnRamp 2.0.0",
    "Sepolia -> Amoy is not a CCIP 2.0 lane",
  );

  return { sepolia, amoy, receiver: getAddress(receiverClient.account.address) };
}

/** Deploys an Ignition module on `fork` with the book's per-chain parameters. */
export async function deployModule(
  fork: Fork,
  module: Parameters<Fork["connection"]["ignition"]["deploy"]>[0],
): Promise<Record<string, { address: Address }>> {
  return (await fork.connection.ignition.deploy(module, {
    parameters: {
      $global: {
        routerAddress: fork.details.routerAddress,
        armProxy: fork.details.rmnProxyAddress,
        registryModuleOwnerCustom: fork.details.registryModuleOwnerCustomAddress,
        tokenAdminRegistry: fork.details.tokenAdminRegistryAddress,
        thresholdAmountForAdditionalCCVs: THRESHOLD,
      },
    },
  })) as Record<string, { address: Address }>;
}

/**
 * Sends `amount` of `token` Sepolia -> Amoy to `receiver` (native fee) through the book's `example06-step2` task, then
 * routes the message to the destination OffRamp. The send is rejected on Sepolia if the source pool or lane refuse it;
 * the route throws if the Amoy execution fails.
 */
export async function sendAndRoute(
  forks: Forks,
  token: Address,
  amount: bigint,
  blockConfirmations = 0,
  sendAction: SendAction = example06Step2Action,
): Promise<RouteMessageResult> {
  await send(forks, token, amount, blockConfirmations, sendAction);
  return routeLatestSend(forks);
}

/** The token-transfer tasks of Examples 06-08 share one argument schema. */
export type SendAction = typeof example06Step2Action;

/** Runs the book's send task on Sepolia without routing the message. */
export async function send(
  forks: Forks,
  token: Address,
  amount: bigint,
  blockConfirmations = 0,
  sendAction: SendAction = example06Step2Action,
): Promise<void> {
  await quietly(() =>
    sendAction(
      {
        sourceRouter: SEPOLIA.routerAddress,
        destinationChainSelector: AMOY.chainSelector,
        receiver: forks.receiver,
        tokenToSend: token,
        amount,
        gasLimit: EOA_RECEIVER_GAS_LIMIT,
        blockConfirmations,
        feeTokenAddress: ZERO_ADDRESS,
      },
      forks.sepolia.taskHre,
    ),
  );
}

/** Routes the CCIP message sent by the last Sepolia `ccipSend` to the Amoy OffRamp. */
export async function routeLatestSend(forks: Forks): Promise<RouteMessageResult> {
  const { sepolia, amoy } = forks;
  const block = await sepolia.publicClient.getBlock({ blockTag: "latest", includeTransactions: true });
  const sendTx = block.transactions.find((tx) => tx.to?.toLowerCase() === SEPOLIA.routerAddress.toLowerCase());
  assert.ok(sendTx, "no transaction to the Sepolia router in the latest block");

  const receipt = await sepolia.connection.ethers.provider.getTransactionReceipt(sendTx.hash);
  assert.ok(receipt, "no receipt for the ccipSend transaction");
  // The helper's `EthersConnection` is structural; hardhat-ethers' real connection satisfies it at runtime.
  const [sent] = getCCIPMessages(sepolia.connection as unknown as EthersConnection, receipt);
  assert.ok(sent, "ccipSend emitted no CCIP message");
  return routeMessage(amoy.connection as unknown as EthersConnection, AMOY.routerAddress, sent);
}

/**
 * Smallest candidate depth the live lane accepts for a token-only transfer of `token`, found by quoting. Candidates are
 * probed in ascending order. The source pool must already allow depth 1 or above, otherwise the quote reverts at the pool.
 */
export async function findLaneFtfDepth(forks: Forks, token: Address): Promise<number> {
  const routerArtifact = await hre.artifacts.readArtifact("Router");
  for (const depth of [1, 2, 3, 5, 10, 20, 50, 100]) {
    const message = {
      receiver: encodeAbiParameters([{ type: "address" }], [forks.receiver]),
      data: "0x" as const,
      tokenAmounts: [{ token, amount: TRANSFER_AMOUNT }],
      extraArgs: await encodeV3Basic({ gasLimit: EOA_RECEIVER_GAS_LIMIT, blockConfirmations: depth }),
      feeToken: ZERO_ADDRESS,
    };
    try {
      await forks.sepolia.publicClient.readContract({
        address: SEPOLIA.routerAddress,
        abi: routerArtifact.abi,
        functionName: "getFee",
        args: [AMOY.chainSelector, message],
      });
      return depth;
    } catch {
      /* depth not accepted by the lane; try the next one */
    }
  }
  assert.fail("no Faster Than Finality depth up to 100 is accepted by the Sepolia -> Amoy lane at the pinned block");
}

export async function balanceOf(fork: Fork, token: Address, account: Address): Promise<bigint> {
  return fork.publicClient.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [account] });
}

export async function totalSupply(fork: Fork, token: Address): Promise<bigint> {
  return fork.publicClient.readContract({ address: token, abi: erc20Abi, functionName: "totalSupply" });
}

export async function assertRegistered(fork: Fork, token: Address, pool: Address): Promise<void> {
  const config = await fork.publicClient.readContract({
    address: fork.details.tokenAdminRegistryAddress,
    abi: tokenAdminRegistryAbi,
    functionName: "getTokenConfig",
    args: [token],
  });
  assert.equal(config.administrator, fork.broadcaster, "registry administrator");
  assert.equal(config.pendingAdministrator, ZERO_ADDRESS, "registry pending administrator");
  assert.equal(config.tokenPool, getAddress(pool), "registry token pool");
}

export type TokenPoolContract = ContractReturnType<"BurnMintTokenPool"> | ContractReturnType<"LockReleaseTokenPool">;

/** Asserts `pool` lists `remoteToken` / `remotePool` as the only remote for `remoteChainSelector`. */
export async function assertLinked(
  pool: TokenPoolContract,
  remoteChainSelector: bigint,
  remoteToken: Address,
  remotePool: Address,
): Promise<void> {
  const padded = (address: Address) => `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
  assert.ok(await pool.read.isSupportedChain([remoteChainSelector]));
  assert.equal(await pool.read.getRemoteToken([remoteChainSelector]), padded(remoteToken));
  assert.deepEqual(await pool.read.getRemotePools([remoteChainSelector]), [padded(remotePool)]);
}
