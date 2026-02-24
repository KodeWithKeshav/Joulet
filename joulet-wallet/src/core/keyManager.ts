import { ethers } from 'ethers';

export interface KeyPair {
    privateKey: string;
    publicKey: string;
    address: string;
}

export const HARDHAT_PROFILES = [
    {
        id: 0,
        name: 'Producer',
        role: 'Solar Farm Node',
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' // Hardhat Account #0
    },
    {
        id: 1,
        name: 'Consumer A',
        role: 'Residential Node',
        privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' // Hardhat Account #1
    },
    {
        id: 2,
        name: 'Consumer B',
        role: 'Commercial Node',
        privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' // Hardhat Account #2
    }
];

class KeyManager {
    /**
     * Loads a deterministic Hardhat profile by index
     */
    static loadProfile(index: number): KeyPair {
        if (index < 0 || index >= HARDHAT_PROFILES.length) {
            throw new Error("Invalid Profile Index");
        }

        const profile = HARDHAT_PROFILES[index];
        const wallet = new ethers.Wallet(profile.privateKey);

        return {
            privateKey: wallet.privateKey,
            publicKey: wallet.signingKey.publicKey,
            address: wallet.address
        };
    }

    /**
     * Generates a device-specific keypair
     * In a real architecture, this would happen physically on the IoT device
     * and only the public key would be pushed to the wallet.
     */
    static generateDeviceKeys(): KeyPair {
        const device = ethers.Wallet.createRandom();
        return {
            privateKey: device.privateKey,
            publicKey: device.publicKey,
            address: device.address
        };
    }

    /**
     * Loads a wallet from a private key string directly
     */
    static loadWallet(privateKey: string): KeyPair {
        const wallet = new ethers.Wallet(privateKey);
        return {
            privateKey: wallet.privateKey,
            publicKey: wallet.signingKey.publicKey,
            address: wallet.address
        };
    }
}

export default KeyManager;
