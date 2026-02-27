const { ethers } = require('ethers');

const HARDHAT_RPC = 'http://127.0.0.1:8545';
const DEX_PRIVATE_KEY = '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6'; // Hardhat Account #9
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

async function checkDexBalance() {
    try {
        const provider = new ethers.JsonRpcProvider(HARDHAT_RPC);
        const dexWallet = new ethers.Wallet(DEX_PRIVATE_KEY, provider);
        
        console.log('DEX Wallet Address:', dexWallet.address);
        
        const abi = ["function balanceOf(address owner) view returns (uint256)"];
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        
        const rawBalance = await contract.balanceOf(dexWallet.address);
        const balance = ethers.formatUnits(rawBalance, 18);
        
        console.log('DEX JLT Balance:', balance);
        
        if (parseFloat(balance) < 100) {
            console.log('\n⚠️  DEX has insufficient liquidity! Needs at least 100 JLT for trades.');
        } else {
            console.log('✓ DEX has sufficient liquidity');
        }
        
    } catch (error) {
        console.error('Error checking DEX balance:', error.message);
    }
}

checkDexBalance();
