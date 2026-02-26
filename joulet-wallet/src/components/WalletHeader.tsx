import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { HARDHAT_PROFILES } from '../core/keyManager';
import { Copy, CheckCircle2 } from 'lucide-react';

const WalletHeader: React.FC = () => {
    const { walletKeys, authStatus, activeProfileId } = useWalletStore();
    const network = { name: 'Joulet Protocol' };
    const [copied, setCopied] = React.useState(false);

    if (authStatus === 'locked' || !walletKeys || activeProfileId === null) return null;

    const currentProfile = HARDHAT_PROFILES.find(p => p.id === activeProfileId);
    const profileName = currentProfile ? currentProfile.name : 'Unknown Persona';

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
        <div className="bg-[#0a0f1e]/60 backdrop-blur-md p-4 border-b border-white/5 flex justify-between items-center relative z-10 shrink-0">
            {/* Left: Branding & Network */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center space-x-2">
                    <img src="/mascot.png" alt="Joulet" className="w-5 h-5 object-contain" />
                    <span className="font-display font-black text-white tracking-wide text-sm">JOULET</span>
                </div>

                <div className="flex items-center space-x-1.5 bg-white/5 rounded-full px-2 py-0.5 border border-white/5 w-max">
                    <div className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-joulet-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-joulet-green"></span>
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{network.name}</span>
                </div>
            </div>

            {/* Right: Account & Avatar */}
            <div className="flex items-center space-x-3">
                <div
                    onClick={handleCopy}
                    className="group flex flex-col items-end cursor-pointer"
                >
                    <span className="font-semibold text-xs text-white/90">{profileName}</span>
                    <div className="flex items-center text-slate-400 text-[10px] mt-0.5 space-x-1 group-hover:text-joulet-teal transition-colors">
                        <span className="font-mono tracking-wider">{truncateAddress(walletKeys.address)}</span>
                        {copied ? (
                            <CheckCircle2 size={10} className="text-joulet-green" />
                        ) : (
                            <Copy size={10} />
                        )}
                    </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-joulet-green to-joulet-teal border border-white/10"></div>
            </div>
        </div>
    );
};

export default WalletHeader;
