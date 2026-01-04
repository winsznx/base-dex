import { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, encodeFunctionData, decodeFunctionResult } from 'viem';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, TOKENS, BASE_SWAP_ABI, ERC20_ABI, WETH_ADDRESS } from '../config/contracts';
import { ArrowDownUp, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Uniswap V3 QuoterV2 on Base mainnet
const QUOTER_V2_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";

// QuoterV2 ABI for quoteExactInputSingle (takes struct parameter)
const QUOTER_V2_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" }
        ],
        name: "params",
        type: "tuple"
      }
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
];

export default function SwapInterface() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [tokenIn, setTokenIn] = useState(TOKENS.ETH);
  const [tokenOut, setTokenOut] = useState(TOKENS.USDC);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState(1.0); // Default 1% slippage for better execution
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);
  const [preferredVersion, setPreferredVersion] = useState(2); // Use V2 router by default (more reliable)
  const [quoteError, setQuoteError] = useState('');
  const [isSwapping, setIsSwapping] = useState(false); // Track if swap is in progress

  const { data: hash, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Handle transaction status updates
  useEffect(() => {
    if (hash && isConfirming) {
      toast.loading('Confirming transaction...', { id: 'swap' });
    }
    if (isSuccess) {
      toast.success('Swap successful!', { id: 'swap' });
      setAmountIn('');
      setAmountOut('');
      setIsSwapping(false); // Reset swap state
    }
  }, [hash, isConfirming, isSuccess]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error('Write error details:', writeError);

      // Parse the error message for better user feedback
      const errorMsg = writeError.message || writeError.toString();
      let userMessage = 'Swap failed';

      if (errorMsg.includes('rejected') || errorMsg.includes('denied')) {
        userMessage = 'Transaction rejected by user';
      } else if (errorMsg.includes('insufficient funds')) {
        userMessage = 'Insufficient ETH for gas';
      } else if (errorMsg.includes('slippage') || errorMsg.includes('INSUFFICIENT_OUTPUT')) {
        userMessage = 'Slippage too low - try increasing slippage';
      } else if (errorMsg.includes('Token not supported')) {
        userMessage = 'Token not supported by contract';
      } else if (errorMsg.includes('execution reverted')) {
        // Extract the revert reason
        const revertMatch = errorMsg.match(/reason="([^"]+)"/);
        userMessage = revertMatch ? `Contract error: ${revertMatch[1]}` : 'Contract execution reverted';
      }

      toast.error(userMessage, { id: 'swap' });
      setIsSwapping(false); // Reset swap state on error
    }
  }, [writeError]);

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

  // Fetch real-time quote from Uniswap V3 QuoterV2 using callStatic
  const fetchQuote = useCallback(async () => {
    if (!amountIn || parseFloat(amountIn) <= 0 || !publicClient) {
      setAmountOut('');
      setQuoteError('');
      setPriceImpact(0);
      return;
    }

    setIsLoading(true);
    setQuoteError('');

    try {
      const tokenInAddr = tokenIn.address === "0x0000000000000000000000000000000000000000" ? WETH_ADDRESS : tokenIn.address;
      const tokenOutAddr = tokenOut.address === "0x0000000000000000000000000000000000000000" ? WETH_ADDRESS : tokenOut.address;
      const amountInWei = parseUnits(amountIn, tokenIn.decimals);

      // Encode the function call with struct parameter (QuoterV2 format)
      const data = encodeFunctionData({
        abi: QUOTER_V2_ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          tokenIn: tokenInAddr,
          tokenOut: tokenOutAddr,
          amountIn: amountInWei,
          fee: 3000, // 0.3% fee tier (most common for stablecoin pairs)
          sqrtPriceLimitX96: 0n
        }]
      });

      // Execute callStatic (eth_call) to get the quote without executing a transaction
      const result = await publicClient.call({
        to: QUOTER_V2_ADDRESS,
        data: data,
      });

      if (result.data) {
        // Decode the result
        const decoded = decodeFunctionResult({
          abi: QUOTER_V2_ABI,
          functionName: 'quoteExactInputSingle',
          data: result.data,
        });

        const amountOutWei = decoded[0]; // amountOut is the first return value
        const outputAmount = formatUnits(amountOutWei, tokenOut.decimals);
        setAmountOut(outputAmount);

        // Calculate estimated price impact based on trade size
        const inputValue = parseFloat(amountIn);
        const outputValue = parseFloat(outputAmount);

        // Simple price impact estimation
        // For more accurate price impact, you'd compare with a small reference quote
        const estimatedPriceImpact = inputValue > 10
          ? Math.min(Math.max((inputValue * 0.005), 0.05), 15)
          : inputValue > 1
            ? Math.min(Math.max((inputValue * 0.002), 0.01), 5)
            : 0.01;

        setPriceImpact(estimatedPriceImpact);
        setQuoteError('');
      }
    } catch (error) {
      console.error('Quote error:', error);

      // Try different fee tiers if 0.3% fails
      try {
        await tryAlternativeFeeTiers();
      } catch (fallbackError) {
        setQuoteError('Unable to fetch quote. No liquidity pool found for this pair.');
        setAmountOut('');
      }
    } finally {
      setIsLoading(false);
    }
  }, [amountIn, tokenIn, tokenOut, publicClient]);

  // Try alternative fee tiers (0.05%, 1%)
  const tryAlternativeFeeTiers = async () => {
    const feeTiers = [500, 10000]; // 0.05% and 1%
    const tokenInAddr = tokenIn.address === "0x0000000000000000000000000000000000000000" ? WETH_ADDRESS : tokenIn.address;
    const tokenOutAddr = tokenOut.address === "0x0000000000000000000000000000000000000000" ? WETH_ADDRESS : tokenOut.address;
    const amountInWei = parseUnits(amountIn, tokenIn.decimals);

    for (const fee of feeTiers) {
      try {
        const data = encodeFunctionData({
          abi: QUOTER_V2_ABI,
          functionName: 'quoteExactInputSingle',
          args: [{
            tokenIn: tokenInAddr,
            tokenOut: tokenOutAddr,
            amountIn: amountInWei,
            fee: fee,
            sqrtPriceLimitX96: 0n
          }]
        });

        const result = await publicClient.call({
          to: QUOTER_V2_ADDRESS,
          data: data,
        });

        if (result.data) {
          const decoded = decodeFunctionResult({
            abi: QUOTER_V2_ABI,
            functionName: 'quoteExactInputSingle',
            data: result.data,
          });

          const amountOutWei = decoded[0];
          const outputAmount = formatUnits(amountOutWei, tokenOut.decimals);
          setAmountOut(outputAmount);
          setPriceImpact(0.1);
          setQuoteError('');
          return;
        }
      } catch (e) {
        continue;
      }
    }
    throw new Error('No pool found');
  };

  // Debounce quote fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchQuote]);

  // Refetch quote periodically for real-time updates (but NOT during swap)
  useEffect(() => {
    if (!amountIn || parseFloat(amountIn) <= 0 || isSwapping) return;

    const intervalId = setInterval(() => {
      // Only refresh if not actively swapping
      if (!isSwapping) {
        fetchQuote();
      }
    }, 30000); // Increased to 30s to avoid rate limits

    return () => clearInterval(intervalId); // Cleanup
  }, [fetchQuote, isSwapping]);

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

      // Pause quote refreshes during swap
      setIsSwapping(true);

      const amountInWei = parseUnits(amountIn, tokenIn.decimals);

      // The quote from Uniswap is the raw output, but the contract takes 3% fee
      // So the user receives: quote * 0.97 (after fee)
      // Apply slippage to the POST-FEE amount
      // Add extra 0.5% buffer for block timing differences
      const amountAfterFee = parseFloat(amountOut) * 0.97; // 3% protocol fee
      const totalSlippage = slippage + 0.5; // Add 0.5% buffer for execution timing
      const minAmountOut = parseUnits(
        (amountAfterFee * (1 - totalSlippage / 100)).toFixed(tokenOut.decimals),
        tokenOut.decimals
      );

      toast.loading('Initiating swap...', { id: 'swap' });

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
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Failed to execute swap', { id: 'swap' });
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
                      className={`flex-1 py-2 rounded-lg transition-colors ${slippage === val
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
                      className={`flex-1 py-2 rounded-lg transition-colors ${preferredVersion === option.value
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
                value={isLoading ? 'Loading...' : amountOut}
                readOnly
                placeholder="0.0"
                className="flex-1 min-w-0 bg-transparent text-2xl sm:text-3xl font-semibold outline-none"
              />
              <TokenSelector token={tokenOut} onSelect={setTokenOut} exclude={tokenIn} />
            </div>
          </div>
        </div>

        {/* Quote Error */}
        {quoteError && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-yellow-600">{quoteError}</span>
          </div>
        )}

        {/* Price Impact Warning */}
        {priceImpact > 5 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">High price impact: {priceImpact.toFixed(2)}%</span>
          </div>
        )}

        {/* Swap Details */}
        {amountOut && !quoteError && (
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
              <span className="text-muted-foreground">Min. Received (after fees)</span>
              <span className="font-medium">
                {(parseFloat(amountOut) * 0.97 * (1 - slippage / 100)).toFixed(6)} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={`font-medium ${priceImpact > 5 ? 'text-destructive' : 'text-green-500'}`}>
                ~{priceImpact.toFixed(2)}%
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
            disabled={isLoading || isConfirming || !amountIn || !amountOut || quoteError}
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
                Fetching quote...
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
        <img
          src={token.logo}
          alt={token.symbol}
          className="w-6 h-6 rounded-full"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="w-6 h-6 rounded-full bg-primary/20 items-center justify-center hidden">
          <span className="text-xs font-bold">{token.symbol[0]}</span>
        </div>
        <span className="font-semibold">{token.symbol}</span>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl border border-border p-4 sm:p-6 max-w-sm sm:max-w-md w-full animate-slideIn max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Select Token</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg">
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {availableTokens.map((t) => (
                <button
                  key={t.address}
                  onClick={() => {
                    onSelect(t);
                    setShowModal(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                >
                  <img
                    src={t.logo}
                    alt={t.symbol}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{t.symbol}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">{t.name}</div>
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