import hre from "hardhat";

async function main() {
  console.log("Deploying BaseSwapDEX to Base mainnet...");

  // Fee recipient address
  const FEE_RECIPIENT = "0x1b2823e60859cd6476978464d7b3c951b5fcf843";

  // Deploy contract
  const BaseSwapDEX = await hre.ethers.getContractFactory("BaseSwapDEX");
  const dex = await BaseSwapDEX.deploy(FEE_RECIPIENT);

  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();

  console.log("BaseSwapDEX deployed to:", dexAddress);

  // Base mainnet router addresses
  const UNISWAP_V2_ROUTER = "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"; // BaseSwap
  const UNISWAP_V3_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481"; // Uniswap V3 on Base
  const UNISWAP_V3_QUOTER = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"; // Uniswap V3 Quoter

  console.log("\nConfiguring routers...");

  // Set Uniswap V2 Router (BaseSwap)
  const tx1 = await dex.setUniswapV2Router(UNISWAP_V2_ROUTER);
  await tx1.wait();
  console.log("✓ Uniswap V2 Router set:", UNISWAP_V2_ROUTER);

  // Set Uniswap V3 Router
  const tx2 = await dex.setUniswapV3Router(UNISWAP_V3_ROUTER);
  await tx2.wait();
  console.log("✓ Uniswap V3 Router set:", UNISWAP_V3_ROUTER);

  // Set Uniswap V3 Quoter
  const tx3 = await dex.setUniswapV3Quoter(UNISWAP_V3_QUOTER);
  await tx3.wait();
  console.log("✓ Uniswap V3 Quoter set:", UNISWAP_V3_QUOTER);

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", dexAddress);
  console.log("Fee Recipient:", FEE_RECIPIENT);
  console.log("Fee Percent: 3%");
  console.log("\nSupported Tokens:");
  console.log("- USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
  console.log("- USDT: 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2 (Bridged)");
  console.log("- TALENT: 0x9a33406165F562E16c3Abd82FD1185482e01B49a");
  console.log("- WETH: 0x4200000000000000000000000000000000000006");

  console.log("\n⚠️  IMPORTANT: Update the following files with the new contract address:");
  console.log("   - frontend/.env.local (NEXT_PUBLIC_CONTRACT_ADDRESS)");
  console.log("   - frontend/src/config/contracts.js (CONTRACT_ADDRESS)");

  // Verify contract on BaseScan
  console.log("\nVerifying contract on BaseScan...");
  try {
    await hre.run("verify:verify", {
      address: dexAddress,
      constructorArguments: [FEE_RECIPIENT],
    });
    console.log("✓ Contract verified successfully");
  } catch (error) {
    console.log("Verification error:", error.message);
    console.log("You can verify manually with:");
    console.log(`npx hardhat verify --network base ${dexAddress} ${FEE_RECIPIENT}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });