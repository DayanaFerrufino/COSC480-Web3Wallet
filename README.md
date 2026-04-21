# Paid Billboard — COSC480 Web3 Capstone

A full-stack decentralized application (dApp) built on the Ethereum Sepolia testnet. Anyone can pay a small ETH fee to post a message on a public blockchain billboard. The message lives on-chain permanently, and the contract owner can withdraw the collected funds.

---

## Part 1 — Hello World Contract

A beginner-friendly smart contract deployed on the Ethereum Sepolia testnet as the starting point for this project.

| | |
|---|---|
| **Contract Address** | `0x85097694E2F5D92b5BE0798DC358E063710c4C0C` |
| **Network** | Sepolia Testnet |
| **Language** | Solidity `^0.8.0` |
| **Verified on** | [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x85097694E2F5D92b5BE0798DC358E063710c4C0C) |

### What is this project?

This project is an introduction to Web3 development. At its core, I wrote and deployed a smart contract — a program that lives on the Ethereum blockchain instead of a normal server.

Unlike code hosted on a company's server, a smart contract:
- Lives on the blockchain **forever** once deployed
- **Cannot be taken down** or changed by any single person
- Is **publicly visible** and interactable by anyone in the world
- **Records every interaction** permanently

This is the same foundational pattern used in NFTs, DeFi apps, and DAOs — just simplified down to its most basic form.

### What does the contract do?

The `HelloWorld` contract does two simple things:

1. **Stores a message on the blockchain** — when deployed, it saved "Hello World!" permanently on-chain
2. **Allows the message to be updated** — anyone can call the `update()` function to change the stored message, and every update is logged as an event on the blockchain

```solidity
contract HelloWorld {
    // Stores the message permanently on the blockchain
    string public message;

    // Runs once on deployment — sets the initial message
    constructor(string memory initMessage) {
        message = initMessage;
    }

    // Anyone can call this to update the message
    function update(string memory newMessage) public {
        string memory oldMsg = message;
        message = newMessage;
        emit UpdatedMessages(oldMsg, newMessage);
    }
}
```

### What did each tool do?

| Tool | Purpose |
|---|---|
| **Solidity** | The programming language smart contracts are written in |
| **Hardhat** | Development environment that compiled and deployed the contract |
| **Alchemy** | Provided a connection to the Ethereum network without running a node |
| **MetaMask** | Crypto wallet that signed and paid for the deployment transaction |
| **Sepolia** | A test version of Ethereum so no real money was spent |
| **Etherscan** | Blockchain explorer to verify the contract was deployed successfully |

---

## Part 2 — Paid Billboard dApp

---

## Live Contract

| | |
|---|---|
| **Contract Address** | `0x54BFd99AFCEEd6Ca573E65568Da2f0AF43e3729c` |
| **Network** | Sepolia Testnet |
| **Language** | Solidity `^0.8.0` |
| **Verified on** | [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x54BFd99AFCEEd6Ca573E65568Da2f0AF43e3729c) |

---

## What is this project?

This is a full-stack Web3 application — a smart contract on the Ethereum blockchain paired with a React frontend. Unlike traditional apps that store data on a company's server, this app stores its data directly on the blockchain.

That means:
- The billboard message is **publicly visible** to anyone in the world
- It **cannot be taken down** or secretly modified by any single person
- Every update is a **real financial transaction** recorded permanently on-chain
- The contract logic is **open and verifiable** by anyone

This is the same foundational pattern used in NFTs, DeFi protocols, and DAOs — applied to a simple, demonstrable use case.

---

## How it works

### The Smart Contract (`Billboard.sol`)

The contract stores a single public message on the Ethereum blockchain. To update it, users must pay a fee of **0.001 ETH**. Every payment goes into the contract's balance, which only the owner (the deployer) can withdraw.

```solidity
contract Billboard {
    string public message;       // The current billboard message
    address public lastSender;   // Who last paid to update it
    address public owner;        // The deployer — can withdraw funds
    uint256 public fee = 0.001 ether;

    // Pay the fee to set a new message
    function update(string memory newMessage) public payable {
        require(msg.value >= fee, "Must pay the fee");
        message = newMessage;
        lastSender = msg.sender;
    }

    // Owner only — collect the ETH
    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
}
```

### The Frontend (`frontend/`)

A React app that connects to the contract through MetaMask. It reads the current message directly from the blockchain and lets users pay to update it — no backend, no database, no server.

---

## Features

- **MetaMask wallet connect** — links your Ethereum account to the app
- **Live on-chain message** — always reads the real current state from the blockchain
- **Pay & Post** — sends a real transaction with 0.001 ETH to update the message
- **Transaction status** — shows pending and confirmed states with an Etherscan link
- **Owner panel** — visible only to the deployer, allows withdrawing collected ETH
- **Network detection** — warns if MetaMask is on the wrong network

---

## Tech Stack

| Layer | Tool | Purpose |
|---|---|---|
| Smart Contract | Solidity | Contract language |
| Development | Hardhat | Compile and deploy contracts |
| Blockchain Connection | Alchemy | Connect to Ethereum without running a node |
| Wallet | MetaMask | Sign transactions and authenticate users |
| Blockchain Library | ethers.js v6 | Talk to the contract from the frontend |
| Frontend | React + Vite | User interface |
| Testnet | Sepolia | Test version of Ethereum — no real money |
| Explorer | Etherscan | Verify and inspect on-chain transactions |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [MetaMask](https://metamask.io/) browser extension
- [Alchemy](https://www.alchemy.com/) account
- Some Sepolia testnet ETH (free from a [faucet](https://sepoliafaucet.com/))

### Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/DayanaFerrufino/COSC480-Web3Wallet.git
   cd COSC480-Web3Wallet
   ```

2. Install contract dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root:
   ```
   API_URL="https://eth-sepolia.g.alchemy.com/v2/your-alchemy-api-key"
   PRIVATE_KEY="your-metamask-private-key"
   ```

4. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Running the App

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Deploying a New Contract

From the project root:
```bash
npx hardhat compile
npx hardhat run scripts/deployBillboard.js --network sepolia
```

Paste the printed address into `frontend/src/App.jsx` as `CONTRACT_ADDRESS`.

---

## Project Structure

```
COSC480-Web3-Wallet/
├── contracts/
│   ├── HelloWorld.sol        # Original hello world contract
│   └── Billboard.sol         # Paid billboard contract
├── scripts/
│   ├── deploy.js             # Deploy HelloWorld
│   └── deployBillboard.js    # Deploy Billboard
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   └── App.css           # Styles
│   └── index.html
├── .env                      # Environment variables (not committed)
├── hardhat.config.ts
└── package.json
```
