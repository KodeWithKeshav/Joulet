import { ethers } from 'ethers';

export interface KeyPair {
    privateKey: string;
    publicKey: string;
    address: string;
}

class KeyManager {
    /**
     * Generates a new random wallet (for demo purposes)
     */
    static generateWallet(): KeyPair {
        const wallet = ethers.Wallet.createRandom();
        return {
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
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
     * Loads a wallet from a private key
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
