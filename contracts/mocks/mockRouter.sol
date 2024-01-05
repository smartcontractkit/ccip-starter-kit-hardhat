// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";


contract MockRouter {
//   error UnsupportedDestinationChain(uint64 destChainSelector);
//   error InsufficientFeeTokenAmount();
//   error InvalidMsgValue();

  /// @notice Checks if the given chain ID is supported for sending/receiving.
  /// @param chainSelector The chain to check.
  /// @return supported is true if it is supported, false if not.
  function isChainSupported(uint64 chainSelector) external view returns (bool supported){
    supported = true;
  }

  /// @notice Gets a list of all supported tokens which can be sent or received
  /// to/from a given chain id.
  /// @param chainSelector The chainSelector.
  /// @return tokens The addresses of all tokens that are supported.
  function getSupportedTokens(uint64 chainSelector) external view returns (address[] memory tokens){
    address[] memory addresses;
    addresses[0] = address(0);
    tokens = addresses;
  }

  /// @param destinationChainSelector The destination chainSelector
  /// @param message The cross-chain CCIP message including data and/or tokens
  /// @return fee returns guaranteed execution fee for the specified message
  /// delivery to destination chain
  /// @dev returns 0 fee on invalid message.
  function getFee(
    uint64 destinationChainSelector,
    Client.EVM2AnyMessage memory message
  ) external view returns (uint256 fee){
    return 0;
  }

  /// @notice Request a message to be sent to the destination chain
  /// @param destinationChainSelector The destination chain ID
  /// @param message The cross-chain CCIP message including data and/or tokens
  /// @return messageId The message ID
  /// @dev Note if msg.value is larger than the required fee (from getFee) we accept
  /// the overpayment with no refund.
  function ccipSend(
    uint64 destinationChainSelector,
    Client.EVM2AnyMessage calldata message
  ) external payable returns (bytes32){
    address targetAddress =bytesToAddress(message.receiver);

    if(message.tokenAmounts.length > 0){
        for(uint i = 0; i < message.tokenAmounts.length; i++){
            IERC20(message.tokenAmounts[i].token).transferFrom(msg.sender, targetAddress, message.tokenAmounts[i].amount);
        }
    }
    
    Client.Any2EVMMessage memory finalMessage;
    finalMessage.data = message.data; 
    finalMessage.destTokenAmounts = message.tokenAmounts; 
    finalMessage.sender = abi.encode(msg.sender); 

    (bool success, ) = targetAddress.call(
      abi.encodeWithSelector(this.ccipReceive.selector, finalMessage)
    ); // solhint-disable-line avoid-low-level-calls
    require(success, "mock router delegate call failed");
  }
  
  function getFunctionSelector() public pure returns (bytes4) {
        // Example function signature: function myFunction(uint256)
        // Calculate the function selector using keccak256 and take the first 4 bytes
        // return bytes4(keccak256("set(uint256)"));
        return bytes4(keccak256("ccipReceive((bytes,bytes,(address, uint256)[], address, bytes))"));
    }

     function ccipReceive(
        Client.Any2EVMMessage memory message
    ) public {}


  function bytesToAddress(bytes memory data) public pure returns (address) {
        // require(data.length == 20, "Invalid address length");

        // address result;
        // // Convert the first 20 bytes of the data to an address
        // assembly {
        //     result := mload(add(data, 20))
        // }

        // return result;
        return abi.decode(data, (address));
       
    }
}
