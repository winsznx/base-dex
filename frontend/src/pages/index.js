import { ConnectButton } from '@rainbow-me/rainbowkit';
import SwapInterface from '../components/SwapInterface';
import TransactionHistory from '../components/TransactionHistory';
import { TrendingUp, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Base Swap" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-bold hidden sm:inline-block">Base Swap</span>
            <span className="text-xl font-bold sm:hidden">Base Swap</span>
          </div>
          <ConnectButton />
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-8 sm:pt-12 pb-6 sm:pb-8 text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Swap Tokens on Base
        </h1>
        <p className="text-base sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Fast, secure, and low-cost token swaps powered by Uniswap V2 & V3
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
          {/* Swap Interface */}
          <div className="w-full">
            <SwapInterface />

            {/* Mobile-only Transaction History Access could go here if needed, but side-by-side or stacked is fine */}
          </div>

          {/* Transaction History - Stacks on mobile, side-by-side on desktop */}
          <div className="w-full">
            <TransactionHistory />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-8 sm:py-16 border-t border-border/50">
        <div className="grid md:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Lightning Fast"
            description="Execute swaps in seconds with optimal routing through Uniswap V2 and V3"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Secure & Audited"
            description="Built with security-first approach using OpenZeppelin contracts"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Best Prices"
            description="Automatic route selection ensures you get the best rates available"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 opacity-80" />
            <span className="font-semibold">Base Swap DEX</span>
          </div>
          <p>© 2026 Base Swap DEX. Built on Base.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}