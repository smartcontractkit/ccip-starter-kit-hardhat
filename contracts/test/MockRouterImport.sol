// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// Forces Hardhat to compile MockCCIPRouter artifact required by test suite.
// Hardhat does not compile contracts inside node_modules by default,
// so without this import the artifact is never generated and tests fail
// with HH700: Artifact for contract MockCCIPRouter not found.
import "@chainlink/contracts-ccip/contracts/test/mocks/MockRouter.sol";
