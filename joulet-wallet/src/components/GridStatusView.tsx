import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

const GridStatusView: React.FC = () => {
    const { rmsVoltage, isBrownout, difficultyThreshold, oracleReputations } = useWalletStore();

    // Determines gauge color
    const getVoltageColor = (volts: number) => {
        if (volts >= 220) return "text-green-400 stroke-green-400";
        if (volts >= 210) return "text-yellow-400 stroke-yellow-400";
        return "text-red-500 stroke-red-500 animate-pulse";
    };

    const textColor = getVoltageColor(rmsVoltage).split(' ')[0];

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center space-x-2 mb-2">
                <Activity className="text-blue-400" size={20} />
                <h2 className="text-lg font-bold text-white">Live Grid State</h2>
            </div>

            {/* Voltage Gauge (Mocked visual representation) */}
            <div className={`bg-joulet-card rounded-xl p-6 border ${isBrownout ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-gray-600'} flex flex-col items-center justify-center transition-all duration-300`}>
                <div className="relative flex items-center justify-center w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                            className="stroke-gray-700"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            strokeWidth="3"
                        />
                        <path
                            className={`${getVoltageColor(rmsVoltage).split(' ')[1]} transition-all duration-1000`}
                            strokeDasharray={`${Math.min((rmsVoltage / 250) * 100, 100)}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            strokeWidth="3"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className={`text-3xl font-black ${textColor}`}>{rmsVoltage.toFixed(1)}</span>
                        <span className="text-xs text-gray-400 font-bold tracking-widest">VAC</span>
                    </div>
                </div>

                {isBrownout && (
                    <div className="mt-4 flex items-center space-x-2 text-red-500 bg-red-950/40 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        <AlertTriangle size={14} />
                        <span>BROWNOUT DETECTED</span>
                    </div>
                )}
            </div>

            {/* Oracle Consensus Panel */}
            <div className="bg-joulet-card rounded-xl p-4 border border-gray-600">
                <div className="flex items-center space-x-2 mb-3">
                    <ShieldCheck className="text-joulet-green" size={18} />
                    <h3 className="font-semibold text-sm">Oracle Consensus Network</h3>
                </div>

                <div className="space-y-3">
                    {Object.entries(oracleReputations).map(([id, rep]) => (
                        <div key={id} className="flex flex-col space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="font-mono text-gray-300">{id}</span>
                                <span className="text-joulet-green">{(rep * 100).toFixed(1)}% Rep</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-joulet-green h-1.5 rounded-full" style={{ width: `${rep * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center text-xs">
                    <span className="text-gray-400">Adaptive Difficulty</span>
                    <span className="font-mono text-yellow-400">{difficultyThreshold} kWh / JLT</span>
                </div>
            </div>
        </div>
    );
};

export default GridStatusView;
