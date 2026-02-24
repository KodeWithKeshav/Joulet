import { ethers } from "ethers";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    try {
        const code = await provider.getCode("0x5FbDB2315678afecb367f032d93F642f64180aa3");
        console.log("Code at address:", code);
    } catch (e) {
        console.error("Test error", e);
    }
}
main();
