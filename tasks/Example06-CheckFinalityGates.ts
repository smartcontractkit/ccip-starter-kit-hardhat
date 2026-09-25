/** Read-only FTF check for the standard token-only Example 06 transfer. */
import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { encodeAbiParameters, isAddress, parseAbi } from "viem";
import { encodeV3Basic } from "../scripts/CallEncodeExtraArgsOffchain.js";

export interface CheckFinalityArguments {
  sourceRouter: string;
  destinationChainSelector: bigint;
  tokenToSend: string;
  blockConfirmations: number;
}

const ZERO = "0x0000000000000000000000000000000000000000" as const;
// Solidity's type(IPoolV2).interfaceId excludes inherited IERC165 functions.
const IPool_V2_ID = "0x940a1542" as const;
const viewAbi = parseAbi([
  "function typeAndVersion() view returns (string)",
  "function supportsInterface(bytes4) view returns (bool)",
  "function getAllowedFinalityConfig() view returns (bytes4)",
  "function getOutboundImplementation(uint64, bytes) view returns (address)",
]);

function report(label: string, allowed: `0x${string}`, depth: number): void {
  const config = Number.parseInt(allowed.slice(2), 16);
  const minimum = config & 0xffff;
  console.log(`[GATE] ${label}: ${allowed}`);
  if (config === 0) console.log("       FTF disabled (full finality only).");
  else {
    console.log("       minimum block depth:", minimum);
    console.log("       wait-for-safe flag allowed:", (config & 0x10000) !== 0);
    if (minimum === 0 || depth < minimum) console.log("       WARNING: requested depth is not allowed here.");
  }
}

export default async function checkFinality(
  args: CheckFinalityArguments,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  if (!isAddress(args.sourceRouter) || args.sourceRouter.toLowerCase() === ZERO) throw new Error("sourceRouter must be a nonzero address");
  if (!isAddress(args.tokenToSend) || args.tokenToSend.toLowerCase() === ZERO) throw new Error("tokenToSend must be a nonzero address");
  if (args.destinationChainSelector <= 0n || args.destinationChainSelector > 18446744073709551615n) throw new Error("destinationChainSelector must be a uint64");
  if (!Number.isInteger(args.blockConfirmations) || args.blockConfirmations < 1 || args.blockConfirmations > 65535) throw new Error("blockConfirmations must be between 1 and 65535");

  const router = args.sourceRouter as `0x${string}`;
  const token = args.tokenToSend as `0x${string}`;
  const selector = args.destinationChainSelector;
  const connection = await hre.network.connect();
  const publicClient = await connection.viem.getPublicClient();
  const [routerArtifact, onRampArtifact] = await Promise.all([
    hre.artifacts.readArtifact("Router"), hre.artifacts.readArtifact("OnRamp"),
  ]);
  const onRamp = await publicClient.readContract({
    address: router, abi: routerArtifact.abi, functionName: "getOnRamp", args: [selector],
  }) as `0x${string}`;
  if (onRamp.toLowerCase() === ZERO) throw new Error("No OnRamp for this router and destination selector");
  const version = await publicClient.readContract({ address: onRamp, abi: viewAbi, functionName: "typeAndVersion" });
  console.log("[INFO] OnRamp:", onRamp, version);
  if (version !== "OnRamp 2.0.0") throw new Error("Expected a CCIP 2.0 router and OnRamp");

  const config = await publicClient.readContract({
    address: onRamp, abi: onRampArtifact.abi, functionName: "getDestChainConfig", args: [selector],
  }) as { defaultExecutor: `0x${string}`; laneMandatedCCVs: `0x${string}`[]; defaultCCVs: `0x${string}`[] };
  const pool = await publicClient.readContract({
    address: onRamp, abi: onRampArtifact.abi, functionName: "getPoolBySourceToken", args: [selector, token],
  }) as `0x${string}`;
  if (pool.toLowerCase() === ZERO) throw new Error("Token has no registered source pool on this lane");
  console.log("[GATE] Source token pool:", pool);
  let isV2 = false;
  try {
    isV2 = await publicClient.readContract({ address: pool, abi: viewAbi, functionName: "supportsInterface", args: [IPool_V2_ID] });
  } catch { /* older pools may not implement ERC165 */ }
  if (!isV2) console.log("       WARNING: pool is not IPoolV2. getFee may quote FTF, but ccipSend rejects it.");
  else {
    try {
      report("Pool allowed finality", await publicClient.readContract({ address: pool, abi: viewAbi, functionName: "getAllowedFinalityConfig" }), args.blockConfirmations);
    } catch { console.log("       WARNING: pool finality getter reverted; check this pool manually."); }
  }

  console.log("[GATE] Default executor:", config.defaultExecutor);
  try {
    report("Executor allowed finality", await publicClient.readContract({ address: config.defaultExecutor, abi: viewAbi, functionName: "getAllowedFinalityConfig" }), args.blockConfirmations);
  } catch { console.log("       WARNING: executor finality getter reverted; check it manually."); }

  for (const [label, ccvs] of [["lane-mandated CCV", config.laneMandatedCCVs], ["default CCV", config.defaultCCVs]] as const) {
    for (const ccv of ccvs) {
      let effective = ccv;
      let allowed: `0x${string}` | undefined;
      try { allowed = await publicClient.readContract({ address: ccv, abi: viewAbi, functionName: "getAllowedFinalityConfig" }); }
      catch {
        try {
          effective = await publicClient.readContract({ address: ccv, abi: viewAbi, functionName: "getOutboundImplementation", args: [selector, "0x"] });
          if (effective.toLowerCase() !== ZERO) allowed = await publicClient.readContract({ address: effective, abi: viewAbi, functionName: "getAllowedFinalityConfig" });
        } catch { /* custom verifier requires manual review */ }
      }
      console.log(`[GATE] ${label}: configured ${ccv}; effective ${effective}`);
      if (allowed) report("CCV allowed finality", allowed, args.blockConfirmations);
      else console.log("       WARNING: could not read finality config; check this CCV manually.");
    }
  }

  const receiver = encodeAbiParameters([{ type: "address" }], ["0x0000000000000000000000000000000000000B0B"]);
  const quote = async (depth: number): Promise<bigint> => {
    const message = {
      receiver,
      data: "0x" as const,
      tokenAmounts: [{ token, amount: 10n ** 18n }],
      extraArgs: await encodeV3Basic({ gasLimit: 0, blockConfirmations: depth }),
      feeToken: ZERO,
    };
    return await publicClient.readContract({ address: router, abi: routerArtifact.abi, functionName: "getFee", args: [selector, message] }) as bigint;
  };
  console.log("[FEE] Sample: 1e18 token units, EOA receiver, native fee, gas limit 0.");
  let fullFee: bigint | undefined;
  try { fullFee = await quote(0); console.log("[FEE] Full finality (wei):", fullFee.toString()); }
  catch { console.log("[FAIL] Full-finality sample quote reverted; check token registration and lane configuration."); }
  try {
    const fastFee = await quote(args.blockConfirmations);
    console.log("[FEE] Requested depth (wei):", fastFee.toString());
    if (fullFee !== undefined) console.log("[FEE] Sample premium (wei):", (fastFee - fullFee).toString());
  } catch { console.log("[FAIL] FTF sample quote reverted; review the gates above."); }
  console.log("[WARN] A fee quote does not prove ccipSend will succeed; review every gate above.");
}
