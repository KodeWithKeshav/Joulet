import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Activity, ShieldCheck, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

interface GridProps {
    isStandalone?: boolean;
}

const GridStatusView: React.FC<GridProps> = ({ isStandalone = false }) => {
    const { rmsVoltage, isBrownout, difficultyThreshold, difficultyHistory, oracleReputations, isApiConnected } = useWalletStore();

    // Determines gauge color
    const getVoltageColor = (volts: number) => {
        if (volts >= 220) return "text-joulet-green stroke-joulet-green drop-shadow-[0_0_10px_rgba(0,230,118,0.6)]";
        if (volts >= 210) return "text-yellow-400 stroke-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]";
        return "text-red-500 stroke-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(255,59,48,0.6)]";
    };

    const textColor = getVoltageColor(rmsVoltage).split(' ')[0];
    const OraclesExist = Object.keys(oracleReputations).length > 0;

    // Mini Chart Helper
    const maxDiff = Math.max(...difficultyHistory, 10);
    const minDiff = Math.min(...difficultyHistory, 0);
    const range = maxDiff - minDiff || 1;
    const padding = range * 0.2; // 20% vertical padding

    // Create an SVG polyline
    const points = difficultyHistory.map((val, index) => {
        const x = (index / Math.max(difficultyHistory.length - 1, 1)) * 100;
        const y = 100 - (((val - minDiff + padding) / (range + padding * 2)) * 100);
        return `${x},${y}`;
    }).join(' ');

    const lastDiff = difficultyHistory[difficultyHistory.length - 1] || difficultyThreshold;
    const prevDiff = difficultyHistory.length > 1 ? difficultyHistory[difficultyHistory.length - 2] : lastDiff;
    const diffChange = lastDiff - prevDiff;

    return (
        <div className={`space-y-6 h-full relative z-10 flex flex-col ${isStandalone ? 'p-8' : 'p-6 md:p-10'}`}>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={16} className="text-yellow-400" />
                    Network Analytics
                </h2>
                {isStandalone && (
                    <span className="text-[10px] font-bold text-joulet-green uppercase tracking-widest bg-joulet-green/10 px-3 py-1 rounded border border-joulet-green/20">Live Interface</span>
                )}
            </div>

            <div className={`grid grid-cols-1 ${isStandalone ? '' : 'md:grid-cols-2'} gap-6 flex-1`}>

                {/* Voltage Gauge */}
                <div className={`bg-[#151C2C]/60 backdrop-blur-xl rounded-[20px] p-6 border ${isBrownout ? 'border-red-500/50 shadow-[0_0_30px_rgba(255,59,48,0.2)]' : 'border-white/5'} flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group hover:border-yellow-400/20 shadow-xl`}>

                    {/* Background Grid Lines Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

                    <div className="relative flex items-center justify-center w-40 h-40 z-10 group-hover:scale-105 transition-transform duration-500">
                        <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${textColor.replace('text-', 'bg-')}`} />

                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="stroke-white/5"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                strokeWidth="2.5"
                            />
                            <path
                                className={`${getVoltageColor(rmsVoltage)} transition-all duration-1000 ease-in-out`}
                                strokeDasharray={`${Math.min((rmsVoltage / 250) * 100, 100)}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center bg-black/40 rounded-full w-28 h-28 justify-center border border-white/5 shadow-inner backdrop-blur-md">
                            <span className={`text-4xl font-black tracking-tight ${textColor}`}>{rmsVoltage.toFixed(1)}</span>
                            <span className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">VOLTAGE</span>
                        </div>
                    </div>

                    {isBrownout ? (
                        <div className="mt-8 flex items-center space-x-2 text-white/90 bg-red-600/80 backdrop-blur-md px-4 py-2 rounded-lg border border-red-400 z-10 justify-center w-full max-w-[200px] shadow-[0_4px_20px_rgba(255,59,48,0.4)]">
                            <AlertTriangle size={14} className="text-white animate-pulse" />
                            <span className="text-[11px] font-black tracking-widest uppercase">Grid Emergency</span>
                        </div>
                    ) : (
                        <div className="mt-8 text-center z-10 text-[11px] font-bold text-joulet-green uppercase tracking-widest bg-joulet-green/10 px-4 py-2 rounded-lg border border-joulet-green/20 shadow-[0_0_15px_rgba(0,230,118,0.1)] w-full max-w-[200px]">
                            {isApiConnected ? 'Grid Stable' : 'Awaiting Connection'}
                        </div>
                    )}
                </div>

                {/* Protocol Trust & DDA Panel */}
                <div className="bg-[#151C2C]/60 backdrop-blur-xl rounded-[20px] p-6 border border-white/5 hover:border-joulet-green/20 transition-colors shadow-xl flex flex-col justify-between group overflow-hidden relative">
                    {/* Glowing BG for DDA */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-joulet-blue/5 blur-[50px] pointer-events-none rounded-full" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-xl bg-joulet-blue/10 flex items-center justify-center border border-joulet-blue/20">
                                    <ShieldCheck className="text-joulet-blue" size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white/90 tracking-wide">Network Consensus</h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Dynamic Difficulty Adjustment (DDA)</p>
                                </div>
                            </div>
                        </div>

                        {/* Top: DDA History Chart */}
                        <div className="mb-6 bg-black/30 rounded-xl p-4 border border-white/5 relative">
                            <div className="flex justify-between items-end mb-4 relative z-10">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Current Target</span>
                                    <div className="flex items-baseline gap-2">
                                        <div className="font-mono text-2xl font-black text-joulet-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                                            {difficultyThreshold.toFixed(2)}
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-sans tracking-widest uppercase font-bold">kWh/JLT</span>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-black/80 border ${diffChange > 0 ? 'text-red-400 border-red-500/20' : diffChange < 0 ? 'text-joulet-green border-joulet-green/20' : 'text-slate-400 border-white/10'}`}>
                                    {diffChange > 0 ? <TrendingUp size={12} /> : diffChange < 0 ? <TrendingDown size={12} /> : null}
                                    {Math.abs(diffChange) > 0 ? `${Math.abs(diffChange).toFixed(2)}` : 'Stable'}
                                </div>
                            </div>

                            {/* Mini Trend Line */}
                            <div className="h-16 w-full relative">
                                {difficultyHistory.length > 1 ? (
                                    <>
                                        {/* Grid lines */}
                                        <div className="absolute inset-0 border-b border-white/5 flex items-center">
                                            <div className="w-full border-b border-white/5 border-dashed" />
                                        </div>
                                        {/* Chart */}
                                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                            {/* Gradient Fill under line */}
                                            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(0, 229, 255, 0.2)" />
                                                <stop offset="100%" stopColor="rgba(0, 229, 255, 0)" />
                                            </linearGradient>

                                            {/* The filled shape under the line */}
                                            <polygon
                                                points={`0,100 ${points} 100,100`}
                                                fill="url(#chartGlow)"
                                            />

                                            <polyline
                                                points={points}
                                                fill="none"
                                                stroke="rgba(0, 229, 255, 0.8)"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]"
                                            />
                                            {/* Final point dot */}
                                            <circle
                                                cx="100"
                                                cy={100 - (((lastDiff - minDiff + padding) / (range + padding * 2)) * 100)}
                                                r="4"
                                                fill="#00E5FF"
                                                className="animate-pulse shadow-[0_0_10px_#00E5FF]"
                                            />
                                        </svg>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                        Collecting DDA Trend Data...
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Bottom: Oracle Reputation simple bars */}
                    <div className="relative z-10 pt-4 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Oracle Health</div>
                            <span className="text-[9px] font-mono text-slate-500 border border-white/10 px-2 py-0.5 rounded-md">{OraclesExist ? '3/3 Active' : 'Offline'}</span>
                        </div>

                        {OraclesExist ? Object.entries(oracleReputations).map(([id, rep]) => (
                            <div key={id} className="flex items-center space-x-3 group/bar">
                                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest w-16">{id.replace('_', '')}</span>
                                <div className="flex-1 bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5 shadow-inner">
                                    <div className="bg-gradient-to-r from-joulet-green to-teal-500 h-1.5 rounded-full group-hover/bar:shadow-[0_0_10px_rgba(0,230,118,0.6)] transition-all duration-300" style={{ width: `${rep * 100}%` }}></div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-2 text-slate-500 text-[9px] uppercase tracking-widest font-bold">
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
