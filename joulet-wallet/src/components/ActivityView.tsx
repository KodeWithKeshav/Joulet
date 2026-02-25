import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { ArrowRightLeft, Cpu, Zap, Activity } from 'lucide-react';

const ActivityView: React.FC = () => {
    const { incidentLog, verifiedBatches } = useWalletStore();

    return (
        <div className="p-6 md:p-8 space-y-5 h-full relative z-10 flex flex-col">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
                <Activity size={14} className="text-joulet-blue" />
                Network Activity Log
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto no-scrollbar pb-4 content-start">

                {verifiedBatches > 0 && (
                    <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-white/5 hover:border-joulet-green/20 transition-all cursor-pointer flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-joulet-green/8 flex shrink-0 items-center justify-center text-joulet-green border border-joulet-green/15">
                            <Zap size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-white/90 text-sm">Batch Submitted</span>
                                <span className="text-[9px] font-medium text-joulet-green uppercase tracking-wider bg-joulet-green/8 px-2 py-0.5 rounded border border-joulet-green/15 shrink-0">Success</span>
                            </div>
                            <div className="text-xs text-joulet-green font-mono mt-1 bg-black/20 w-fit px-2 py-1 rounded border border-white/5">+ {(verifiedBatches * 10).toFixed(2)} JLT Minted</div>
                            <div className="text-[10px] text-slate-500 mt-2 tracking-wider">Oracle Consensus</div>
                        </div>
                    </div>
                )}

                <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-white/5 hover:border-joulet-blue/20 transition-all cursor-pointer flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-joulet-blue/8 flex shrink-0 items-center justify-center text-joulet-blue border border-joulet-blue/15">
                        <Cpu size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-white/90 text-sm">Device Registered</span>
                            <span className="text-[9px] font-medium text-joulet-blue uppercase tracking-wider bg-joulet-blue/8 px-2 py-0.5 rounded border border-joulet-blue/15 shrink-0">Active</span>
                        </div>
                        <div className="text-xs text-slate-300 font-mono mt-1 bg-black/20 w-fit px-2 py-1 rounded border border-white/5 truncate max-w-full">Pub: 0x8f...A1c</div>
                        <div className="text-[10px] text-slate-500 mt-2 tracking-wider">Smart Meter Node</div>
                    </div>
                </div>

                {incidentLog.map((log, idx) => (
                    <div key={idx} className="bg-joulet-red/5 border border-joulet-red/15 p-4 rounded-xl flex items-start space-x-3 hover:border-joulet-red/30 transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-joulet-red" />
                        <div className="w-10 h-10 rounded-xl bg-joulet-red/8 flex shrink-0 items-center justify-center text-joulet-red border border-joulet-red/15">
                            <ArrowRightLeft size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-joulet-red text-sm">Grid Event Logged</span>
                                <span className="text-[9px] font-medium text-joulet-red uppercase tracking-wider bg-joulet-red/8 px-2 py-0.5 rounded border border-joulet-red/15 shrink-0">Notice</span>
                            </div>
                            <div className="text-xs font-medium text-white/80 mt-1 bg-black/20 w-full px-2 py-1.5 rounded border border-white/5 break-words">{log}</div>
                        </div>
                    </div>
                ))}

                {incidentLog.length === 0 && verifiedBatches === 0 && (
                    <div className="md:col-span-2 text-center text-slate-500 py-16 flex flex-col items-center justify-center border border-white/5 rounded-xl border-dashed">
                        <Activity size={28} className="mb-3 opacity-30" />
                        <p className="tracking-wider text-xs font-medium">No recent network activity</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityView;
