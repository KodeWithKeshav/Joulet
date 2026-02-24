const { ethers } = require("ethers");
async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const dexAddress = new ethers.Wallet("0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6").address;
    const producerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    try {
        const res = await fetch("http://localhost:5004/api/status");
        const data = await res.json();
        const contractAddr = data.contract.address;
        const abi = ["function balanceOf(address owner) view returns (uint256)"];
        const contract = new ethers.Contract(contractAddr, abi, provider);
        
        const dexBal = await contract.balanceOf(dexAddress);
        console.log("DEX AMM JLT:", ethers.formatUnits(dexBal, 18));
        
        const prodBal = await contract.balanceOf(producerAddress);
        console.log("Producer JLT:", ethers.formatUnits(prodBal, 18));
    } catch(e) {
        console.error(e);
    }
}
main();
