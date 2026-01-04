// Sources flattened with hardhat v2.26.5 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/BaseSwapDEX.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;



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
    address public constant TALENT = 0x9a33406165f562E16C3abD82fd1185482E01b49a;
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
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
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
