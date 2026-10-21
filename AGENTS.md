# AGENTS.md

Guidance for AI coding agents and contributors working in this repo.

## What this repo is

Chainlink CCIP Starter Kit V2 (Hardhat 3): community example code for learning CCIP 2.0 — Hardhat tasks, Ignition
modules, small sender/receiver contracts, SDK demos, and an mdBook tutorial. It is **example code, not audited, not for
production**. Keep the disclaimer headers on example contracts and tasks.

## Layout

- `tasks/`: CCIP 2.0 example tasks (`Example01`–`Example08`) and `Legacy01`–`Legacy02`, plus helpers in `tasks/helpers/`.
  Task definitions are in `tasks/hardhat.tasks.ts`. Core learning path.
- `scripts/CallEncodeExtraArgsOffchain.ts`: ExtraArgs V1/V2/V3 encoding helper used by the tasks.
- `contracts/`: `BasicMessageSender`, `BasicMessageReceiver`, `BasicMessageReceiverWithCCVs`, `utils/Withdraw`,
  `utils/EncodeExtraArgsOffchain`.
- `ignition/`: Ignition modules and per-chain parameter files.
- `test/`: Node.js tests on the Chainlink Local V3 no-fork simulator (see below).
- `book/src/`: mdBook chapters, one per example. Build output (`book/book`) is gitignored.
- `sdk-examples/`: TypeScript CCIP SDK demos (Node >= 24), separate from the Hardhat project.

## Commands

```bash
npm install
npx hardhat build
npx hardhat test nodejs     # Chainlink Local tests, no RPC needed
npx tsc --noEmit            # typecheck tasks and tests
mdbook serve book --open    # preview the book
```

Tasks that talk to a live network need keystore values: `npx hardhat keystore set SEPOLIA_RPC_URL` and so on (see
`README.md`). Never commit private keys or RPC URLs.

## Toolchain and dependency pins

- `solc 0.8.26`, `evmVersion = cancun` (set in `hardhat.config.ts`; CCIP 2.0 contracts need Cancun opcodes).
- `@chainlink/contracts-ccip` = `2.0.0`, `@chainlink/contracts` = `1.5.0`, `@chainlink/local` = `0.3.1`
  (Chainlink Local V3). Local 0.3.x pins the first two exactly, so bump them together.
- Contracts from npm packages are only compiled if listed in `solidity.npmFilesToBuild` in `hardhat.config.ts`
  (this includes the Chainlink Local simulator, router, LINK and BnM helpers the tests deploy).

## Tests (Chainlink Local V3)

- Shared setup: `test/utils/localSimulator.ts` deploys `CCIPLocalSimulator` and exposes the router, LINK and BnM.
  `test/utils/reverts.ts` decodes revert data so tests assert the exact custom error and arguments.
- `Example01–05.test.ts` call the real task actions rather than copies of their logic, so task regressions fail tests.
  Tasks open their own connection with `hre.network.connect()`, so the tests pass `taskHre`, an hre whose `connect()`
  returns the test's connection. The task sender is the first Hardhat wallet (`broadcaster`).
- The local router charges only what `router.setFee(...)` sets, defaults to 0, and uses a mock message ID, so the
  `CCIPMessageSent` event the tasks look for is never emitted locally.
- Local mode is single-chain with no token pools, no CCV verifiers (so no quorum check), and no executor or manual
  execution. It does enforce the CCIP 2.0 finality rules, one token per message, and receiver CCV config validation.
  Do not assert behavior Local does not model; note the limitation in the test instead.
- Prefer asserting a specific custom error (`expectRevertWithError`) over a bare revert.

## Working rules

- Keep changes scoped. Example tasks and contracts mirror the book chapters: if you change one, update the other.
- Do not remove or soften the example/audit disclaimers.
- Generated or local-only files stay untracked: `.env`, `artifacts/`, `cache/`, `ignition/deployments/`, `book/book`,
  `node_modules/`.
