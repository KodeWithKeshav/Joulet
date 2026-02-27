const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const dexWallet = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"; // Hardhat Account #9
    const producerWallet = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Hardhat Account #0
    
    try {
        const res = await fetch("http://localhost:5004/api/status");
        const data = await res.json();
        const contractAddr = data.contract.address;
        console.log("Contract Address:", contractAddr);
        
        const abi = ["function balanceOf(address owner) view returns (uint256)"];
        const contract = new ethers.Contract(contractAddr, abi, provider);
        
        const dexBal = await contract.balanceOf(dexWallet);
        const producerBal = await contract.balanceOf(producerWallet);
        
        console.log("\n=== WALLET BALANCES ===");
        console.log("DEX Wallet JLT:      ", ethers.formatUnits(dexBal, 18));
        console.log("Producer Wallet JLT: ", ethers.formatUnits(producerBal, 18));
        
        const dexBalNum = parseFloat(ethers.formatUnits(dexBal, 18));
        if (dexBalNum < 100) {
            console.log("\n⚠️  DEX has insufficient liquidity for trades! Need to seed it.");
        } else {
            console.log("\n✓ DEX has sufficient liquidity");
        }
    } catch(e) {
        console.error("Error:", e.message);
    }
}

main();
