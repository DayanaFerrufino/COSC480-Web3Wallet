# COSC480 Web3 Wallet — Hello World Smart Contract

A beginner-friendly smart contract deployed on the Ethereum Sepolia testnet as part of COSC480.

## Contract

- **Contract Address:** `0x85097694E2F5D92b5BE0798DC358E063710c4C0C`
- **Network:** Sepolia Testnet
- **Language:** Solidity `^0.8.0`
- **Verified on:** [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x85097694E2F5D92b5BE0798DC358E063710c4C0C)

## Tech Stack

- [Solidity](https://soliditylang.org/) — Smart contract language
- [Hardhat](https://hardhat.org/) — Ethereum development environment
- [Ethers.js](https://docs.ethers.org/) — Ethereum library
- [Alchemy](https://www.alchemy.com/) — Blockchain API provider
- [MetaMask](https://metamask.io/) — Ethereum wallet

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

## Contract Overview

The `HelloWorld` contract stores a message on the blockchain. It can be updated by calling the `update()` function, which also emits an event logging the old and new messages.

```solidity
contract HelloWorld {
    string public message;

    constructor(string memory initMessage) {
        message = initMessage;
    }

    function update(string memory newMessage) public {
        // updates the message on chain
    }
}
```
