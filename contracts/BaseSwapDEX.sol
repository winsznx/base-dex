// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BaseSwapDEX
 * @dev Direct swap contract for ETH, USDC, USDT, and TALENT on Base mainnet
 * Integrates with Uniswap V2/V3 and Aerodrome for optimal routing
 */

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
    
    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path) 
        external view returns (uint[] memory amounts);
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external payable returns (uint256 amountOut);
}

interface IQuoterV2 {
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut);
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract BaseSwapDEX is Ownable, ReentrancyGuard {
    
    // Token addresses on Base mainnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant USDT = 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2;
    address public constant TALENT = 0x9a33406165F562E16c3Abd82FD1185482e01B49a;
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    
    // Protocol fee recipient
    address public feeRecipient;
    uint256 public feePercent = 300; // 3% in basis points
    
    // Router addresses
    IUniswapV2Router02 public uniswapV2Router;
    ISwapRouter public uniswapV3Router;
    IQuoterV2 public uniswapV3Quoter;
    
    // Uniswap V3 fee tiers
    uint24 public constant FEE_LOW = 500;      // 0.05%
    uint24 public constant FEE_MEDIUM = 3000;  // 0.3%
    uint24 public constant FEE_HIGH = 10000;   // 1%
    
    // Events
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee,
        uint8 routerVersion
    );
    
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event FeePercentUpdated(uint256 oldFee, uint256 newFee);
    event RouterUpdated(address indexed router, uint8 version);
    
    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
    
    receive() external payable {}
    
    /**
     * @dev Set Uniswap V2 Router (or compatible fork like Aerodrome)
     */
    function setUniswapV2Router(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router");
        uniswapV2Router = IUniswapV2Router02(_router);
        emit RouterUpdated(_router, 2);
    }
    
    /**
     * @dev Set Uniswap V3 Router
     */
    function setUniswapV3Router(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router");
        uniswapV3Router = ISwapRouter(_router);
        emit RouterUpdated(_router, 3);
    }
    
    /**
     * @dev Set Uniswap V3 Quoter
     */
    function setUniswapV3Quoter(address _quoter) external onlyOwner {
        require(_quoter != address(0), "Invalid quoter");
        uniswapV3Quoter = IQuoterV2(_quoter);
    }
    
    /**
     * @dev Update fee recipient
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(oldRecipient, _feeRecipient);
    }
    
    /**
     * @dev Update fee percentage (max 10%)
     */
    function setFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 1000, "Fee too high");
        uint256 oldFee = feePercent;
        feePercent = _feePercent;
        emit FeePercentUpdated(oldFee, _feePercent);
    }
    
    /**
     * @dev Swap ETH to Token using best available route
     */
    function swapETHToToken(
        address _tokenOut,
        uint256 _minAmountOut,
        uint8 _preferredVersion
    ) external payable nonReentrant returns (uint256 amountOut) {
        require(msg.value > 0, "No ETH sent");
        require(_isSupported(_tokenOut), "Token not supported");
        require(_tokenOut != WETH, "Use WETH directly");
        
        uint256 amountIn = msg.value;
        
        // Try preferred version first, fallback to other
        if (_preferredVersion == 3 && address(uniswapV3Router) != address(0)) {
            amountOut = _swapETHToTokenV3(_tokenOut, amountIn, _minAmountOut);
        } else if (_preferredVersion == 2 && address(uniswapV2Router) != address(0)) {
            amountOut = _swapETHToTokenV2(_tokenOut, amountIn, _minAmountOut);
        } else {
            // Auto-select best route
            amountOut = _swapETHToTokenAuto(_tokenOut, amountIn, _minAmountOut);
        }
        
        // Calculate and transfer fee
        uint256 feeAmount = (amountOut * feePercent) / 10000;
        uint256 amountToUser = amountOut - feeAmount;
        
        if (feeAmount > 0) {
            require(IERC20(_tokenOut).transfer(feeRecipient, feeAmount), "Fee transfer failed");
        }
        require(IERC20(_tokenOut).transfer(msg.sender, amountToUser), "Transfer failed");
        
        emit Swap(msg.sender, address(0), _tokenOut, amountIn, amountToUser, feeAmount, _preferredVersion);
    }
    
    /**
     * @dev Swap Token to ETH using best available route
     */
    function swapTokenToETH(
        address _tokenIn,
        uint256 _amountIn,
        uint256 _minAmountOut,
        uint8 _preferredVersion
    ) external nonReentrant returns (uint256 amountOut) {
        require(_amountIn > 0, "Invalid amount");
        require(_isSupported(_tokenIn), "Token not supported");
        
        // Transfer tokens from user
        require(
            IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn),
            "Transfer failed"
        );
        
        // Execute swap
        if (_preferredVersion == 3 && address(uniswapV3Router) != address(0)) {
            amountOut = _swapTokenToETHV3(_tokenIn, _amountIn, _minAmountOut);
        } else if (_preferredVersion == 2 && address(uniswapV2Router) != address(0)) {
            amountOut = _swapTokenToETHV2(_tokenIn, _amountIn, _minAmountOut);
        } else {
            amountOut = _swapTokenToETHAuto(_tokenIn, _amountIn, _minAmountOut);
        }
        
        // Calculate and transfer fee
        uint256 feeAmount = (amountOut * feePercent) / 10000;
        uint256 amountToUser = amountOut - feeAmount;
        
        if (feeAmount > 0) {
            (bool feeSuccess, ) = feeRecipient.call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        (bool success, ) = msg.sender.call{value: amountToUser}("");
        require(success, "ETH transfer failed");
        
        emit Swap(msg.sender, _tokenIn, address(0), _amountIn, amountToUser, feeAmount, _preferredVersion);
    }
    
    /**
     * @dev Swap Token to Token using best available route
     */
    function swapTokenToToken(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut,
        uint8 _preferredVersion
    ) external nonReentrant returns (uint256 amountOut) {
        require(_amountIn > 0, "Invalid amount");
        require(_isSupported(_tokenIn) && _isSupported(_tokenOut), "Token not supported");
        require(_tokenIn != _tokenOut, "Same token");
        
        // Transfer tokens from user
        require(
            IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn),
            "Transfer failed"
        );
        
        // Execute swap
        if (_preferredVersion == 3 && address(uniswapV3Router) != address(0)) {
            amountOut = _swapTokenToTokenV3(_tokenIn, _tokenOut, _amountIn, _minAmountOut);
        } else if (_preferredVersion == 2 && address(uniswapV2Router) != address(0)) {
            amountOut = _swapTokenToTokenV2(_tokenIn, _tokenOut, _amountIn, _minAmountOut);
        } else {
            amountOut = _swapTokenToTokenAuto(_tokenIn, _tokenOut, _amountIn, _minAmountOut);
        }
        
        // Calculate and transfer fee
        uint256 feeAmount = (amountOut * feePercent) / 10000;
        uint256 amountToUser = amountOut - feeAmount;
        
        if (feeAmount > 0) {
            require(IERC20(_tokenOut).transfer(feeRecipient, feeAmount), "Fee transfer failed");
        }
        require(IERC20(_tokenOut).transfer(msg.sender, amountToUser), "Transfer failed");
        
        emit Swap(msg.sender, _tokenIn, _tokenOut, _amountIn, amountToUser, feeAmount, _preferredVersion);
    }
    
    // ============ INTERNAL V2 FUNCTIONS ============
    
    function _swapETHToTokenV2(
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) internal returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = _tokenOut;
        
        uint[] memory amounts = uniswapV2Router.swapExactETHForTokens{value: _amountIn}(
            _minAmountOut,
            path,
            address(this),
            block.timestamp + 300
        );
        
        return amounts[1];
    }
    
    function _swapTokenToETHV2(
        address _tokenIn,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) internal returns (uint256) {
        IERC20(_tokenIn).approve(address(uniswapV2Router), _amountIn);
        
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = WETH;
        
        uint[] memory amounts = uniswapV2Router.swapExactTokensForETH(
            _amountIn,
            _minAmountOut,
            path,
            address(this),
            block.timestamp + 300
        );
        
        return amounts[1];
    }
    
    function _swapTokenToTokenV2(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) internal returns (uint256) {
        IERC20(_tokenIn).approve(address(uniswapV2Router), _amountIn);
        
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;
        
        uint[] memory amounts = uniswapV2Router.swapExactTokensForTokens(
            _amountIn,
            _minAmountOut,
            path,
            address(this),
            block.timestamp + 300
        );
        
        return amounts[1];
    }
    
    // ============ INTERNAL V3 FUNCTIONS ============
    
    function _swapETHToTokenV3(
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) internal returns (uint256) {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH,
            tokenOut: _tokenOut,
            fee: FEE_MEDIUM,
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: _amountIn,
            amountOutMinimum: _minAmountOut,
            sqrtPriceLimitX96: 0
        });
        
        return uniswapV3Router.exactInputSingle{value: _amountIn}(params);
    }
    
    function _swapTokenToETHV3(
        address _tokenIn,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) internal returns (uint256) {
        IERC20(_tokenIn).approve(address(uniswapV3Router), _amountIn);
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: _tokenIn,
            tokenOut: WETH,
            fee: FEE_MEDIUM,
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: _amountIn,
            amountOutMinimum: _minAmountOut,
            sqrtPriceLimitX96: 0
        });
        
        uint256 wethAmount = uniswapV3Router.exactInputSingle(params);
        
        // Unwrap WETH to ETH
        IWETH(WETH).withdraw(wethAmount);
        
        return wethAmount;
    }
    
    function _swapTokenToTokenV3(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) internal returns (uint256) {
        IERC20(_tokenIn).approve(address(uniswapV3Router), _amountIn);
        
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            fee: FEE_MEDIUM,
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: _amountIn,
            amountOutMinimum: _minAmountOut,
            sqrtPriceLimitX96: 0
        });
        
        return uniswapV3Router.exactInputSingle(params);
    }
    
    // ============ AUTO-SELECT BEST ROUTE ============
    
    function _swapETHToTokenAuto(
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) internal returns (uint256) {
        // Try V3 first, fallback to V2
        if (address(uniswapV3Router) != address(0)) {
            return _swapETHToTokenV3(_tokenOut, _amountIn, _minAmountOut);
        } else if (address(uniswapV2Router) != address(0)) {
            return _swapETHToTokenV2(_tokenOut, _amountIn, _minAmountOut);
        }
        revert("No router available");
    }
    
    function _swapTokenToETHAuto(
        address _tokenIn,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) internal returns (uint256) {
        if (address(uniswapV3Router) != address(0)) {
            return _swapTokenToETHV3(_tokenIn, _amountIn, _minAmountOut);
        } else if (address(uniswapV2Router) != address(0)) {
            return _swapTokenToETHV2(_tokenIn, _amountIn, _minAmountOut);
        }
        revert("No router available");
    }
    
    function _swapTokenToTokenAuto(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) internal returns (uint256) {
        if (address(uniswapV3Router) != address(0)) {
            return _swapTokenToTokenV3(_tokenIn, _tokenOut, _amountIn, _minAmountOut);
        } else if (address(uniswapV2Router) != address(0)) {
            return _swapTokenToTokenV2(_tokenIn, _tokenOut, _amountIn, _minAmountOut);
        }
        revert("No router available");
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function _isSupported(address _token) internal pure returns (bool) {
        return _token == USDC || _token == USDT || _token == TALENT;
    }
    
    function getSupportedTokens() external pure returns (address[] memory) {
        address[] memory tokens = new address[](3);
        tokens[0] = USDC;
        tokens[1] = USDT;
        tokens[2] = TALENT;
        return tokens;
    }
    
    function getQuoteV2(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) external view returns (uint256) {
        require(address(uniswapV2Router) != address(0), "V2 router not set");
        
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;
        
        uint[] memory amounts = uniswapV2Router.getAmountsOut(_amountIn, path);
        return amounts[1];
    }
    
    function getQuoteV3(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) external returns (uint256) {
        require(address(uniswapV3Quoter) != address(0), "V3 quoter not set");
        
        return uniswapV3Quoter.quoteExactInputSingle(
            _tokenIn,
            _tokenOut,
            FEE_MEDIUM,
            _amountIn,
            0
        );
    }
    
    /**
     * @dev Emergency withdraw stuck tokens/ETH
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            (bool success, ) = owner().call{value: _amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(IERC20(_token).transfer(owner(), _amount), "Token transfer failed");
        }
    }
}
