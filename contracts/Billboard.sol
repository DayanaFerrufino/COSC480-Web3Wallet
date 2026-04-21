// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Billboard {
    event MessageUpdated(address indexed sender, string oldMessage, string newMessage, uint256 paid);

    string public message;
    address public lastSender;
    address public owner;
    uint256 public fee = 0.001 ether;

    constructor(string memory initMessage) {
        message = initMessage;
        owner = msg.sender;
        lastSender = msg.sender;
    }

    // Pay the fee to update the billboard message
    function update(string memory newMessage) public payable {
        require(msg.value >= fee, "Must pay the fee to update the message");
        string memory oldMsg = message;
        message = newMessage;
        lastSender = msg.sender;
        emit MessageUpdated(msg.sender, oldMsg, newMessage, msg.value);
    }

    // Owner can change the fee
    function setFee(uint256 newFee) public {
        require(msg.sender == owner, "Only owner can change the fee");
        fee = newFee;
    }

    // Owner can withdraw collected ETH
    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }

    // Check contract balance
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
