// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Sender is Ownable {
    LinkTokenInterface private linkToken;
    IRouterClient private router;

    event ProposalSent(bytes32 indexed proposalId, uint64 indexed destinationChainSelector, bytes proposalData, uint256 fee);

    constructor(address _linkTokenAddress, address _routerAddress) {
        linkToken = LinkTokenInterface(_linkTokenAddress);
        router = IRouterClient(_routerAddress);
    }

    function sendProposal(uint64 destinationChainSelector, address receiver, bytes calldata data, uint256 gasLimit) external onlyOwner {
        // Construct the EVM2AnyMessage
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encodePacked(receiver),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0), // assuming no tokens are sent along with the proposal for simplicity
            extraArgs: abi.encode(Client.EVMExtraArgsV1({gasLimit: gasLimit})),
            feeToken: address(linkToken) // specifying LINK as the fee token
        });

        // Calculate the required LINK fee for sending the proposal
        uint256 fee = router.getFee(destinationChainSelector, message);

        // Ensure the contract has enough LINK to cover the fee
        require(linkToken.balanceOf(address(this)) >= fee, "Insufficient LINK balance to cover fee");

        // Approve the router to spend LINK for the fee
        require(linkToken.approve(address(router), fee), "LINK approval for fee failed");

        // Send the proposal across chains
        bytes32 messageId = router.ccipSend{value: fee}(destinationChainSelector, message);

        emit ProposalSent(messageId, destinationChainSelector, data, fee);
    }

    function depositLink(uint256 amount) external onlyOwner {
        require(linkToken.transferFrom(msg.sender, address(this), amount), "Failed to deposit LINK");
    }

    function withdrawLink(uint256 amount) external onlyOwner {
        require(linkToken.transfer(msg.sender, amount), "Failed to withdraw LINK");
    }
}
