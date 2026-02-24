export const HARDHAT_NETWORK = {
    chainId: 31337,
    name: 'Hardhat Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    currencySymbol: 'ETH',
};

// Replace with deployed JouletToken address from blockchain/scripts/deploy.js output
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

class NetworkManager {
    static getProvider() {
        // dynamic import for lazy loads if necessary
        return HARDHAT_NETWORK.rpcUrl;
    }
}

export default NetworkManager;
