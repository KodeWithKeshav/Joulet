import { ethers } from 'ethers';

const HARDHAT_RPC = 'http://127.0.0.1:8545';
const API_URL = 'http://localhost:5004/api/status';

class TransactionManager {
    static readonly DEX_PRIVATE_KEY = '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6'; // Hardhat Account #9

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

    static async initDexPool(producerPrivateKey: string): Promise<void> {
        try {
            const provider = new ethers.JsonRpcProvider(HARDHAT_RPC);
            const contractAddr = await TransactionManager.getContractAddress();
            const dexWallet = new ethers.Wallet(TransactionManager.DEX_PRIVATE_KEY, provider);

            const abi = ["function balanceOf(address owner) view returns (uint256)", "function transfer(address to, uint256 amount) public returns (bool)"];
            const dexContract = new ethers.Contract(contractAddr, abi, dexWallet);

            const rawBalance = await dexContract.balanceOf(dexWallet.address);
            const dexBalance = parseFloat(ethers.formatUnits(rawBalance, 18));

            // If the DEX has less than 10,000 JLT, we siphon 50,000 from the Producer to bootstrap the local pool so trades don't fail immediately
            if (dexBalance < 10000) {
                console.log("[DEX] Initializing AMM Liquidity Pool...");
                const producerWallet = new ethers.Wallet(producerPrivateKey, provider);
                const producerContract = new ethers.Contract(contractAddr, abi, producerWallet);
                const scaledFunding = ethers.parseUnits("50000", 18);
                const tx = await producerContract.transfer(dexWallet.address, scaledFunding);
                await tx.wait();
                console.log("[DEX] Liquidity Pool Seeded.");
            }
        } catch (e) {
            console.error("Failed to init DEX Pool:", e);
        }
    }

    static async submitBatch(privateKey: string, energyAmount: number, merkleRoot: string): Promise<string> {
        const provider = new ethers.JsonRpcProvider(HARDHAT_RPC);
        const wallet = new ethers.Wallet(privateKey, provider);
        const contractAddr = await TransactionManager.getContractAddress();
        const abi = ["function submitVerifiedBatch(uint256 amount, bytes32 merkleRoot) public"];
        const contract = new ethers.Contract(contractAddr, abi, wallet);

        try {
            const scaledAmount = ethers.parseUnits(energyAmount.toString(), 18);
            const tx = await contract.submitVerifiedBatch(scaledAmount, merkleRoot);
            const receipt = await tx.wait();
            if (receipt.status === 0) throw new Error("Transaction reverted on-chain");
            return tx.hash;
        } catch (err: any) {
            console.error("Blockchain TX Error:", err);
            if (err.reason) throw new Error(err.reason);
            throw new Error("Transaction failed. Make sure the local node is running and the wallet has ETH for gas.");
        }
    }

    static async transferTokens(privateKey: string, toAddress: string, amount: number): Promise<string> {
        const provider = new ethers.JsonRpcProvider(HARDHAT_RPC);
        const wallet = new ethers.Wallet(privateKey, provider);
        const contractAddr = await TransactionManager.getContractAddress();

        // Standard ERC20 transfer
        const abi = ["function transfer(address to, uint256 amount) public returns (bool)"];
        const contract = new ethers.Contract(contractAddr, abi, wallet);

        try {
            const scaledAmount = ethers.parseUnits(amount.toString(), 18);
            const tx = await contract.transfer(toAddress, scaledAmount);
            const receipt = await tx.wait();

            if (receipt.status === 0) throw new Error("Transfer reverted on-chain");
            return tx.hash;
        } catch (err: any) {
            console.error("Transfer Error:", err);
            if (err.reason) throw new Error(err.reason);
            throw new Error("Transfer failed. Verify address format and Token Balance.");
        }
    }

    static async executeOnChainSwap(userPrivateKey: string, type: 'buy' | 'sell', jltAmount: number): Promise<string> {
        const provider = new ethers.JsonRpcProvider(HARDHAT_RPC);
        const contractAddr = await TransactionManager.getContractAddress();
        const abi = ["function transfer(address to, uint256 amount) public returns (bool)"];

        const userWallet = new ethers.Wallet(userPrivateKey, provider);
        const dexWallet = new ethers.Wallet(TransactionManager.DEX_PRIVATE_KEY, provider);

        try {
            const scaledAmount = ethers.parseUnits(jltAmount.toString(), 18);

            if (type === 'buy') {
                // DEX transfers TO User
                const dexContract = new ethers.Contract(contractAddr, abi, dexWallet);
                const tx = await dexContract.transfer(userWallet.address, scaledAmount);
                const receipt = await tx.wait();
                if (receipt.status === 0) throw new Error("AMM Transfer Reverted");
                return tx.hash;
            } else {
                // User transfers TO DEX
                const userContract = new ethers.Contract(contractAddr, abi, userWallet);
                const tx = await userContract.transfer(dexWallet.address, scaledAmount);
                const receipt = await tx.wait();
                if (receipt.status === 0) throw new Error("User Transfer Reverted");
                return tx.hash;
            }
        } catch (err: any) {
            console.error("DEX Swap Error:", err);
            if (err.reason) throw new Error(err.reason);
            throw new Error("DEX execution failed.");
        }
    }
}

export default TransactionManager;
