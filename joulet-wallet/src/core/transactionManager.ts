import { ethers } from 'ethers';

const HARDHAT_RPC = 'http://127.0.0.1:8545';
const API_URL = 'http://localhost:5004/api/status';

class TransactionManager {
    static async getContractAddress(): Promise<string> {
        try {
            const res = await fetch(API_URL);
            const data = await res.json();
            if (data.contract?.address) {
                return data.contract.address;
            }
            throw new Error("Contract address missing from API response");
        } catch {
            throw new Error("Failed to fetch contract address from API/Bridge");
        }
    }

    static async submitBatch(privateKey: string, energyAmount: number, merkleRoot: string): Promise<string> {
        const provider = new ethers.JsonRpcProvider(HARDHAT_RPC);
        const wallet = new ethers.Wallet(privateKey, provider);

        const contractAddr = await TransactionManager.getContractAddress();

        // Standard ABI for JouletToken
        const abi = [
            "function submitVerifiedBatch(uint256 amount, bytes32 merkleRoot) public"
        ];

        const contract = new ethers.Contract(contractAddr, abi, wallet);

        try {
            // Amount comes in as kWh (float), scale to 1e18 uint
            const scaledAmount = ethers.parseUnits(energyAmount.toString(), 18);

            const tx = await contract.submitVerifiedBatch(
                scaledAmount,
                merkleRoot
            );

            console.log("Transaction broadcasted:", tx.hash);
            const receipt = await tx.wait(); // Wait for confirmation

            if (receipt.status === 0) {
                throw new Error("Transaction reverted on-chain");
            }
            return tx.hash;
        } catch (err: any) {
            console.error("Blockchain TX Error:", err);

            // Try to extract readable revert reason if available
            if (err.reason) {
                throw new Error(err.reason);
            }
            throw new Error("Transaction failed. Make sure the local node is running and the wallet has ETH for gas.");
        }
    }
}

export default TransactionManager;
