import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Copy, CheckCircle2 } from 'lucide-react';

const WalletHeader: React.FC = () => {
    const { walletKeys, isInitialized } = useWalletStore();
    const network = { name: 'Joulet Protocol' };
    const [copied, setCopied] = React.useState(false);

    if (!isInitialized || !walletKeys) return null;

    const truncateAddress = (addr: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(walletKeys.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#05080E]/40 backdrop-blur-md p-4 border-b border-white/5 flex justify-between items-center relative z-10 shrink-0">
            {/* Left: Branding & Network */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-joulet-green to-teal-600 flex items-center justify-center shadow-[0_0_10px_rgba(0,230,118,0.4)]">
                        <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white">
                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
                        </svg>
                    </div>
                    <span className="font-black text-white tracking-wider text-sm">JOULET</span>
                </div>

                <div className="flex items-center space-x-1.5 bg-white/5 rounded-full px-2 py-0.5 border border-white/10 w-max">
                    <div className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-joulet-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-joulet-green shadow-[0_0_5px_#00E676]"></span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{network.name}</span>
                </div>
            </div>

            {/* Right: Account & Avatar */}
            <div className="flex items-center space-x-3">
                <div
                    onClick={handleCopy}
                    className="group flex flex-col items-end cursor-pointer"
                >
                    <span className="font-bold text-xs text-white/90 group-hover:text-white transition-colors">Account 1</span>
                    <div className="flex items-center text-slate-400 text-[10px] mt-0.5 space-x-1 group-hover:text-joulet-blue transition-colors">
                        <span className="font-mono tracking-wider">{truncateAddress(walletKeys.address)}</span>
                        {copied ? (
                            <CheckCircle2 size={10} className="text-joulet-green" />
                        ) : (
                            <Copy size={10} />
                        )}
                    </div>
                </div>

                <div className="relative group cursor-pointer">
                    {/* Glow behind avatar */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-joulet-blue to-purple-600 rounded-full blur-sm opacity-40 group-hover:opacity-100 group-hover:duration-200 transition-opacity duration-1000"></div>

                    <div className="w-9 h-9 relative rounded-full bg-gradient-to-br from-[#00E5FF] via-blue-500 to-purple-600 border border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
                        {/* Inner detail to look like abstract identicon */}
                        <div className="absolute inset-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/10" />
                        <div className="absolute inset-2 rounded-full bg-gradient-to-tl from-transparent to-white/30" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletHeader;
