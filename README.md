# COSC480 Web3 Wallet — Hello World Smart Contract

A beginner-friendly smart contract deployed on the Ethereum Sepolia testnet as part of COSC480.

## Contract

- **Contract Address:** `0x85097694E2F5D92b5BE0798DC358E063710c4C0C`
- **Network:** Sepolia Testnet
- **Language:** Solidity `^0.8.0`
- **Verified on:** [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x85097694E2F5D92b5BE0798DC358E063710c4C0C)

---

## What is this project?

This project is an introduction to Web3 development. At its core, I wrote and deployed a smart contract — a program that lives on the Ethereum blockchain instead of a normal server.

Unlike code hosted on a company's server, a smart contract:
- Lives on the blockchain **forever** once deployed
- Cannot be taken down or changed by any single person
- Is publicly visible and interactable by anyone in the world
- Records every interaction permanently

This is the same foundational pattern used in NFTs, DeFi apps, and DAOs — just simplified down to its most basic form.

---

## What does the contract do?

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

---

## What did each tool do?

| Tool | Purpose |
|------|---------|
| **Solidity** | The programming language smart contracts are written in |
| **Hardhat** | Development environment that compiled and deployed the contract |
| **Alchemy** | Provided a connection to the Ethereum network without running a node |
| **MetaMask** | Crypto wallet that signed and paid for the deployment transaction |
| **Sepolia** | A test version of Ethereum so no real money was spent |
| **Etherscan** | Blockchain explorer to verify the contract was deployed successfully |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [MetaMask](https://metamask.io/)
- [Alchemy](https://www.alchemy.com/) account

### Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/DayanaFerrufino/COSC480-Web3Wallet.git
   cd COSC480-Web3Wallet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   API_URL="https://eth-sepolia.g.alchemy.com/v2/your-alchemy-api-key"
   PRIVATE_KEY="your-metamask-private-key"
   ```

### Compile

```bash
npx hardhat compile
```

### Deploy

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

---

## Project Structure

```
COSC480-Web3Wallet/
├── contracts/
│   └── HelloWorld.sol    # Smart contract
├── scripts/
│   └── deploy.js         # Deployment script
├── .env                  # Environment variables (not committed)
├── .gitignore
├── hardhat.config.ts     # Hardhat configuration
└── package.json
```
