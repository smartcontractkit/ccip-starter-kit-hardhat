import { task } from "hardhat/config";
import { ArgumentType } from "hardhat/types/arguments";

const example01Task = task(
  "example01",
  "CCIP send with V3 extraArgs (quote fee, approve token, ccipSend)."
)
  .addOption({
    name: "sourceRouter",
    description: "CCIP Router address on source chain",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "destinationChainSelector",
    description: "Destination chain selector (uint64)",
    type: ArgumentType.BIGINT,
    defaultValue: 0n,
  })
  .addOption({
    name: "receiver",
    description: "Receiver address (abi.encode(receiver) in message)",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "tokenToSend",
    description: "ERC20 token address to send",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "amount",
    description: "Token amount in wei",
    type: ArgumentType.BIGINT,
    defaultValue: 0n,
  })
  .addOption({
    name: "gasLimit",
    description: "Gas limit for destination execution",
    type: ArgumentType.INT,
    defaultValue: 200000,
  })
  .addOption({
    name: "blockConfirmations",
    description: "Block confirmations (V3 extraArgs)",
    type: ArgumentType.INT,
    defaultValue: 1,
  })
  .addOption({
    name: "feeTokenAddress",
    description: "Fee token address (0x0 = native)",
    type: ArgumentType.STRING,
    defaultValue: "0x0000000000000000000000000000000000000000",
  })
  .setAction(() => import("./Example01.js"))
  .build();

const example02Task = task("example02", "Message-only CCIP send (no tokens).")
  .addOption({ name: "sourceRouter", type: ArgumentType.STRING, description: "CCIP Router", defaultValue: "" })
  .addOption({ name: "destinationChainSelector", type: ArgumentType.BIGINT, description: "Dest chain selector", defaultValue: 0n })
  .addOption({ name: "receiver", type: ArgumentType.STRING, description: "Receiver", defaultValue: "" })
  .addOption({ name: "messageText", type: ArgumentType.STRING, description: "Message string", defaultValue: "" })
  .addOption({ name: "gasLimit", type: ArgumentType.INT, description: "Gas limit", defaultValue: 200000 })
  .addOption({ name: "blockConfirmations", type: ArgumentType.INT, description: "Block confirmations", defaultValue: 1 })
  .addOption({ name: "feeTokenAddress", type: ArgumentType.STRING, description: "Fee token (0x0 = native)", defaultValue: "0x0000000000000000000000000000000000000000" })
  .setAction(() => import("./Example02.js"))
  .build();

const example03Task = task("example03", "CCIP send with message + token.")
  .addOption({ name: "sourceRouter", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "destinationChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "receiver", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "messageText", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "tokenToSend", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "amount", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "gasLimit", type: ArgumentType.INT, defaultValue: 200000 })
  .addOption({ name: "blockConfirmations", type: ArgumentType.INT, defaultValue: 1 })
  .addOption({ name: "feeTokenAddress", type: ArgumentType.STRING, defaultValue: "0x0000000000000000000000000000000000000000" })
  .setAction(() => import("./Example03.js"))
  .build();

const example04Task = task("example04", "CCIP send via BasicMessageSender.")
  .addOption({ name: "basicMessageSender", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "sourceRouter", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "destinationChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "receiver", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "messageText", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "tokenToSend", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "amount", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "gasLimit", type: ArgumentType.INT, defaultValue: 200000 })
  .addOption({ name: "blockConfirmations", type: ArgumentType.INT, defaultValue: 1 })
  .addOption({ name: "feeTokenAddress", type: ArgumentType.STRING, defaultValue: "0x0000000000000000000000000000000000000000" })
  .setAction(() => import("./Example04.js"))
  .build();

const example05Task = task("example05", "CCIP send with NO_EXECUTION_ADDRESS (message only).")
  .addOption({ name: "sourceRouter", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "destinationChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "receiver", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "messageText", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "gasLimit", type: ArgumentType.INT, defaultValue: 200000 })
  .addOption({ name: "blockConfirmations", type: ArgumentType.INT, defaultValue: 1 })
  .addOption({ name: "feeTokenAddress", type: ArgumentType.STRING, defaultValue: "0x0000000000000000000000000000000000000000" })
  .setAction(() => import("./Example05.js"))
  .build();

const example06Step1Task = task("example06-step1", "Example06 (CCT 01): Configure BurnMint pool remote lane.")
  .addOption({ name: "localPool", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "remoteChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "remoteToken", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "remotePool", type: ArgumentType.STRING, defaultValue: "" })
  .setAction(() => import("./Example06-Step1.js"))
  .build();

const example06Step2Task = task("example06-step2", "CCIP token transfer (Example06-Step2).")
  .addOption({ name: "sourceRouter", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "destinationChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "receiver", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "tokenToSend", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "amount", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "gasLimit", type: ArgumentType.INT, defaultValue: 200000 })
  .addOption({ name: "blockConfirmations", type: ArgumentType.INT, defaultValue: 0 })
  .addOption({ name: "feeTokenAddress", type: ArgumentType.STRING, defaultValue: "0x0000000000000000000000000000000000000000" })
  .setAction(() => import("./Example06-Step2.js"))
  .build();

const example07Step1Task = task("example07-step1", "Example07 (CCT 02): Configure LockRelease pool remote lane.")
  .addOption({ name: "localPool", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "remoteChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "remoteToken", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "remotePool", type: ArgumentType.STRING, defaultValue: "" })
  .setAction(() => import("./Example07-Step1.js"))
  .build();

const example07Step2Task = task("example07-step2", "Example07 (CCT 02): Fund lock box liquidity.")
  .addOption({ name: "token", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "lockBox", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "amount", type: ArgumentType.BIGINT, defaultValue: 0n })
  .setAction(() => import("./Example07-Step2.js"))
  .build();

const example07Step3Task = task("example07-step3", "Example07-Step3: CCIP token transfer.")
  .addOption({ name: "sourceRouter", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "destinationChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "receiver", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "tokenToSend", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "amount", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "gasLimit", type: ArgumentType.INT, defaultValue: 200000 })
  .addOption({ name: "blockConfirmations", type: ArgumentType.INT, defaultValue: 0 })
  .addOption({ name: "feeTokenAddress", type: ArgumentType.STRING, defaultValue: "0x0000000000000000000000000000000000000000" })
  .setAction(() => import("./Example07-Step3.js"))
  .build();

const example08Step1Task = task("example08-step1", "Example08 (CCT 03): Configure BurnMint pool remote lane.")
  .addOption({ name: "localPool", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "remoteChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "remoteToken", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "remotePool", type: ArgumentType.STRING, defaultValue: "" })
  .setAction(() => import("./Example08-Step1.js"))
  .build();

const example08Step2Task = task("example08-step2", "Example08-Step2: CCIP token transfer.")
  .addOption({ name: "sourceRouter", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "destinationChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "receiver", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "tokenToSend", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "amount", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "gasLimit", type: ArgumentType.INT, defaultValue: 200000 })
  .addOption({ name: "blockConfirmations", type: ArgumentType.INT, defaultValue: 0 })
  .addOption({ name: "feeTokenAddress", type: ArgumentType.STRING, defaultValue: "0x0000000000000000000000000000000000000000" })
  .setAction(() => import("./Example08-Step2.js"))
  .build();

const example08Step3Task = task("example08-step3", "Example08 (CCT 03): Update AdvancedPoolHooks allowlist.")
  .addOption({ name: "advancedPoolHook", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "removes", type: ArgumentType.STRING, description: "Comma-separated addresses to remove", defaultValue: "" })
  .addOption({ name: "adds", type: ArgumentType.STRING, description: "Comma-separated addresses to add", defaultValue: "" })
  .setAction(() => import("./Example08-Step3.js"))
  .build();

const getAllowListTask = task(
  "get-allow-list",
  "Read AdvancedPoolHooks.getAllowList() (address[])."
)
  .addOption({
    name: "advancedPoolHook",
    description: "AdvancedPoolHooks contract address",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .setAction(() => import("./helpers/GetAllowList.js"))
  .build();

const faucetTask = task(
  "faucet",
  "Mint 1 CCIP-BnM token to signer via drip(to) on the token contract."
)
  .addOption({
    name: "ccipBnm",
    description: "CCIP-BnM token address (BurnMint ERC20 with drip)",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .setAction(() => import("./helpers/Faucet.js"))
  .build();

const executorAllowedFinalityConfigTask = task(
  "executor-allowed-finality-config",
  "Read Executor.getAllowedFinalityConfig() (bytes4, FinalityCodec). Use when aligning FTF with executor policy."
)
  .addOption({
    name: "executor",
    description: "Executor contract address",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .setAction(() => import("./helpers/ExecutorAllowedFinalityConfig.js"))
  .build();

const setBasicMessageReceiverWithCCVsMinBlockDepthTask = task(
  "set-basic-message-receiver-with-ccvs-min-block-depth",
  "Set BasicMessageReceiverWithCCVs.setMinBlockDepth for a source chain (run on destination network)."
)
  .addOption({
    name: "receiver",
    description: "Deployed BasicMessageReceiverWithCCVs address",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "sourceChainSelector",
    description: "Source chain selector (uint64)",
    type: ArgumentType.BIGINT,
    defaultValue: 0n,
  })
  .addOption({
    name: "minBlockDepth",
    description: "Minimum block depth (uint16); 0 = default finality only for that source",
    type: ArgumentType.INT,
    defaultValue: 0,
  })
  .setAction(() => import("./helpers/SetBasicMessageReceiverWithCCVsMinBlockDepth.js"))
  .build();

const basicMessageReceiverLatestMessageTask = task(
  "basic-message-receiver-latest-message",
  "Read BasicMessageReceiver.latestMessage() (bytes). Decodes to string when possible."
)
  .addOption({
    name: "basicMessageReceiver",
    description: "Deployed BasicMessageReceiver contract address",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .setAction(() => import("./helpers/BasicMessageReceiverLatestMessage.js"))
  .build();

const basicMessageReceiverLatestSenderTask = task(
  "basic-message-receiver-latest-sender",
  "Read BasicMessageReceiver.latestSender() (address)."
)
  .addOption({
    name: "basicMessageReceiver",
    description: "Deployed BasicMessageReceiver contract address",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .setAction(() => import("./helpers/BasicMessageReceiverLatestSender.js"))
  .build();

const basicMessageReceiverLatestSourceChainSelectorTask = task(
  "basic-message-receiver-latest-source-chain-selector",
  "Read BasicMessageReceiver.latestSourceChainSelector() (uint64)."
)
  .addOption({
    name: "basicMessageReceiver",
    description: "Deployed BasicMessageReceiver contract address",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .setAction(() => import("./helpers/BasicMessageReceiverLatestSourceChainSelector.js"))
  .build();

const tokenAdminRegistryGetPoolTask = task(
  "token-admin-registry-get-pool",
  "Read ITokenAdminRegistry.getPool(address)(address)."
)
  .addOption({ name: "registry", description: "Token admin registry address", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "token", description: "Token address", type: ArgumentType.STRING, defaultValue: "" })
  .setAction(() => import("./helpers/TokenAdminRegistryGetPool.js"))
  .build();

const poolGetRemoteTokenTask = task(
  "pool-get-remote-token",
  "Read BurnMintTokenPool.getRemoteToken(uint64)(bytes); decodes to address."
)
  .addOption({ name: "pool", description: "Pool (BurnMintTokenPool) address", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "chainSelector", description: "Remote chain selector (uint64)", type: ArgumentType.BIGINT, defaultValue: 0n })
  .setAction(() => import("./helpers/PoolGetRemoteToken.js"))
  .build();

const poolGetRemotePoolsTask = task(
  "pool-get-remote-pools",
  "Read BurnMintTokenPool.getRemotePools(uint64)(bytes[]); decodes each to address."
)
  .addOption({ name: "pool", description: "Pool (BurnMintTokenPool) address", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "chainSelector", description: "Remote chain selector (uint64)", type: ArgumentType.BIGINT, defaultValue: 0n })
  .setAction(() => import("./helpers/PoolGetRemotePools.js"))
  .build();

const erc20BalanceOfTask = task(
  "erc20-balance-of",
  "Read ERC20.balanceOf(address)(uint256)."
)
  .addOption({ name: "token", description: "ERC20 token address", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "account", description: "Account address", type: ArgumentType.STRING, defaultValue: "" })
  .setAction(() => import("./helpers/Erc20BalanceOf.js"))
  .build();

const erc20TotalSupplyTask = task(
  "erc20-total-supply",
  "Read ERC20.totalSupply()(uint256)."
)
  .addOption({ name: "token", description: "ERC20 token address", type: ArgumentType.STRING, defaultValue: "" })
  .setAction(() => import("./helpers/Erc20TotalSupply.js"))
  .build();

const legacy01Task = task("legacy01", "Legacy01: ExtraArgs V1 token transfer.")
  .addOption({ name: "sourceRouter", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "destinationChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "receiver", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "tokenToSend", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "amount", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "gasLimit", type: ArgumentType.INT, defaultValue: 200000 })
  .addOption({ name: "feeTokenAddress", type: ArgumentType.STRING, defaultValue: "0x0000000000000000000000000000000000000000" })
  .setAction(() => import("./Legacy01.js"))
  .build();

const legacy02Task = task("legacy02", "Legacy02: ExtraArgs V2 token transfer.")
  .addOption({ name: "sourceRouter", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "destinationChainSelector", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "receiver", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "tokenToSend", type: ArgumentType.STRING, defaultValue: "" })
  .addOption({ name: "amount", type: ArgumentType.BIGINT, defaultValue: 0n })
  .addOption({ name: "gasLimit", type: ArgumentType.INT, defaultValue: 200000 })
  .addOption({ name: "allowOutOfOrderExecution", type: ArgumentType.BOOLEAN, defaultValue: false })
  .addOption({ name: "feeTokenAddress", type: ArgumentType.STRING, defaultValue: "0x0000000000000000000000000000000000000000" })
  .setAction(() => import("./Legacy02.js"))
  .build();

/** All Hardhat tasks. Import this array in hardhat.config.ts. */
export const tasks = [
  faucetTask,
  executorAllowedFinalityConfigTask,
  setBasicMessageReceiverWithCCVsMinBlockDepthTask,
  basicMessageReceiverLatestMessageTask,
  basicMessageReceiverLatestSenderTask,
  basicMessageReceiverLatestSourceChainSelectorTask,
  tokenAdminRegistryGetPoolTask,
  poolGetRemoteTokenTask,
  poolGetRemotePoolsTask,
  erc20BalanceOfTask,
  erc20TotalSupplyTask,
  getAllowListTask,
  example01Task,
  example02Task,
  example03Task,
  example04Task,
  example05Task,
  example06Step1Task,
  example06Step2Task,
  example07Step1Task,
  example07Step2Task,
  example07Step3Task,
  example08Step1Task,
  example08Step2Task,
  example08Step3Task,
  legacy01Task,
  legacy02Task,
];
