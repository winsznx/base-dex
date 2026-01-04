import '@rainbow-me/rainbowkit/styles.css';
import '../styles/globals.css';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { config } from '../config/wagmi';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme()}
          appearance="light"
        >
          <Head>
            <title>Base Swap DEX</title>
            <meta name="description" content="Swap tokens on Base chain instantly" />
            <link rel="icon" href="/logo.png" />
          </Head>
          <Component {...pageProps} />
          <Toaster position="bottom-right" />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}