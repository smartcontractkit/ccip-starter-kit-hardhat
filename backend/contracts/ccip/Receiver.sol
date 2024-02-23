// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Receiver {
    // Event to log received Ether with sender and amount
    event Received(address indexed sender, uint amount);

    // The owner of the contract
    address public owner;

    // Modifier to restrict certain functions to only the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _; 
    }

    // Constructor sets the initial owner of the contract
    constructor() {
        owner = msg.sender;
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    // Fallback function is called when msg.data is not empty
    fallback() external payable {
        emit Received(msg.sender, msg.value);
    }

    // Function to withdraw the contract's Ether balance to a specified address
    function withdraw(address payable _to, uint _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        _to.transfer(_amount);
    }

    // Function to check the contract's Ether balance
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    // Allow the owner to transfer contract ownership
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        owner = newOwner;
    }
}
