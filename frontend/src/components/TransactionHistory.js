import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESS, BASE_SWAP_ABI, TOKENS, WETH_ADDRESS } from '../config/contracts';
import { History, ExternalLink, ArrowRight, RefreshCw } from 'lucide-react';

export default function TransactionHistory() {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Get token info from address
    const getTokenInfo = (tokenAddress) => {
        if (tokenAddress === "0x0000000000000000000000000000000000000000") {
            return TOKENS.ETH;
        }
        if (tokenAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
            return { symbol: "WETH", decimals: 18, name: "Wrapped Ether" };
        }
        const token = Object.values(TOKENS).find(
            t => t.address.toLowerCase() === tokenAddress.toLowerCase()
        );
        return token || { symbol: "???", decimals: 18, name: "Unknown" };
    };

    // Fetch transaction history with retry logic
    const fetchHistory = async (retryCount = 0) => {
        if (!address || !publicClient) return;

        setIsLoading(true);
        try {
            // Get swap events for the connected user
            // We limit the block range to avoid timeouts on public RPCs
            const currentBlock = await publicClient.getBlockNumber();
            const fromBlock = currentBlock - 10000n; // Last ~10k blocks only (~1 day) to be safe

            const logs = await publicClient.getLogs({
                address: CONTRACT_ADDRESS,
                event: {
                    type: 'event',
                    name: 'Swap',
                    inputs: [
                        { name: 'user', type: 'address', indexed: true },
                        { name: 'tokenIn', type: 'address', indexed: true },
                        { name: 'tokenOut', type: 'address', indexed: true },
                        { name: 'amountIn', type: 'uint256', indexed: false },
                        { name: 'amountOut', type: 'uint256', indexed: false },
                        { name: 'fee', type: 'uint256', indexed: false },
                        { name: 'routerVersion', type: 'uint8', indexed: false }
                    ]
                },
                args: {
                    user: address
                },
                fromBlock: fromBlock,
                toBlock: 'latest'
            });

            // Process and format transactions
            const txs = await Promise.all(
                logs.slice(-20).reverse().map(async (log) => {
                    const block = await publicClient.getBlock({ blockHash: log.blockHash });
                    const tokenIn = getTokenInfo(log.args.tokenIn);
                    const tokenOut = getTokenInfo(log.args.tokenOut);

                    return {
                        hash: log.transactionHash,
                        blockNumber: log.blockNumber,
                        timestamp: Number(block.timestamp) * 1000,
                        tokenIn,
                        tokenOut,
                        amountIn: formatUnits(log.args.amountIn, tokenIn.decimals),
                        amountOut: formatUnits(log.args.amountOut, tokenOut.decimals),
                        fee: formatUnits(log.args.fee, tokenOut.decimals),
                        routerVersion: Number(log.args.routerVersion)
                    };
                })
            );

            setTransactions(txs);
            setIsLoading(false); // Success, stop loading
        } catch (error) {
            console.error('Error fetching history:', error);

            // Retry on rate limit (429) or other transient errors if under retry limit
            if (retryCount < 3) {
                const backoff = 2000 * Math.pow(2, retryCount); // 2s, 4s, 8s
                console.log(`Retrying history fetch in ${backoff}ms...`);
                setTimeout(() => fetchHistory(retryCount + 1), backoff);
            } else {
                setIsLoading(false); // Retries exhausted
            }
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [address, publicClient]);

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const shortenHash = (hash) => {
        return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
    };

    if (!isConnected) {
        return (
            <div className="w-full max-w-md mx-auto p-2 sm:p-4">
                <div className="bg-card rounded-2xl shadow-xl border border-border p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <History className="w-5 h-5" />
                        <h2 className="text-xl font-bold">Transaction History</h2>
                    </div>
                    <p className="text-muted-foreground text-center py-8">
                        Connect wallet to view history
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-2 sm:p-4">
            <div className="bg-card rounded-2xl shadow-xl border border-border p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        <h2 className="text-xl font-bold">Transaction History</h2>
                    </div>
                    <button
                        onClick={fetchHistory}
                        disabled={isLoading}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Transactions List */}
                {isLoading && transactions.length === 0 ? (
                    <div className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-muted-foreground">Loading transactions...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No transactions yet
                    </div>
                ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {transactions.map((tx) => (
                            <div
                                key={tx.hash}
                                className="p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">{parseFloat(tx.amountIn).toFixed(6)}</span>
                                        <span className="text-muted-foreground">{tx.tokenIn.symbol}</span>
                                        <ArrowRight className="w-4 h-4 text-primary" />
                                        <span className="font-medium">{parseFloat(tx.amountOut).toFixed(6)}</span>
                                        <span className="text-muted-foreground">{tx.tokenOut.symbol}</span>
                                    </div>
                                    <a
                                        href={`https://basescan.org/tx/${tx.hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 hover:bg-background rounded transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                    </a>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{formatDate(tx.timestamp)}</span>
                                    <span className="flex items-center gap-2">
                                        <span className="text-green-500/80">Fee: {parseFloat(tx.fee).toFixed(5)} {tx.tokenOut.symbol}</span>
                                        <span>•</span>
                                        <span>V{tx.routerVersion}</span>
                                        <span>•</span>
                                        <span>{shortenHash(tx.hash)}</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
