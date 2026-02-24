import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Zap, Leaf, Activity, ArrowDownToLine, ArrowUpRight } from 'lucide-react';

const AssetView: React.FC = () => {
    const { jltBalance, carbonNfts, totalKwhGenerated, verifiedBatches } = useWalletStore();

    return (
        <div className="p-6 space-y-6 h-full relative z-10 flex flex-col">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-joulet-green/10 blur-[80px] rounded-full pointer-events-none" />

            {/* Primary Balance */}
            <div className="text-center pt-6 pb-4 relative animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="text-4xl font-black text-white mb-1 flex justify-center items-center gap-2 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] relative">
                    <div className="absolute inset-0 bg-joulet-green/20 blur-2xl rounded-full" />
                    <span className="relative z-10">{jltBalance.toFixed(2)}</span>
                    <span className="text-joulet-green text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-joulet-green to-teal-400 relative z-10 drop-shadow-[0_0_8px_rgba(0,230,118,0.5)]">JLT</span>
                </div>
                <div className="text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1">Joulet Energy Token</div>
                <div className="text-[10px] text-slate-500 font-mono font-medium">≈ {totalKwhGenerated} kWh Verified</div>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center space-x-10 mb-2 pb-6 border-b border-white/5 relative z-10">
                <div className="group flex flex-col items-center cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-joulet-blue/5 border border-joulet-blue/20 flex items-center justify-center mb-2 shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:bg-joulet-blue/20 group-hover:border-joulet-blue/50 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] group-hover:-translate-y-1 transition-all duration-300">
                        <ArrowDownToLine size={16} className="text-joulet-blue group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-joulet-blue tracking-widest uppercase transition-colors">Receive</span>
                </div>
                <div className="group flex flex-col items-center cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-joulet-blue/5 border border-joulet-blue/20 flex items-center justify-center mb-2 shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:bg-joulet-blue/20 group-hover:border-joulet-blue/50 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] group-hover:-translate-y-1 transition-all duration-300">
                        <ArrowUpRight size={16} className="text-joulet-blue group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-joulet-blue tracking-widest uppercase transition-colors">Send</span>
                </div>
            </div>

            {/* Asset List */}
            <div className="space-y-3 relative z-10 flex-1">
                <div className="flex items-center justify-between bg-[#151C2C]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/5 hover:border-emerald-500/30 hover:bg-[#151C2C]/80 transition-all cursor-pointer group shadow-lg">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all">
                            <Leaf size={18} className="fill-current/20" />
                        </div>
                        <div>
                            <div className="font-bold text-white/90 text-sm tracking-wide">Carbon NFTs</div>
                            <div className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">Verified Offsets</div>
                        </div>
                    </div>
                    <div className="text-lg font-black text-white">{carbonNfts}</div>
                </div>

                <div className="flex items-center justify-between bg-[#151C2C]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/5 hover:border-yellow-500/30 hover:bg-[#151C2C]/80 transition-all cursor-pointer group shadow-lg">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all">
                            <Zap size={18} className="fill-current/20" />
                        </div>
                        <div>
                            <div className="font-bold text-white/90 text-sm tracking-wide">Total Output</div>
                            <div className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">Lifetime Generated</div>
                        </div>
                    </div>
                    <div className="text-lg font-black align-baseline text-white">
                        {totalKwhGenerated} <span className="text-xs font-semibold text-slate-500">kWh</span>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-[#151C2C]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/5 hover:border-purple-500/30 hover:bg-[#151C2C]/80 transition-all cursor-pointer group shadow-lg">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                            <Activity size={18} />
                        </div>
                        <div>
                            <div className="font-bold text-white/90 text-sm tracking-wide">Verified Batches</div>
                            <div className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">Oracle Consensus</div>
                        </div>
                    </div>
                    <div className="text-lg font-black text-white">{verifiedBatches}</div>
                </div>
            </div>
        </div>
    );
};

export default AssetView;
