import React, { useState } from 'react';
import { useWalletStore } from '../store/walletStore';

import SendModal from './SendModal';
import SwapModal from './SwapModal';
import DepositModal from './DepositModal';

const AssetView: React.FC = () => {
    const { jltBalance, getFiatBalance, carbonNfts, totalKwhGenerated, verifiedBatches, walletKeys } = useWalletStore();

    const [isSendOpen, setIsSendOpen] = useState(false);
    const [isSwapOpen, setIsSwapOpen] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);

    const handleReceive = () => {
        if (walletKeys?.address) {
            navigator.clipboard.writeText(walletKeys.address);
            alert("Wallet address copied to clipboard!");
        }
    }

    return (
        <div className="p-6 md:p-8 space-y-6 h-full relative z-10 flex flex-col justify-center">

            {/* Primary Balance Section */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-start justify-start gap-8 md:gap-14">
                    {/* JLT Balance */}
                    <div>
                        <div className="text-xs font-medium text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                            <img src="/yield-icon.png" className="w-6 h-6 object-contain" alt="JLT" />
                            Joulet Energy Token
                        </div>
                        <div className="text-5xl md:text-6xl font-black text-white mb-1 flex items-baseline gap-2 tracking-tight">
                            <span>{jltBalance.toFixed(2)}</span>
                            <span className="text-joulet-green text-2xl font-bold">JLT</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-joulet-green animate-pulse" />
                            Live Ledgers • ≈ {totalKwhGenerated.toFixed(1)} kWh Verified
                        </div>
                    </div>

                    {/* Fiat Balance */}
                    <div className="pl-8 border-l border-white/8">
                        <div className="text-xs font-medium text-slate-400 tracking-wider uppercase mb-1.5">
                            Cash Deposit
                        </div>
                        <div className="text-5xl md:text-6xl font-black text-white mb-1 flex items-baseline gap-1 tracking-tight">
                            <span className="text-emerald-500 text-xl font-bold relative top-[-12px]">$</span>
                            <span>{getFiatBalance().toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-2">
                            USD Current Balance
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <ActionButton onClick={handleReceive} icon={<img src="/solar-icon.png" className="w-8 h-8 object-contain" alt="Receive" />} label="Receive" color="joulet-green" />
                    <ActionButton onClick={() => setIsSendOpen(true)} icon={<img src="/building-icon.png" className="w-8 h-8 object-contain" alt="Send" />} label="Send" color="joulet-blue" />
                    <ActionButton onClick={() => setIsSwapOpen(true)} icon={<img src="/trade-icon.png" className="w-8 h-8 object-contain" alt="Trade JLT" />} label="Trade JLT" color="joulet-indigo" />
                    <ActionButton onClick={() => setIsDepositOpen(true)} icon={<img src="/home-icon.png" className="w-8 h-8 object-contain" alt="Bank Wire" />} label="Bank Wire" color="joulet-green" />
                </div>
            </div>


            {/* Mobile Fiat */}
            <div className="md:hidden flex justify-between items-center bg-[#0f172a] border border-white/5 rounded-xl p-4">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available Cash</span>
                <span className="text-2xl font-black text-white"><span className="text-emerald-500 mr-1">$</span>{getFiatBalance().toFixed(2)}</span>
            </div>

            {/* Sub-Asset Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 border-t border-white/5">
                <StatCard
                    icon={<img src="/nft-icon.png" alt="Carbon NFT" className="w-[110%] h-[110%] object-contain" />}
                    iconColor="text-emerald-400"
                    iconBg="bg-emerald-500/0"
                    title="Carbon NFTs"
                    subtitle="Verified Offsets"
                    value={String(carbonNfts)}
                    hoverColor="hover:border-emerald-500/20"
                />
                <StatCard
                    icon={<img src="/yield-icon.png" alt="Protocol Yield" className="w-[110%] h-[110%] object-contain scale-110" />}
                    iconColor="text-joulet-amber"
                    iconBg="bg-joulet-amber/0"
                    title="Total Protocol Yield"
                    subtitle="Lifetime Production"
                    value={`${totalKwhGenerated.toFixed(1)}`}
                    unit="kWh"
                    hoverColor="hover:border-joulet-amber/20"
                />
                <StatCard
                    icon={<img src="/consensus-icon.png" alt="Network Consensus" className="w-[110%] h-[110%] object-contain scale-110" />}
                    iconColor="text-joulet-indigo"
                    iconBg="bg-joulet-indigo/0"
                    title="Network Consensus"
                    subtitle="Batches Authenticated"
                    value={String(verifiedBatches)}
                    hoverColor="hover:border-joulet-indigo/20"
                />
            </div>

            <SendModal isOpen={isSendOpen} onClose={() => setIsSendOpen(false)} />
            <SwapModal isOpen={isSwapOpen} onClose={() => setIsSwapOpen(false)} />
            <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
        </div>
    );
};

// Simple action button
function ActionButton({ onClick, icon, label, color }: { onClick: () => void, icon: React.ReactNode, label: string, color: string }) {
    return (
        <div
            onClick={onClick}
            className={`group flex flex-col items-center gap-1.5 cursor-pointer bg-${color}/5 border border-${color}/15 px-5 py-3 rounded-xl hover:bg-${color}/10 hover:border-${color}/30 hover:-translate-y-0.5 transition-all`}
        >
            <div className={`text-${color} group-hover:scale-110 transition-transform`}>{icon}</div>
            <span className={`text-[10px] font-semibold text-white/80 group-hover:text-${color} tracking-wider uppercase transition-colors`}>{label}</span>
        </div>
    );
}

// Simple stat card
function StatCard({ icon, iconColor, iconBg, title, subtitle, value, unit, hoverColor }: {
    icon: React.ReactNode, iconColor: string, iconBg: string, title: string, subtitle: string, value: string, unit?: string, hoverColor: string
}) {
    return (
        <div className={`bg-[#1e293b]/50 backdrop-blur-sm p-5 rounded-xl border border-white/5 ${hoverColor} transition-all cursor-pointer group`}>
            <div className="flex items-center space-x-3 mb-3">
                <div className={`w-14 h-14 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} border border-white/5`}>
                    {icon}
                </div>
                <div>
                    <div className="font-semibold text-white/90 text-sm">{title}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{subtitle}</div>
                </div>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
                {value} {unit && <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{unit}</span>}
            </div>
        </div>
    );
}

export default AssetView;
