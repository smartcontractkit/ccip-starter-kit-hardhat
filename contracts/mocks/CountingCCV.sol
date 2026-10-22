// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ICrossChainVerifierResolver} from "@chainlink/contracts-ccip/contracts/interfaces/ICrossChainVerifierResolver.sol";
import {ICrossChainVerifierV1} from "@chainlink/contracts-ccip/contracts/interfaces/ICrossChainVerifierV1.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {MessageV1Codec} from "@chainlink/contracts-ccip/contracts/libraries/MessageV1Codec.sol";

import {IERC165} from "@openzeppelin/contracts@5.3.0/utils/introspection/IERC165.sol";

/**
 * THIS IS A TEST DOUBLE FOR THE FORK TESTS IN test-fork/. IT PERFORMS NO VERIFICATION.
 * DO NOT DEPLOY IT TO A LIVE NETWORK.
 */

/// @notice Fork-test double for a pool-required CCV: a no-op verifier with call counters.
/// @dev The fork tests copy its runtime code to the same address on both forks, which is what a pool-required CCV
///      needs: the source OnRamp consults it outbound and the destination OffRamp resolves `getInboundImplementation`
///      on the same address. The counters (one set per chain) prove both sides actually consulted it.
contract CountingCCV is ICrossChainVerifierV1, ICrossChainVerifierResolver {
    uint256 public outboundConsultations;
    uint256 public inboundVerifications;

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(ICrossChainVerifierV1).interfaceId
            || interfaceId == type(ICrossChainVerifierResolver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    function getFee(uint64, Client.EVM2AnyMessage memory, bytes memory, bytes4)
        external
        pure
        override
        returns (uint16 feeUSDCents, uint32 gasForVerification, uint32 payloadSizeBytes)
    {
        return (0, 0, 0);
    }

    function forwardToVerifier(MessageV1Codec.MessageV1 calldata, bytes32, address, uint256, bytes calldata)
        external
        override
        returns (bytes memory verifierData)
    {
        ++outboundConsultations;
        return "";
    }

    function verifyMessage(MessageV1Codec.MessageV1 memory, bytes32, bytes memory) external override {
        ++inboundVerifications;
    }

    function getStorageLocations() external pure override returns (string[] memory storageLocations) {
        storageLocations = new string[](1);
        storageLocations[0] = "mock://ccv";
    }

    function getInboundImplementation(bytes calldata) external view override returns (address) {
        return address(this);
    }

    function getOutboundImplementation(uint64, bytes memory) external view override returns (address) {
        return address(this);
    }
}
