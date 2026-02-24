import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const consumerA = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    try {
        const res = await fetch("http://localhost:5004/api/status");
        const data = await res.json();
        const contractAddr = data.contract.address;
        const abi = ["function balanceOf(address owner) view returns (uint256)"];
        const contract = new ethers.Contract(contractAddr, abi, provider);
        const bal = await contract.balanceOf(consumerA);
        console.log("Consumer A JLT:", ethers.formatUnits(bal, 18));
    } catch (e) {
        console.error("Test error", e);
    }
}
main();
