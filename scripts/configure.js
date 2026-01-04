import hre from "hardhat";

async function main() {
    const CONTRACT_ADDRESS = "0x523Bb25796113b47aA80074843713F34D7eFe651";

    console.log("Finishing configuration for BaseSwapDEX at:", CONTRACT_ADDRESS);

    // Get the contract instance
    const BaseSwapDEX = await hre.ethers.getContractFactory("BaseSwapDEX");
    const dex = BaseSwapDEX.attach(CONTRACT_ADDRESS);

    // Router addresses
    const UNISWAP_V3_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481";
    const UNISWAP_V3_QUOTER = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";

    console.log("\nSetting V3 Router...");
    const tx1 = await dex.setUniswapV3Router(UNISWAP_V3_ROUTER);
    console.log("Tx hash:", tx1.hash);
    await tx1.wait();
    console.log("✓ Uniswap V3 Router set:", UNISWAP_V3_ROUTER);

    console.log("\nSetting V3 Quoter...");
    const tx2 = await dex.setUniswapV3Quoter(UNISWAP_V3_QUOTER);
    console.log("Tx hash:", tx2.hash);
    await tx2.wait();
    console.log("✓ Uniswap V3 Quoter set:", UNISWAP_V3_QUOTER);

    console.log("\n✅ Configuration complete!");
    console.log("\nContract is now fully configured at:", CONTRACT_ADDRESS);

    // Now verify
    console.log("\nVerifying contract on BaseScan...");
    try {
        await hre.run("verify:verify", {
            address: CONTRACT_ADDRESS,
            constructorArguments: ["0x1b2823e60859cd6476978464d7b3c951b5fcf843"],
        });
        console.log("✓ Contract verified successfully");
    } catch (error) {
        if (error.message.includes("already verified")) {
            console.log("✓ Contract already verified");
        } else {
            console.log("Verification error:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
