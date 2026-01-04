export const CONTRACT_ADDRESS = "0x523Bb25796113b47aA80074843713F34D7eFe651";

export const TOKENS = {
  ETH: {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
  },
  USDC: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "https://assets.coingecko.com/coins/images/6319/small/usdc.png"
  },
  USDT: {
    address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    symbol: "USDT",
    name: "Tether USD (Bridged)",
    decimals: 6,
    logo: "https://assets.coingecko.com/coins/images/325/small/Tether.png"
  },
  DAI: {
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    logo: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png"
  },
  cbBTC: {
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    symbol: "cbBTC",
    name: "Coinbase Wrapped BTC",
    decimals: 8,
    logo: "https://assets.coingecko.com/coins/images/40143/small/cbbtc.webp"
  },
  AERO: {
    address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
    symbol: "AERO",
    name: "Aerodrome",
    decimals: 18,
    logo: "https://assets.coingecko.com/coins/images/31745/small/token.png"
  },
  DEGEN: {
    address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
    symbol: "DEGEN",
    name: "Degen",
    decimals: 18,
    logo: "https://assets.coingecko.com/coins/images/34515/small/android-chrome-512x512.png"
  },
  BRETT: {
    address: "0x532f27101965dd16442E59d40670FaF5eBB142E4",
    symbol: "BRETT",
    name: "Brett",
    decimals: 18,
    logo: "https://assets.coingecko.com/coins/images/35529/small/brett-2.png"
  },
  TALENT: {
    address: "0x9a33406165f562E16C3abD82fd1185482E01b49a",
    symbol: "TALENT",
    name: "Talent Protocol",
    decimals: 18,
    logo: "https://assets.coingecko.com/coins/images/35508/small/talent.jpg"
  }
};

export const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

export const BASE_SWAP_ABI = [
  {
    name: "swapETHToToken",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_tokenOut", type: "address" },
      { name: "_minAmountOut", type: "uint256" },
      { name: "_preferredVersion", type: "uint8" }
    ],
    outputs: [{ name: "amountOut", type: "uint256" }]
  },
  {
    name: "swapTokenToETH",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_tokenIn", type: "address" },
      { name: "_amountIn", type: "uint256" },
      { name: "_minAmountOut", type: "uint256" },
      { name: "_preferredVersion", type: "uint8" }
    ],
    outputs: [{ name: "amountOut", type: "uint256" }]
  },
  {
    name: "swapTokenToToken",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_tokenIn", type: "address" },
      { name: "_tokenOut", type: "address" },
      { name: "_amountIn", type: "uint256" },
      { name: "_minAmountOut", type: "uint256" },
      { name: "_preferredVersion", type: "uint8" }
    ],
    outputs: [{ name: "amountOut", type: "uint256" }]
  },
  {
    name: "getQuoteV2",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_tokenIn", type: "address" },
      { name: "_tokenOut", type: "address" },
      { name: "_amountIn", type: "uint256" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "getSupportedTokens",
    type: "function",
    stateMutability: "pure",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }]
  },
  {
    name: "feePercent",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "Swap",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "tokenIn", type: "address", indexed: true },
      { name: "tokenOut", type: "address", indexed: true },
      { name: "amountIn", type: "uint256", indexed: false },
      { name: "amountOut", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "routerVersion", type: "uint8", indexed: false }
    ]
  }
];

export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  }
];

export const CHAIN_CONFIG = {
  id: 8453,
  name: "Base",
  network: "base",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["https://mainnet.base.org"] },
    public: { http: ["https://mainnet.base.org"] },
  },
  blockExplorers: {
    default: { name: "BaseScan", url: "https://basescan.org" },
  },
};