import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { ArrowRightLeft, Cpu, Zap } from 'lucide-react';

const ActivityView: React.FC = () => {
    const { incidentLog, verifiedBatches } = useWalletStore();

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>

            {/* Mock recent submissions */}
            {verifiedBatches > 0 && (
                <div className="bg-joulet-card p-4 rounded-xl flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-joulet-green/20 flex flex-shrink-0 items-center justify-center text-joulet-green mt-1">
                        <Zap size={18} />
                    </div>
                    <div>
                        <div className="font-semibold text-white">Batch Submitted</div>
                        <div className="text-xs text-green-400 font-mono mt-1">+10.5 JLT Minted</div>
                        <div className="text-[10px] text-gray-400 mt-2">Confirmed via Oracle Consensus</div>
                    </div>
                </div>
            )}

            <div className="bg-joulet-card p-4 rounded-xl flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex flex-shrink-0 items-center justify-center text-blue-400 mt-1">
                    <Cpu size={18} />
                </div>
                <div>
                    <div className="font-semibold text-white">Device Registered</div>
                    <div className="text-xs text-gray-300 font-mono mt-1">Pub: 0x8f...A1c</div>
                    <div className="text-[10px] text-gray-400 mt-2">Smart Meter Connected</div>
                </div>
            </div>

            {incidentLog.map((log, idx) => (
                <div key={idx} className="bg-red-900/20 border border-red-900/50 p-4 rounded-xl flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex flex-shrink-0 items-center justify-center text-red-500 mt-1">
                        <ArrowRightLeft size={18} />
                    </div>
                    <div>
                        <div className="font-semibold text-red-400">Brownout Event</div>
                        <div className="text-xs text-gray-300 mt-1">{log}</div>
                        <div className="text-[10px] text-red-300 mt-2">Emergency Flush Executed</div>
                    </div>
                </div>
            ))}

            {incidentLog.length === 0 && verifiedBatches === 0 && (
                <div className="text-center text-gray-500 py-10">
                    No recent activity to show
                </div>
            )}
        </div>
    );
};

export default ActivityView;
