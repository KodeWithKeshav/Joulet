import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Zap, Leaf, Activity, ArrowDownToLine, ArrowUpRight } from 'lucide-react';

const AssetView: React.FC = () => {
    const { jltBalance, carbonNfts, totalKwhGenerated, verifiedBatches } = useWalletStore();

    return (
        <div className="p-5 space-y-5 bg-joulet-dark relative h-full">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-joulet-green/10 blur-[60px] rounded-full pointer-events-none" />

            {/* Primary Balance */}
            <div className="text-center py-8 relative">
                <div className="text-5xl font-black text-white mb-2 flex justify-center items-center gap-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                    {jltBalance.toFixed(2)} <span className="text-joulet-green text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-joulet-green to-teal-400">JLT</span>
                </div>
                <div className="text-sm font-medium text-gray-500 tracking-wide uppercase">Joulet Energy Token</div>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center space-x-12 mb-6 pb-6 border-b border-white/5 relative">
                <div className="group flex flex-col items-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-full bg-joulet-blue/10 border border-joulet-blue/30 flex items-center justify-center mb-3 group-hover:bg-joulet-blue/20 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all">
                        <ArrowDownToLine size={20} className="text-joulet-blue" />
                    </div>
                    <span className="text-xs font-bold text-joulet-blue tracking-wide">RECEIVE</span>
                </div>
                <div className="group flex flex-col items-center cursor-pointer transition-all duration-300 transform hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-full bg-joulet-blue/10 border border-joulet-blue/30 flex items-center justify-center mb-3 group-hover:bg-joulet-blue/20 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all">
                        <ArrowUpRight size={20} className="text-joulet-blue" />
                    </div>
                    <span className="text-xs font-bold text-joulet-blue tracking-wide">SEND</span>
                </div>
            </div>

            {/* Asset List */}
            <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between bg-joulet-card/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-joulet-green/30 hover:bg-white/5 transition-all cursor-pointer group shadow-lg">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all">
                            <Leaf size={22} className="fill-current/20" />
                        </div>
                        <div>
                            <div className="font-bold text-white text-base">Carbon NFTs</div>
                            <div className="text-xs text-slate-400 font-medium tracking-wide">Verified Offsets</div>
                        </div>
                    </div>
                    <div className="text-xl font-black text-white">{carbonNfts}</div>
                </div>

                <div className="flex items-center justify-between bg-joulet-card/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-yellow-500/30 hover:bg-white/5 transition-all cursor-pointer group shadow-lg">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30 group-hover:shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all">
                            <Zap size={22} className="fill-current/20" />
                        </div>
                        <div>
                            <div className="font-bold text-white text-base">Total Output</div>
                            <div className="text-xs text-slate-400 font-medium tracking-wide">Lifetime generated</div>
                        </div>
                    </div>
                    <div className="text-xl font-black align-baseline text-white">
                        {totalKwhGenerated} <span className="text-sm font-semibold text-slate-500">kWh</span>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-joulet-card/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 hover:border-purple-500/30 hover:bg-white/5 transition-all cursor-pointer group shadow-lg">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all">
                            <Activity size={22} />
                        </div>
                        <div>
                            <div className="font-bold text-white text-base">Verified Batches</div>
                            <div className="text-xs text-slate-400 font-medium tracking-wide">Oracle consensus</div>
                        </div>
                    </div>
                    <div className="text-xl font-black text-white">{verifiedBatches}</div>
                </div>
            </div>
        </div>
    );
};

export default AssetView;
