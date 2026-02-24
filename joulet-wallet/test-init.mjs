import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const dexAddress = new ethers.Wallet("0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6").address;
    const producerWallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

    try {
        const res = await fetch("http://localhost:5004/api/status");
        const data = await res.json();
        const contractAddr = data.contract.address;

        console.log("Seeding DEX from Producer:", producerWallet.address);
        const abi = ["function balanceOf(address owner) view returns (uint256)", "function transfer(address to, uint256 amount) public returns (bool)"];
        const contract = new ethers.Contract(contractAddr, abi, producerWallet);

        const scaledFunding = ethers.parseUnits("50000", 18);
        const tx = await contract.transfer(dexAddress, scaledFunding);
        await tx.wait();

        console.log("DEX AMM Funded.");

        const dexBal = await contract.balanceOf(dexAddress);
        console.log("DEX AMM JLT:", ethers.formatUnits(dexBal, 18));
    } catch (e) {
        console.error("Test Error", e);
    }
}
main();
