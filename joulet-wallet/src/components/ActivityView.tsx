import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { ArrowRightLeft, Cpu, Zap, Activity } from 'lucide-react';

const ActivityView: React.FC = () => {
    const { incidentLog, verifiedBatches } = useWalletStore();

    return (
        <div className="p-6 space-y-4 h-full relative z-10 flex flex-col">
            <h2 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} className="text-joulet-blue" />
                Network Activity
            </h2>

            <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-1">
                {/* Mock recent submissions */}
                {verifiedBatches > 0 && (
                    <div className="bg-[#151C2C]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/5 hover:border-joulet-green/30 hover:bg-[#151C2C]/80 transition-all cursor-pointer group shadow-lg flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-joulet-green/10 to-teal-500/10 flex flex-shrink-0 items-center justify-center text-joulet-green border border-joulet-green/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all">
                            <Zap size={16} className="fill-current/20" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div className="font-bold text-white/90 text-sm tracking-wide">Batch Submitted</div>
                                <span className="text-[9px] font-bold text-joulet-green uppercase tracking-widest bg-joulet-green/10 px-2 py-0.5 rounded border border-joulet-green/20">Success</span>
                            </div>
                            <div className="text-[11px] text-joulet-green font-mono mt-1 bg-black/40 w-fit px-2 py-0.5 rounded border border-white/5 shadow-inner">+ {verifiedBatches * 10} JLT Minted</div>
                            <div className="text-[9px] font-medium text-slate-500 mt-2 uppercase tracking-widest">Oracle Consensus</div>
                        </div>
                    </div>
                )}

                <div className="bg-[#151C2C]/60 backdrop-blur-xl p-3.5 rounded-2xl border border-white/5 hover:border-joulet-blue/30 hover:bg-[#151C2C]/80 transition-all cursor-pointer group shadow-lg flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-joulet-blue/10 to-blue-500/10 flex flex-shrink-0 items-center justify-center text-joulet-blue border border-joulet-blue/20 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all">
                        <Cpu size={16} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div className="font-bold text-white/90 text-sm tracking-wide">Device Registered</div>
                            <span className="text-[9px] font-bold text-joulet-blue uppercase tracking-widest bg-joulet-blue/10 px-2 py-0.5 rounded border border-joulet-blue/20">Active</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono mt-1 bg-black/40 w-fit px-2 py-0.5 rounded border border-white/5 shadow-inner">Pub: 0x8f...A1c</div>
                        <div className="text-[9px] font-medium text-slate-500 mt-2 uppercase tracking-widest">Smart Meter Node</div>
                    </div>
                </div>

                {incidentLog.map((log, idx) => (
                    <div key={idx} className="bg-red-950/20 backdrop-blur-xl border border-red-500/20 p-3.5 rounded-2xl flex items-start space-x-3 shadow-lg hover:border-red-500/40 hover:bg-red-950/30 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex flex-shrink-0 items-center justify-center text-red-500 border border-red-500/20 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all animate-pulse">
                            <ArrowRightLeft size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div className="font-bold text-red-400 text-sm tracking-wide">Brownout Event</div>
                                <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Critical</span>
                            </div>
                            <div className="text-[11px] font-bold text-white/90 mt-1 bg-black/50 w-fit px-2 py-0.5 rounded border border-white/5 shadow-inner">{log}</div>
                            <div className="text-[9px] font-medium text-red-400/80 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_#EF4444] animate-ping" /> Emergency Flush
                            </div>
                        </div>
                    </div>
                ))}

                {incidentLog.length === 0 && verifiedBatches === 0 && (
                    <div className="text-center text-slate-500 py-12 flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-[#151C2C]/30 border-dashed">
                        <Activity size={24} className="mb-2 opacity-30" />
                        <p className="tracking-widest uppercase text-[10px] font-bold">No recent network activity</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityView;
