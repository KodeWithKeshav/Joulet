import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { ArrowRightLeft, Cpu, Zap, Activity } from 'lucide-react';

const ActivityView: React.FC = () => {
    const { incidentLog, verifiedBatches } = useWalletStore();

    return (
        <div className="p-5 space-y-5 bg-joulet-dark h-full">
            <h2 className="text-lg font-bold text-white/90 mb-6 uppercase tracking-wider text-sm border-b border-white/10 pb-2">Recent Activity</h2>

            <div className="space-y-4">
                {/* Mock recent submissions */}
                {verifiedBatches > 0 && (
                    <div className="bg-joulet-card/80 backdrop-blur-sm p-4 rounded-2xl border border-joulet-green/20 shadow-[0_4px_20px_-5px_rgba(16,185,129,0.1)] flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-joulet-green/20 to-teal-500/20 flex flex-shrink-0 items-center justify-center text-joulet-green border border-joulet-green/30">
                            <Zap size={20} className="fill-current/20" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div className="font-bold text-white">Batch Submitted</div>
                                <span className="text-[10px] text-joulet-green bg-joulet-green/10 px-2 py-0.5 rounded-full border border-joulet-green/20">Success</span>
                            </div>
                            <div className="text-sm text-gray-300 font-mono mt-1 bg-black/30 w-fit px-2 py-1 rounded inline-block">+ {verifiedBatches * 10.5} JLT Minted</div>
                            <div className="text-[11px] font-medium text-slate-500 mt-2 uppercase tracking-wide">Confirmed via Oracle Consensus</div>
                        </div>
                    </div>
                )}

                <div className="bg-joulet-card/80 backdrop-blur-sm p-4 rounded-2xl border border-joulet-blue/20 shadow-[0_4px_20px_-5px_rgba(0,229,255,0.1)] flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-joulet-blue/20 to-blue-500/20 flex flex-shrink-0 items-center justify-center text-joulet-blue border border-joulet-blue/30">
                        <Cpu size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div className="font-bold text-white">Device Registered</div>
                            <span className="text-[10px] text-joulet-blue bg-joulet-blue/10 px-2 py-0.5 rounded-full border border-joulet-blue/20">Active</span>
                        </div>
                        <div className="text-sm text-gray-300 font-mono mt-1 bg-black/30 w-fit px-2 py-1 rounded">Pub: 0x8f...A1c</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-2 uppercase tracking-wide">Smart Meter Connected</div>
                    </div>
                </div>

                {incidentLog.map((log, idx) => (
                    <div key={idx} className="bg-red-950/30 backdrop-blur-sm border border-red-500/30 p-4 rounded-2xl flex items-start space-x-4 shadow-[0_4px_20px_-5px_rgba(239,68,68,0.15)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex flex-shrink-0 items-center justify-center text-red-500 border border-red-500/30 animate-pulse">
                            <ArrowRightLeft size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div className="font-bold text-red-400">Brownout Event</div>
                                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">Critical</span>
                            </div>
                            <div className="text-sm font-bold text-white mt-1 bg-black/40 w-fit px-2 py-1 rounded">{log}</div>
                            <div className="text-[11px] font-medium text-red-400/80 mt-2 uppercase tracking-wide flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/80 animate-ping" /> Emergency Flush Executed
                            </div>
                        </div>
                    </div>
                ))}

                {incidentLog.length === 0 && verifiedBatches === 0 && (
                    <div className="text-center text-slate-500 py-12 flex flex-col items-center justify-center border-t border-white/5">
                        <Activity size={32} className="mb-3 opacity-20" />
                        <p className="tracking-wide text-sm">No recent activity on network</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityView;
