import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Activity, ShieldCheck, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

interface GridProps {
    isStandalone?: boolean;
}

const GridStatusView: React.FC<GridProps> = ({ isStandalone = false }) => {
    const { rmsVoltage, isBrownout, difficultyThreshold, difficultyHistory, oracleReputations, isApiConnected } = useWalletStore();

    const getVoltageColor = (volts: number) => {
        if (volts >= 220) return "text-joulet-green stroke-joulet-green";
        if (volts >= 210) return "text-joulet-amber stroke-joulet-amber";
        return "text-joulet-red stroke-joulet-red animate-pulse";
    };

    const textColor = getVoltageColor(rmsVoltage).split(' ')[0];
    const OraclesExist = Object.keys(oracleReputations).length > 0;

    // Mini Chart
    const maxDiff = Math.max(...difficultyHistory, 10);
    const minDiff = Math.min(...difficultyHistory, 0);
    const range = maxDiff - minDiff || 1;
    const padding = range * 0.2;

    const points = difficultyHistory.map((val, index) => {
        const x = (index / Math.max(difficultyHistory.length - 1, 1)) * 100;
        const y = 100 - (((val - minDiff + padding) / (range + padding * 2)) * 100);
        return `${x},${y}`;
    }).join(' ');

    const lastDiff = difficultyHistory[difficultyHistory.length - 1] || difficultyThreshold;
    const prevDiff = difficultyHistory.length > 1 ? difficultyHistory[difficultyHistory.length - 2] : lastDiff;
    const diffChange = lastDiff - prevDiff;

    return (
        <div className={`space-y-5 h-full relative z-10 flex flex-col ${isStandalone ? 'p-6' : 'p-6 md:p-8'}`}>
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={14} className="text-joulet-amber" />
                    Network Analytics
                </h2>
                {isStandalone && (
                    <span className="text-[10px] font-semibold text-joulet-green uppercase tracking-wider bg-joulet-green/8 px-3 py-1 rounded border border-joulet-green/15">Live</span>
                )}
            </div>

            <div className={`grid grid-cols-1 ${isStandalone ? '' : 'md:grid-cols-2'} gap-5 flex-1`}>

                {/* Voltage Gauge */}
                <div className={`bg-[#1e293b]/50 rounded-xl p-5 border ${isBrownout ? 'border-joulet-red/30' : 'border-white/5'} flex flex-col items-center justify-center transition-all`}>
                    <div className="relative flex items-center justify-center w-36 h-36">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="stroke-white/5"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                strokeWidth="2.5"
                            />
                            <path
                                className={`${getVoltageColor(rmsVoltage)} transition-all duration-1000`}
                                strokeDasharray={`${Math.min((rmsVoltage / 250) * 100, 100)}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className={`text-3xl font-black tracking-tight ${textColor}`}>{rmsVoltage.toFixed(1)}</span>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wider mt-0.5">VOLTAGE</span>
                        </div>
                    </div>

                    {isBrownout ? (
                        <div className="mt-5 flex items-center space-x-1.5 text-joulet-red bg-joulet-red/10 px-3 py-1.5 rounded-lg border border-joulet-red/20 text-[11px] font-semibold uppercase tracking-wider">
                            <AlertTriangle size={12} className="animate-pulse" />
                            <span>Grid Emergency</span>
                        </div>
                    ) : (
                        <div className="mt-5 text-[11px] font-semibold text-joulet-green uppercase tracking-wider bg-joulet-green/8 px-3 py-1.5 rounded-lg border border-joulet-green/15">
                            {isApiConnected ? 'Grid Stable' : 'Awaiting Connection'}
                        </div>
                    )}
                </div>

                {/* DDA Panel */}
                <div className="bg-[#1e293b]/50 rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-white/5">
                            <div className="w-7 h-7 rounded-lg bg-joulet-blue/8 flex items-center justify-center border border-joulet-blue/15">
                                <ShieldCheck className="text-joulet-blue" size={14} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-white/90">Network Consensus</h3>
                                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Dynamic Difficulty Adjustment</p>
                            </div>
                        </div>

                        {/* DDA Chart */}
                        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider block mb-0.5">Current Target</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="font-mono text-xl font-black text-joulet-blue">{difficultyThreshold.toFixed(2)}</span>
                                        <span className="text-[9px] text-slate-500 tracking-wider uppercase font-medium">kWh/JLT</span>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded border ${diffChange > 0 ? 'text-joulet-red border-joulet-red/15' : diffChange < 0 ? 'text-joulet-green border-joulet-green/15' : 'text-slate-400 border-white/10'}`}>
                                    {diffChange > 0 ? <TrendingUp size={10} /> : diffChange < 0 ? <TrendingDown size={10} /> : null}
                                    {Math.abs(diffChange) > 0 ? `${Math.abs(diffChange).toFixed(2)}` : 'Stable'}
                                </div>
                            </div>

                            <div className="h-14 w-full relative">
                                {difficultyHistory.length > 1 ? (
                                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.15)" />
                                            <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
                                        </linearGradient>
                                        <polygon points={`0,100 ${points} 100,100`} fill="url(#chartGlow)" />
                                        <polyline
                                            points={points}
                                            fill="none"
                                            stroke="rgba(56, 189, 248, 0.7)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <circle
                                            cx="100"
                                            cy={100 - (((lastDiff - minDiff + padding) / (range + padding * 2)) * 100)}
                                            r="3"
                                            fill="#38bdf8"
                                            className="animate-pulse"
                                        />
                                    </svg>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 tracking-wider">
                                        Collecting DDA trend data...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Oracle Health */}
                    <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Oracle Health</span>
                            <span className="text-[9px] font-mono text-slate-500 border border-white/8 px-1.5 py-0.5 rounded">{OraclesExist ? '3/3 Active' : 'Offline'}</span>
                        </div>

                        {OraclesExist ? Object.entries(oracleReputations).map(([id, rep]) => (
                            <div key={id} className="flex items-center space-x-2">
                                <span className="text-[9px] font-mono text-slate-500 w-14">{id.replace('_', '')}</span>
                                <div className="flex-1 bg-black/30 rounded-full h-1 overflow-hidden border border-white/5">
                                    <div className="bg-gradient-to-r from-joulet-green to-joulet-teal h-1 rounded-full transition-all" style={{ width: `${rep * 100}%` }}></div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-2 text-slate-500 text-[9px] tracking-wider">
                                Waiting for telemetry
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GridStatusView;
