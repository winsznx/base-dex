import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESS, TOKENS, BASE_SWAP_ABI, ERC20_ABI, WETH_ADDRESS } from '../config/contracts';
import { ArrowDownUp, Settings, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SwapInterface() {
  const { address, isConnected } = useAccount();
  
  const [tokenIn, setTokenIn] = useState(TOKENS.ETH);
  const [tokenOut, setTokenOut] = useState(TOKENS.USDC);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);
  const [preferredVersion, setPreferredVersion] = useState(0); // 0 = auto, 2 = V2, 3 = V3

  const { data: hash, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Get token balances
  const { data: balanceIn } = useBalance({
    address: address,
    token: tokenIn.address === "0x0000000000000000000000000000000000000000" ? undefined : tokenIn.address,
  });

  const { data: balanceOut } = useBalance({
    address: address,
    token: tokenOut.address === "0x0000000000000000000000000000000000000000" ? undefined : tokenOut.address,
  });

  // Get token allowance if not ETH
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, CONTRACT_ADDRESS],
    query: {
      enabled: tokenIn.address !== "0x0000000000000000000000000000000000000000" && isConnected,
    },
  });

  // Get real-time quote from contract
  const { data: quoteData, isLoading: quoteLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BASE_SWAP_ABI,
    functionName: 'getQuoteV2',
    args: [
      tokenIn.address === "0x0000000000000000000000000000000000000000" ? WETH_ADDRESS : tokenIn.address,
      tokenOut.address === "0x0000000000000000000000000000000000000000" ? WETH_ADDRESS : tokenOut.address,
      amountIn && parseFloat(amountIn) > 0 ? parseUnits(amountIn, tokenIn.decimals) : 0n
    ],
    query: {
      enabled: !!amountIn && parseFloat(amountIn) > 0,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Update quote when data changes
  useEffect(() => {
    if (quoteData && amountIn && parseFloat(amountIn) > 0) {
      try {
        const outputAmount = formatUnits(quoteData, tokenOut.decimals);
        setAmountOut(outputAmount);

        // Calculate simple price impact
        const inputValue = parseFloat(amountIn);
        const outputValue = parseFloat(outputAmount);
        if (inputValue > 0 && outputValue > 0) {
          setPriceImpact(0.5); // Simplified for now
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing quote:', error);
        setAmountOut('');
        setIsLoading(false);
      }
    } else if (!amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut('');
      setPriceImpact(0);
    }
  }, [quoteData, amountIn, tokenOut.decimals]);

  // Update loading state
  useEffect(() => {
    setIsLoading(quoteLoading);
  }, [quoteLoading]);

  const handleApprove = async () => {
    try {
      const amountInWei = parseUnits(amountIn, tokenIn.decimals);
      
      writeContract({
        address: tokenIn.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amountInWei],
      });
      
      toast.promise(
        new Promise((resolve, reject) => {
          const interval = setInterval(async () => {
            await refetchAllowance();
            if (allowance >= amountInWei) {
              clearInterval(interval);
              resolve();
            }
          }, 1000);
        }),
        {
          loading: 'Approving token...',
          success: 'Token approved successfully',
          error: 'Failed to approve token',
        }
      );
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve token');
    }
  };

  const handleSwap = async () => {
    try {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        toast.error('Enter a valid amount');
        return;
      }

      const amountInWei = parseUnits(amountIn, tokenIn.decimals);
      const minAmountOut = parseUnits(
        (parseFloat(amountOut) * (1 - slippage / 100)).toFixed(tokenOut.decimals),
        tokenOut.decimals
      );

      // ETH to Token swap
      if (tokenIn.address === "0x0000000000000000000000000000000000000000") {
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: BASE_SWAP_ABI,
          functionName: 'swapETHToToken',
          args: [tokenOut.address, minAmountOut, preferredVersion],
          value: amountInWei,
        });
      }
      // Token to ETH swap
      else if (tokenOut.address === "0x0000000000000000000000000000000000000000") {
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: BASE_SWAP_ABI,
          functionName: 'swapTokenToETH',
          args: [tokenIn.address, amountInWei, minAmountOut, preferredVersion],
        });
      }
      // Token to Token swap
      else {
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: BASE_SWAP_ABI,
          functionName: 'swapTokenToToken',
          args: [tokenIn.address, tokenOut.address, amountInWei, minAmountOut, preferredVersion],
        });
      }

      toast.promise(
        new Promise((resolve, reject) => {
          if (isSuccess) resolve();
          else if (!isConfirming) reject();
        }),
        {
          loading: 'Swapping tokens...',
          success: 'Swap successful!',
          error: 'Swap failed',
        }
      );
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Failed to execute swap');
    }
  };

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  const needsApproval = () => {
    if (tokenIn.address === "0x0000000000000000000000000000000000000000") return false;
    if (!allowance || !amountIn) return true;
    const amountInWei = parseUnits(amountIn, tokenIn.decimals);
    return BigInt(allowance) < BigInt(amountInWei);
  };

  const setMaxBalance = () => {
    if (balanceIn) {
      setAmountIn(formatUnits(balanceIn.value, tokenIn.decimals));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-2 sm:p-4">
      <div className="bg-card rounded-2xl shadow-xl border border-border p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Swap</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-4 bg-muted rounded-lg animate-slideIn">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Slippage Tolerance</label>
                <div className="flex gap-2">
                  {[0.5, 1.0, 2.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSlippage(val)}
                      className={`flex-1 py-2 rounded-lg transition-colors ${
                        slippage === val
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-accent'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value))}
                    className="w-20 px-3 py-2 rounded-lg bg-background border border-border text-center"
                    step="0.1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Router Version</label>
                <div className="flex gap-2">
                  {[
                    { value: 0, label: 'Auto' },
                    { value: 2, label: 'V2' },
                    { value: 3, label: 'V3' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPreferredVersion(option.value)}
                      className={`flex-1 py-2 rounded-lg transition-colors ${
                        preferredVersion === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-accent'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Input */}
        <div className="mb-2">
          <div className="bg-muted rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">From</span>
              {balanceIn && (
                <button
                  onClick={setMaxBalance}
                  className="text-sm text-primary hover:underline"
                >
                  Balance: {parseFloat(formatUnits(balanceIn.value, tokenIn.decimals)).toFixed(4)}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="flex-1 min-w-0 bg-transparent text-2xl sm:text-3xl font-semibold outline-none"
              />
              <TokenSelector token={tokenIn} onSelect={setTokenIn} exclude={tokenOut} />
            </div>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={switchTokens}
            className="p-2 bg-background border-4 border-card rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowDownUp className="w-5 h-5" />
          </button>
        </div>

        {/* Token Output */}
        <div className="mt-2 mb-6">
          <div className="bg-muted rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">To</span>
              {balanceOut && (
                <span className="text-sm text-muted-foreground">
                  Balance: {parseFloat(formatUnits(balanceOut.value, tokenOut.decimals)).toFixed(4)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={amountOut}
                readOnly
                placeholder="0.0"
                className="flex-1 min-w-0 bg-transparent text-2xl sm:text-3xl font-semibold outline-none"
              />
              <TokenSelector token={tokenOut} onSelect={setTokenOut} exclude={tokenIn} />
            </div>
          </div>
        </div>

        {/* Price Impact Warning */}
        {priceImpact > 5 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">High price impact: {priceImpact.toFixed(2)}%</span>
          </div>
        )}

        {/* Swap Details */}
        {amountOut && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium">
                1 {tokenIn.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn || 1)).toFixed(6)} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protocol Fee (3%)</span>
              <span className="font-medium">
                {(parseFloat(amountOut) * 0.03).toFixed(6)} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min. Received</span>
              <span className="font-medium">
                {(parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6)} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={`font-medium ${priceImpact > 5 ? 'text-destructive' : 'text-green-500'}`}>
                {priceImpact.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isConnected ? (
          <div className="text-center text-muted-foreground">
            Connect wallet to swap
          </div>
        ) : needsApproval() ? (
          <button
            onClick={handleApprove}
            disabled={isLoading || !amountIn}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Approving...
              </span>
            ) : (
              `Approve ${tokenIn.symbol}`
            )}
          </button>
        ) : (
          <button
            onClick={handleSwap}
            disabled={isLoading || isConfirming || !amountIn || !amountOut}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Confirming...
              </span>
            ) : isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              'Swap'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function TokenSelector({ token, onSelect, exclude }) {
  const [showModal, setShowModal] = useState(false);
  const availableTokens = Object.values(TOKENS).filter(t => t.address !== exclude.address);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-background rounded-xl hover:bg-accent transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold">{token.symbol[0]}</span>
        </div>
        <span className="font-semibold">{token.symbol}</span>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-border p-6 max-w-md w-full animate-slideIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Select Token</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg">
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {availableTokens.map((t) => (
                <button
                  key={t.address}
                  onClick={() => {
                    onSelect(t);
                    setShowModal(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold">{t.symbol[0]}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{t.symbol}</div>
                    <div className="text-sm text-muted-foreground">{t.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}