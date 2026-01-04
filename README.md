# Base Swap DEX

A decentralized exchange (DEX) built on Base mainnet that enables seamless swaps between ETH, USDC, USDT, and TALENT tokens using Uniswap V2/V3 with automatic best-route selection.

## Features

- Swap between ETH, USDC, USDT, and TALENT
- Automatic routing through Uniswap V2 and V3 for best prices
- 3% protocol fee
- WalletConnect integration (MetaMask, Coinbase Wallet, etc.)
- Real-time price quotes and slippage protection
- Responsive design for mobile and desktop
- Built with Next.js and shadcn/ui

## Tech Stack

**Smart Contracts:**
- Solidity ^0.8.20
- OpenZeppelin Contracts
- Hardhat
- Uniswap V2/V3 Integration

**Frontend:**
- Next.js 14
- React
- TailwindCSS
- shadcn/ui
- Wagmi v2
- RainbowKit
- Lucide Icons

## Project Structure

```
base-dex/
├── contracts/               # Smart contracts
│   └── BaseSwapDEX.sol
├── scripts/                 # Deployment scripts
│   └── deploy.js
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── config/         # Contract ABIs and config
│   │   ├── pages/          # Next.js pages
│   │   └── styles/         # Global styles
│   └── public/             # Static assets
├── hardhat.config.js       # Hardhat configuration
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- MetaMask or compatible Web3 wallet
- Base mainnet ETH for deployment

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd base-dex

# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 2. Configure Environment Variables

**For Contracts (.env):**
```bash
cp .env.example .env
```

Edit `.env` and add:
```
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your_deployer_private_key
BASESCAN_API_KEY=your_basescan_api_key
FEE_RECIPIENT=0x1b2823e60859cd6476978464d7b3c951b5fcf843
```

**For Frontend (frontend/.env.local):**
```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local` and add:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
```

Get WalletConnect Project ID: https://cloud.walletconnect.com

### 3. Deploy Smart Contract

```bash
# Compile contracts
npm run compile

# Deploy to Base mainnet
npm run deploy:base

# Or deploy to Base Sepolia testnet first
npm run deploy:testnet
```

After deployment:
1. Note the contract address from the console
2. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `frontend/.env.local`
3. Update `CONTRACT_ADDRESS` in `frontend/src/config/contracts.js`

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

## Smart Contract Details

**Contract Address (Base Sepolia Testnet):** `0xfa67548E95E46D180D08768dc7972F043C617663`
**Contract Address (Base Mainnet):** [Deploy using `npm run deploy:base`]

**Supported Tokens on Base (9 tokens):**
- ETH (Native)
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Circle native)
- USDT: `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` (Bridged)
- DAI: `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb`
- cbBTC: `0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf` (Coinbase Wrapped BTC)
- AERO: `0x940181a94A35A4569E4529A3CDfB74e38FD98631` (Aerodrome)
- DEGEN: `0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed`
- BRETT: `0x532f27101965dd16442E59d40670FaF5eBB142E4`
- TALENT: `0x9a33406165f562E16C3abD82fd1185482E01b49a` (Talent Protocol)

**Router Integration (verified from official Uniswap docs):**
- Uniswap V3 SwapRouter02: `0x2626664c2603336E57B271c5C0b26F421741e481`
- Uniswap V3 QuoterV2: `0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a`
- Uniswap V2 Router: `0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24`

## Usage

### For Users

1. Connect your wallet using WalletConnect
2. Select tokens to swap
3. Enter amount
4. Review swap details (rate, fees, price impact)
5. Approve token (if not ETH)
6. Execute swap

### Key Functions

**swapETHToToken:**
```solidity
function swapETHToToken(
    address _tokenOut,
    uint256 _minAmountOut,
    uint8 _preferredVersion
) external payable
```

**swapTokenToETH:**
```solidity
function swapTokenToETH(
    address _tokenIn,
    uint256 _amountIn,
    uint256 _minAmountOut,
    uint8 _preferredVersion
) external
```

**swapTokenToToken:**
```solidity
function swapTokenToToken(
    address _tokenIn,
    address _tokenOut,
    uint256 _amountIn,
    uint256 _minAmountOut,
    uint8 _preferredVersion
) external
```

## Configuration

### Slippage Tolerance
Default: 0.5%
Adjustable in UI settings (0.5%, 1%, 2%, or custom)

### Protocol Fee
Fixed at 3% (300 basis points)
Fee recipient: `0x1b2823e60859cd6476978464d7b3c951b5fcf843`

### Router Version Selection
- Auto (0): Automatically selects best route
- V2 (2): Forces Uniswap V2 routing
- V3 (3): Forces Uniswap V3 routing

## Security Features

- ReentrancyGuard on all swap functions
- Ownable for admin functions
- Slippage protection
- Deadline protection (5 minutes)
- Emergency withdraw function

## Development

### Testing
```bash
npm run test
```

### Compile Contracts
```bash
npm run compile
```

### Verify Contract
```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> <FEE_RECIPIENT>
```

## Deployment Checklist

- [ ] Update `.env` with private key and API keys
- [ ] Compile contracts
- [ ] Deploy to testnet first
- [ ] Test all swap functions
- [ ] Deploy to mainnet
- [ ] Verify contract on BaseScan
- [ ] Update frontend contract address
- [ ] Test frontend with real wallet
- [ ] Add liquidity to pools (if needed)

## Troubleshooting

**"Transaction failed"**
- Check slippage tolerance
- Ensure sufficient gas
- Verify token approval

**"Insufficient liquidity"**
- Pool may not have enough liquidity
- Try smaller amount
- Check Uniswap directly

**"Cannot read properties of undefined"**
- Ensure wallet is connected
- Check network (must be Base mainnet)

## Resources

- [Base Documentation](https://docs.base.org)
- [Uniswap V3 Docs](https://docs.uniswap.org/protocol/reference/deployments)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Documentation](https://www.rainbowkit.com)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

For issues or questions, please open a GitHub issue.