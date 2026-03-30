# WomenSupplyChain — Blockchain Solution for Women Empowerment in Semi-Urban Rwanda

A blockchain-based supply chain transparency system built on Ethereum, enabling women-led businesses in semi-urban Rwanda to register products, track supply chain stages, and receive direct payments without intermediaries.

---

## Deployed Contract

| Detail | Value |
|--------|-------|
| Network | Ethereum Sepolia Testnet |
| Contract Address | `0xAaB5646895d0F81dc45C0D6D8c3f9807db9F96D9` |
| Deployer | `0xfacaA0D21Df37D9f1D1bA28020631881ab027C42` |
| Etherscan | https://sepolia.etherscan.io/address/0xAaB5646895d0F81dc45C0D6D8c3f9807db9F96D9 |

---

## Project Structure

```
women-supply-chain/
├── contracts/
│   └── WomenSupplyChain.sol    # Main smart contract
├── scripts/
│   └── deploy.js               # Deployment script
├── test/
│   └── WomenSupplyChain.test.js # 23 test cases
├── hardhat.config.js            # Hardhat configuration
├── .env                         # Environment variables (never commit this)
└── package.json
```

---

## Prerequisites

- Node.js v18+
- npm
- MetaMask browser extension
- Git

---

## Installation

```bash
# Clone or create the project folder
mkdir women-supply-chain
cd women-supply-chain

# Install dependencies
npm init -y
npm install --save-dev hardhat@2.22.0
npm install --save-dev @nomicfoundation/hardhat-toolbox@5
npm install dotenv

# Initialize Hardhat
npx hardhat init
# Select: Create a JavaScript project
```

---

## Environment Setup

Create a `.env` file in the root folder:

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=YOUR_TEST_WALLET_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

> ⚠️ Never commit your `.env` file. Always use a test wallet with no real funds.

---

## Usage

### Compile
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Sepolia Testnet
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

---

## Smart Contract Features

- **Business Registration** — Women entrepreneurs register their business on-chain
- **Product Listing** — Register products with name, category, and price
- **Supply Chain Tracking** — Add journey stages (Harvested → Processed → Shipped)
- **Direct Purchase** — Buyers pay ETH directly to the producer wallet
- **Availability Control** — Owners can toggle product availability

---

## Test Results

```
23 passing (52s)

  Business Registration    ✔ 5 tests
  Product Registration     ✔ 5 tests
  Supply Chain Tracking    ✔ 5 tests
  Product Purchase         ✔ 5 tests
  Product Availability     ✔ 3 tests
```

---

## Tech Stack

- **Solidity** 0.8.19
- **Hardhat** 2.22.0
- **Chai** (testing)
- **Ethers.js**
- **dotenv**
- **Alchemy** (RPC provider)
- **MetaMask** (wallet)


