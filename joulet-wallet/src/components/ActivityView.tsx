import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { ArrowRightLeft, Cpu, Zap, Activity } from 'lucide-react';

const ActivityView: React.FC = () => {
    const { incidentLog, verifiedBatches } = useWalletStore();

    return (
        <div className="p-6 md:p-10 space-y-6 h-full relative z-10 flex flex-col">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-4">
                <Activity size={16} className="text-joulet-blue" />
                Network Activity Log
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto no-scrollbar pb-6 content-start">

                {/* Mock recent submissions */}
                {verifiedBatches > 0 && (
                    <div className="bg-[#151C2C]/60 backdrop-blur-xl p-5 rounded-[20px] border border-white/5 hover:border-joulet-green/30 hover:bg-[#151C2C]/80 transition-all cursor-pointer group shadow-lg flex items-start space-x-4 w-full">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-joulet-green/10 to-teal-500/10 flex flex-shrink-0 items-center justify-center text-joulet-green border border-joulet-green/20 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all">
                            <Zap size={20} className="fill-current/20" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <div className="font-bold text-white/90 text-sm md:text-base tracking-wide truncate">Batch Submitted</div>
                                <span className="text-[10px] font-bold text-joulet-green uppercase tracking-widest bg-joulet-green/10 px-2 py-0.5 rounded border border-joulet-green/20 shrink-0">Success</span>
                            </div>
                            <div className="text-xs text-joulet-green font-mono mt-1 bg-black/40 w-fit px-2.5 py-1 rounded border border-white/5 shadow-inner">+ {(verifiedBatches * 10).toFixed(2)} JLT Minted</div>
                            <div className="text-[10px] font-medium text-slate-500 mt-2.5 uppercase tracking-widest">Oracle Consensus</div>
                        </div>
                    </div>
                )}

                <div className="bg-[#151C2C]/60 backdrop-blur-xl p-5 rounded-[20px] border border-white/5 hover:border-joulet-blue/30 hover:bg-[#151C2C]/80 transition-all cursor-pointer group shadow-lg flex items-start space-x-4 w-full">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-joulet-blue/10 to-blue-500/10 flex flex-shrink-0 items-center justify-center text-joulet-blue border border-joulet-blue/20 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all">
                        <Cpu size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-white/90 text-sm md:text-base tracking-wide truncate">Device Registered</div>
                            <span className="text-[10px] font-bold text-joulet-blue uppercase tracking-widest bg-joulet-blue/10 px-2 py-0.5 rounded border border-joulet-blue/20 shrink-0">Active</span>
                        </div>
                        <div className="text-xs text-slate-300 font-mono mt-1 bg-black/40 w-fit px-2.5 py-1 rounded border border-white/5 shadow-inner truncate max-w-full">Pub: 0x8f...A1c</div>
                        <div className="text-[10px] font-medium text-slate-500 mt-2.5 uppercase tracking-widest">Smart Meter Node</div>
                    </div>
                </div>

                {incidentLog.map((log, idx) => (
                    <div key={idx} className="bg-red-950/20 backdrop-blur-xl border border-red-500/20 p-5 rounded-[20px] flex items-start space-x-4 shadow-lg hover:border-red-500/40 hover:bg-red-950/30 transition-all cursor-pointer group relative overflow-hidden w-full">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex flex-shrink-0 items-center justify-center text-red-500 border border-red-500/20 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all animate-pulse">
                            <ArrowRightLeft size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <div className="font-bold text-red-400 text-sm md:text-base tracking-wide truncate">Grid Event Logged</div>
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 shrink-0">Notice</span>
                            </div>
                            <div className="text-xs font-bold text-white/90 mt-1 bg-black/50 w-full px-2.5 py-1.5 rounded border border-white/5 shadow-inner break-words">{log}</div>
                        </div>
                    </div>
                ))}

                {incidentLog.length === 0 && verifiedBatches === 0 && (
                    <div className="md:col-span-2 text-center text-slate-500 py-20 flex flex-col items-center justify-center border border-white/5 rounded-[24px] bg-[#151C2C]/30 border-dashed w-full">
                        <Activity size={32} className="mb-4 opacity-30" />
                        <p className="tracking-widest uppercase text-xs font-bold">No recent network activity</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityView;
