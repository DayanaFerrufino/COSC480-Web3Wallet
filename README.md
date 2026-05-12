# TaskBounty

A decentralised task marketplace built on the Ethereum Sepolia testnet. Post tasks with ETH bounties locked in a smart contract, claim work, and get paid automatically on approval — no middleman required.

**Contract Address:** `0x8d8186d74F6ccB8533C4bBF9392De81E5554501C`  
**Network:** Ethereum Sepolia Testnet  
**Live Explorer:** [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x8d8186d74F6ccB8533C4bBF9392De81E5554501C)

---

## What is this?

TaskBounty is a full-stack dApp where:

- Anyone can **post a task** and lock ETH as a bounty
- Anyone can **claim a task** and do the work
- The worker **submits proof** of their work (a URL)
- The poster **approves** and the ETH goes straight to the worker's wallet
- Everything is enforced by a smart contract — no company, no trust required

---

## Tech Stack

| Layer | Tool |
|---|---|
| Smart Contract | Solidity |
| Contract Tooling | Hardhat |
| Blockchain RPC | Alchemy |
| Wallet | MetaMask |
| Blockchain Library | ethers.js v6 |
| Authentication | SIWE (Sign-In With Ethereum) |
| Auth Server | Express.js |
| Database + Realtime | Supabase |
| Frontend | React + Vite |
| Testnet | Ethereum Sepolia |

---

## Project Structure

```
COSC480-Web3-Wallet/
|-- contracts/
|   |-- HelloWorld.sol          # Part 1 starter contract
|   +-- TaskBounty.sol          # Main bounty contract
|-- scripts/
|   |-- deploy.js               # Deploy HelloWorld
|   +-- deployTaskBounty.js     # Deploy TaskBounty
|-- frontend/
|   |-- src/
|   |   |-- App.jsx             # Root component + contract interaction
|   |   |-- components/
|   |   |   +-- Nav.jsx         # Navigation bar
|   |   |-- pages/
|   |   |   |-- BrowsePage.jsx  # Task marketplace
|   |   |   |-- MyTasksPage.jsx # User dashboard
|   |   |   |-- MessagesPage.jsx# Real-time chat
|   |   |   +-- ProfilePage.jsx # Profile (placeholder)
|   |   |-- lib/
|   |   |   |-- auth.js         # SIWE sign-in logic
|   |   |   +-- supabase.js     # Supabase client
|   |   +-- styles/             # Modular CSS files
|   +-- vite.config.js
|-- server/
|   +-- server.js               # Express auth server
|-- hardhat.config.ts
|-- .env                        # Root env (not committed)
+-- package.json
```

---

## Prerequisites

- [Node.js](https://nodejs.org) v20+
- [MetaMask](https://metamask.io) browser extension
- [Alchemy](https://www.alchemy.com) account (free tier)
- [Supabase](https://supabase.com) project (free tier)
- Sepolia testnet ETH — free from [sepoliafaucet.com](https://sepoliafaucet.com)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/DayanaFerrufino/COSC480-Web3Wallet.git
cd COSC480-Web3Wallet
```

### 2. Install dependencies

```bash
# Root (Hardhat)
npm install

# Frontend
cd frontend && npm install && cd ..

# Auth server
cd server && npm install && cd ..
```

### 3. Create environment files

**Root `.env`**
```
API_URL="https://eth-sepolia.g.alchemy.com/v2/your-alchemy-key"
PRIVATE_KEY="your-metamask-private-key"
```

**`server/.env`**
```
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SECRET_KEY="your-supabase-service-role-key"
```

**`frontend/.env`**
```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

> Never commit `.env` files. They are already in `.gitignore`.

### 4. Set up Supabase tables

Run this in your Supabase SQL editor:

```sql
create table users (
  address text primary key,
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  task_id integer not null unique,
  poster_address text references users(address),
  worker_address text references users(address),
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  sender_address text references users(address),
  content text not null,
  created_at timestamptz default now()
);

alter publication supabase_realtime add table messages;
```

### 5. Run the app

**Terminal 1 — Auth server**
```bash
cd server
node server.js
# Running on http://localhost:3001
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser with MetaMask set to **Sepolia testnet**.

---

## Deploying a New Contract

```bash
npx hardhat compile
npx hardhat run scripts/deployTaskBounty.js --network sepolia
```

Copy the printed address and update `CONTRACT_ADDRESS` in `frontend/src/App.jsx`.

---

## How it Works

### Task Lifecycle

```
Open → Claimed → Submitted → Completed
Open → Cancelled (bounty refunded)
```

### Smart Contract Functions

| Function | Who | Description |
|---|---|---|
| `postTask(title, description)` | Anyone | Posts a task and locks ETH as bounty |
| `claimTask(taskId)` | Anyone | Claims an open task |
| `submitWork(taskId, proofUrl)` | Worker | Submits proof of work |
| `approveWork(taskId)` | Poster | Approves work and pays the worker |
| `cancelTask(taskId)` | Poster | Cancels an open task and refunds ETH |
| `getTask(taskId)` | Anyone | Returns full task details |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Yellow network warning | Switch MetaMask to Sepolia testnet |
| MetaMask not detected | Install the MetaMask browser extension |
| Transaction failing | Get more Sepolia ETH from the faucet |
| Sign-in failing | Make sure the auth server is running on port 3001 |
| Messages not loading | Check Supabase `.env` values and that tables exist |
| `VITE_` vars undefined | Restart `npm run dev` after editing `frontend/.env` |

---

## Built With

This project was built as the COSC480 Web3 Capstone. It demonstrates on-chain escrow, wallet-based authentication, and hybrid on-chain/off-chain data patterns used in real-world dApps.
