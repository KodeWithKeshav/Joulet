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
        <div className="bg-joulet-dark border-b border-white/5 p-5 flex flex-col items-center justify-center relative">
            {/* Top Row: Network & Logo */}
            <div className="w-full flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-joulet-green to-teal-400 bg-clip-text text-transparent tracking-widest flex items-center">
                        <svg className="w-4 h-4 mr-2 text-joulet-green fill-current" viewBox="0 0 24 24">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        JOULET
                    </span>
                </div>
                <div className="flex items-center space-x-2 bg-joulet-card rounded-full px-3 py-1.5 text-xs text-blue-200 border border-white/10 shadow-inner">
                    <div className="w-2 h-2 rounded-full bg-joulet-green shadow-[0_0_8px_#00E676] animate-pulse"></div>
                    <span className="opacity-90">{HARDHAT_NETWORK.name}</span>
                </div>
            </div>

            {/* Account Display */}
            <div
                onClick={copyToClipboard}
                className="group flex flex-col items-center cursor-pointer p-3 w-full rounded-2xl hover:bg-white/5 transition-all duration-300"
            >
                {/* Generated style Avatar */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00E5FF] via-blue-500 to-purple-600 mb-3 shadow-[0_0_15px_rgba(0,229,255,0.4)] border border-white/20 group-hover:scale-105 transition-transform" />

                <span className="font-bold text-lg text-white group-hover:text-joulet-blue transition-colors">Account 1</span>

                <div className="flex items-center bg-black/40 px-3 py-1 rounded-full text-gray-400 text-xs mt-2 space-x-2 border border-white/5 group-hover:border-joulet-blue/30 transition-all">
                    <span className="font-mono">{truncateAddress(walletKeys?.address || '')}</span>
                    <Copy size={12} className="group-hover:text-joulet-blue" />
                </div>
            </div>
        </div>
    );
};

export default WalletHeader;
