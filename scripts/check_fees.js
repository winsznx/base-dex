import hre from "hardhat";
const { ethers } = hre;

async function main() {
    const CONTRACT_ADDRESS = "0x523Bb25796113b47aA80074843713F34D7eFe651"; // The deployed address from earlier
    const contract = await ethers.getContractAt("BaseSwapDEX", CONTRACT_ADDRESS);

    const feeRecipient = await contract.feeRecipient();
    const feePercent = await contract.feePercent();
    const owner = await contract.owner();

    console.log("Contract Address:", CONTRACT_ADDRESS);
    console.log("Fee Recipient:", feeRecipient);
    console.log("Fee Percent:", feePercent.toString() + " basis points (" + (Number(feePercent) / 100) + "%)");
    console.log("Owner:", owner);

    // Check Contract Balances
    const ethBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    console.log("Contract ETH Balance:", ethers.formatEther(ethBalance));

    const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    const usdcBalance = await usdc.balanceOf(CONTRACT_ADDRESS);
    console.log("Contract USDC Balance:", ethers.formatUnits(usdcBalance, 6));

    const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
    const weth = await ethers.getContractAt("IERC20", WETH_ADDRESS);
    const wethBalance = await weth.balanceOf(CONTRACT_ADDRESS);
    console.log("Contract WETH Balance:", ethers.formatUnits(wethBalance, 18));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
