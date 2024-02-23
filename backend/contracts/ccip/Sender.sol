// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Sender is Ownable {


    error NotEnoughMoney(uint256 balance, uint256 fee);
    error DestinationChainNotAllowlisted(uint64 destinationChainSelector);

    error InvalidReceiverAddress(); // Used when the receiver address is 0.


    LinkTokenInterface private s_linkToken;
    IRouterClient private s_router;

    event ProposalSent(
        bytes32 indexed proposalId, 
        uint64 indexed destinationChainSelector, 
        address receiver,
        bool amount,
        address feeToken,
        uint256 fee 
        );

    mapping(uint64 => bool) public allowlistedChains;


    constructor(address _link, address _router) {
        s_linkToken = LinkTokenInterface(_link);
        s_router = IRouterClient(_router);
    }

    modifier onlyAllowlistedChain(uint64 _destinationChainSelector) {
        if (!allowlistedChains[_destinationChainSelector])
            revert DestinationChainNotAllowlisted(_destinationChainSelector);
        _;
    }

    modifier validateReceiver(address _receiver) {
        if (_receiver == address(0)) revert InvalidReceiverAddress();
        _;
    }


    function send_message (
        uint64 destinationChainSelector,
        address receiver,
        bool vote) external onlyOwner returns (bytes32 messageId) {

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encodePacked(receiver),
            data: abi.encode(vote),
            tokenAmounts: new Client.EVMTokenAmount[](0), // assuming no tokens are sent along with the proposal for simplicity
            extraArgs: abi.encode(Client.EVMExtraArgsV1({gasLimit: 100000})),
            feeToken: address(s_linkToken) // specifying LINK as the fee token
        });

    
        uint256 fees = s_router.getFee(
            destinationChainSelector,
            message
        );

        if(s_linkToken.balanceOf(address(this)) < fees) {
            revert NotEnoughMoney(s_linkToken.balanceOf(address(this)), fees);
        }


        messageId = s_router.ccipSend{value: fees}(
            destinationChainSelector,
            message
        );

        emit ProposalSent(
            messageId,
            destinationChainSelector,
            receiver,
            vote,
            address(s_linkToken),
            fees
        );

        require(allowlistedChains[destinationChainSelector], "Destination chain not allowlisted");
        return messageId;

    }


}
