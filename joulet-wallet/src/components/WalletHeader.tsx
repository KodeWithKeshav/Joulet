import React from 'react';
import { Copy } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { HARDHAT_NETWORK } from '../core/networkManager';

const WalletHeader: React.FC = () => {
    const { walletKeys, isInitialized } = useWalletStore();

    const truncateAddress = (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const copyToClipboard = () => {
        if (walletKeys?.address) {
            navigator.clipboard.writeText(walletKeys.address);
            alert("Address copied to clipboard");
        }
    };

    if (!isInitialized) return null;

    return (
        <div className="bg-joulet-darker border-b border-gray-700 p-4 flex flex-col items-center justify-center space-y-3">
            {/* Top Row: Network & Logo */}
            <div className="w-full flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-white tracking-wider">⚡ Joulet</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800 rounded-full px-3 py-1 text-xs text-gray-300 border border-gray-600">
                    <div className="w-2 h-2 rounded-full bg-joulet-green animate-pulse"></div>
                    <span>{HARDHAT_NETWORK.name}</span>
                </div>
            </div>

            {/* Account Display */}
            <div
                onClick={copyToClipboard}
                className="group flex flex-col items-center cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors w-full"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-joulet-green to-blue-500 mb-2 border-2 border-transparent group-hover:border-joulet-green transition-all" />
                <span className="font-semibold text-lg">Account 1</span>
                <div className="flex items-center text-gray-400 text-sm mt-1 space-x-1 group-hover:text-gray-200">
                    <span>{truncateAddress(walletKeys?.address || '')}</span>
                    <Copy size={14} />
                </div>
            </div>
        </div>
    );
};

export default WalletHeader;
