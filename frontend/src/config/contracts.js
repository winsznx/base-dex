export const CONTRACT_ADDRESS = "0x372042003cE6968856401A79454a8574936690D1";

export const TOKENS = {
  ETH: {
    address: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    logo: "/tokens/eth.svg"
  },
  USDC: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "/tokens/usdc.svg"
  },
  USDT: {
    address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logo: "/tokens/usdt.svg"
  },
  TALENT: {
    address: "0x9a33406165f562E16C3abD82fd1185482E01b49a",
    symbol: "TALENT",
    name: "Talent Protocol",
    decimals: 18,
    logo: "/tokens/talent.svg"
  }
};

export const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

export const BASE_SWAP_ABI = [
  "function swapETHToToken(address _tokenOut, uint256 _minAmountOut, uint8 _preferredVersion) external payable returns (uint256 amountOut)",
  "function swapTokenToETH(address _tokenIn, uint256 _amountIn, uint256 _minAmountOut, uint8 _preferredVersion) external returns (uint256 amountOut)",
  "function swapTokenToToken(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _minAmountOut, uint8 _preferredVersion) external returns (uint256 amountOut)",
  "function getQuoteV2(address _tokenIn, address _tokenOut, uint256 _amountIn) external view returns (uint256)",
  "function getSupportedTokens() external pure returns (address[] memory)",
  "function feePercent() external view returns (uint256)",
  "event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee, uint8 routerVersion)"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)"
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