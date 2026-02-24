import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Zap, Leaf, Activity, ArrowDownToLine, ArrowUpRight } from 'lucide-react';

const AssetView: React.FC = () => {
    const { jltBalance, carbonNfts, totalKwhGenerated, verifiedBatches } = useWalletStore();

    return (
        <div className="p-6 md:p-10 space-y-8 h-full relative z-10 flex flex-col justify-center">
            {/* Background Glow */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[60%] h-48 bg-joulet-green/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Primary Balance Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex-1 text-center md:text-left">
                    <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 flex items-center justify-center md:justify-start gap-2">
                        <Zap size={14} className="text-joulet-green" />
                        Available Energy Assets
                    </div>
                    <div className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-2 flex justify-center md:justify-start items-baseline gap-3 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] relative">
                        <div className="absolute inset-0 bg-joulet-green/10 blur-3xl rounded-full" />
                        <span className="relative z-10 tracking-tighter">{jltBalance.toFixed(2)}</span>
                        <span className="text-joulet-green text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-joulet-green to-teal-400 relative z-10 drop-shadow-[0_0_15px_rgba(0,230,118,0.5)]">JLT</span>
                    </div>
                    <div className="text-sm text-slate-500 font-mono font-medium flex items-center justify-center md:justify-start gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-joulet-green shadow-[0_0_8px_#00E676] animate-pulse" />
                        Live Synchronized • ≈ {totalKwhGenerated.toFixed(1)} kWh Verified
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex md:flex-col justify-center gap-4 relative z-10 shrink-0">
                    <div className="group flex items-center gap-4 cursor-pointer bg-joulet-blue/5 border border-joulet-blue/20 px-6 py-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-joulet-blue/10 hover:border-joulet-blue/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] hover:-translate-y-1 transition-all duration-300">
                        <div className="w-10 h-10 rounded-full bg-joulet-blue/10 flex items-center justify-center">
                            <ArrowDownToLine size={18} className="text-joulet-blue group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-xs font-black text-white/90 group-hover:text-joulet-blue tracking-widest uppercase transition-colors hidden sm:block">Receive</span>
                    </div>
                    <div className="group flex items-center gap-4 cursor-pointer bg-joulet-blue/5 border border-joulet-blue/20 px-6 py-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-joulet-blue/10 hover:border-joulet-blue/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] hover:-translate-y-1 transition-all duration-300">
                        <div className="w-10 h-10 rounded-full bg-joulet-blue/10 flex items-center justify-center">
                            <ArrowUpRight size={18} className="text-joulet-blue group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-xs font-black text-white/90 group-hover:text-joulet-blue tracking-widest uppercase transition-colors hidden sm:block">Send</span>
                    </div>
                </div>
            </div>

            {/* Sub-Asset Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 relative z-10 pt-8 border-t border-white/5">
                <div className="flex flex-col justify-between bg-[#151C2C]/60 backdrop-blur-xl p-6 rounded-[20px] border border-white/5 hover:border-emerald-500/30 hover:bg-[#151C2C]/80 transition-all cursor-pointer group shadow-xl hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)] hover:-translate-y-1">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                            <Leaf size={20} className="fill-current/20" />
                        </div>
                        <div>
                            <div className="font-black text-white/90 text-[15px] tracking-wide">Carbon NFTs</div>
                            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Verified Offsets</div>
                        </div>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tighter">{carbonNfts}</div>
                </div>

                <div className="flex flex-col justify-between bg-[#151C2C]/60 backdrop-blur-xl p-6 rounded-[20px] border border-white/5 hover:border-yellow-500/30 hover:bg-[#151C2C]/80 transition-all cursor-pointer group shadow-xl hover:shadow-[0_10px_40px_-10px_rgba(234,179,8,0.2)] hover:-translate-y-1">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 group-hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all">
                            <Zap size={20} className="fill-current/20" />
                        </div>
                        <div>
                            <div className="font-black text-white/90 text-[15px] tracking-wide">Total Protocol Yield</div>
                            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Lifetime Production</div>
                        </div>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tighter">
                        {totalKwhGenerated.toFixed(1)} <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">kWh</span>
                    </div>
                </div>

                <div className="flex flex-col justify-between bg-[#151C2C]/60 backdrop-blur-xl p-6 rounded-[20px] border border-white/5 hover:border-purple-500/30 hover:bg-[#151C2C]/80 transition-all cursor-pointer group shadow-xl hover:shadow-[0_10px_40px_-10px_rgba(168,85,247,0.2)] hover:-translate-y-1">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">
                            <Activity size={20} />
                        </div>
                        <div>
                            <div className="font-black text-white/90 text-[15px] tracking-wide">Network Consensus</div>
                            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Batches Authenticated</div>
                        </div>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tighter">{verifiedBatches}</div>
                </div>
            </div>
        </div>
    );
};

export default AssetView;
