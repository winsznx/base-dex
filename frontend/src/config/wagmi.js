import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

// Set to false to use mainnet, true for testnet
const USE_TESTNET = false;

export const config = getDefaultConfig({
  appName: 'Base Swap DEX',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: USE_TESTNET ? [baseSepolia] : [base],
  ssr: true,
});

// Export the current chain for use in other components
export const currentChain = USE_TESTNET ? baseSepolia : base;