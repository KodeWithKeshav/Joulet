import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

interface GridProps {
    isStandalone?: boolean;
}

const GridStatusView: React.FC<GridProps> = ({ isStandalone = false }) => {
    const { rmsVoltage, isBrownout, difficultyThreshold, oracleReputations } = useWalletStore();

    // Determines gauge color
    const getVoltageColor = (volts: number) => {
        if (volts >= 220) return "text-joulet-green stroke-joulet-green drop-shadow-[0_0_10px_rgba(0,230,118,0.6)]";
        if (volts >= 210) return "text-yellow-400 stroke-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]";
        return "text-red-500 stroke-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(255,59,48,0.6)]";
    };

    const textColor = getVoltageColor(rmsVoltage).split(' ')[0];

    return (
        <div className={`space-y-4 h-full relative z-10 flex flex-col ${isStandalone ? 'p-0' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} className="text-yellow-400" />
                    Network Analytics
                </h2>
                {isStandalone && (
                    <span className="text-[9px] font-bold text-joulet-green uppercase tracking-widest bg-joulet-green/10 px-2 py-0.5 rounded border border-joulet-green/20">Live Sync</span>
                )}
            </div>

            {/* Voltage Gauge */}
            <div className={`bg-[#151C2C]/60 backdrop-blur-xl rounded-2xl p-6 border ${isBrownout ? 'border-red-500/50 shadow-[0_0_30px_rgba(255,59,48,0.2)]' : 'border-white/5'} flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group hover:border-yellow-400/20 flex-1 shadow-lg`}>

                {/* Background Grid Lines Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

                <div className="relative flex items-center justify-center w-32 h-32 z-10 group-hover:scale-105 transition-transform duration-500">
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${textColor.replace('text-', 'bg-')}`} />

                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                            className="stroke-white/5"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            strokeWidth="2"
                        />
                        <path
                            className={`${getVoltageColor(rmsVoltage)} transition-all duration-1000 ease-in-out`}
                            strokeDasharray={`${Math.min((rmsVoltage / 250) * 100, 100)}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center bg-black/40 rounded-full w-24 h-24 justify-center border border-white/5 shadow-inner backdrop-blur-md">
                        <span className={`text-3xl font-black tracking-tight ${textColor}`}>{rmsVoltage.toFixed(1)}</span>
                        <span className="text-[9px] text-slate-400 font-bold tracking-widest mt-0.5">VOLTAGE</span>
                    </div>
                </div>

                {isBrownout && (
                    <div className="mt-5 flex items-center space-x-1.5 text-white/90 bg-red-600/80 backdrop-blur-md px-3 py-1 rounded border border-red-400 z-10 justify-center w-3/4 shadow-[0_4px_15px_rgba(255,59,48,0.4)]">
                        <AlertTriangle size={12} className="text-white animate-pulse" />
                        <span className="text-[9px] font-black tracking-widest uppercase">Emergency</span>
                    </div>
                )}
                {!isBrownout && (
                    <div className="mt-5 text-center z-10 text-[9px] font-bold text-joulet-green uppercase tracking-widest bg-joulet-green/10 px-3 py-1 rounded border border-joulet-green/20 shadow-[0_0_10px_rgba(0,230,118,0.1)] w-3/4">
                        Grid Stable
                    </div>
                )}
            </div>

            {/* Oracle Consensus Panel */}
            <div className="bg-[#151C2C]/60 backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-joulet-green/20 transition-colors shadow-lg flex-1">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-joulet-green/10 flex items-center justify-center border border-joulet-green/20">
                            <ShieldCheck className="text-joulet-green" size={14} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[11px] text-white/90 tracking-wide">Trust Layer</h3>
                            <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Consensus Nodes</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 border border-white/10 bg-black/30 px-2 py-0.5 rounded shadow-inner">2/3 Verified</span>
                </div>

                <div className="space-y-3">
                    {Object.entries(oracleReputations).map(([id, rep]) => (
                        <div key={id} className="flex flex-col space-y-1.5 group">
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="font-mono text-slate-400 uppercase tracking-widest">{id.replace('_', ' ')}</span>
                                <span className="text-joulet-green drop-shadow-[0_0_5px_rgba(0,230,118,0.4)] font-mono">{(rep * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5 shadow-inner">
                                <div className="bg-gradient-to-r from-joulet-green to-teal-500 h-1.5 rounded-full group-hover:shadow-[0_0_8px_rgba(0,230,118,0.6)] transition-all duration-300" style={{ width: `${rep * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center bg-black/30 px-3 py-2 rounded-xl border border-white/5 shadow-inner">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Protocol Diff</span>
                    <span className="font-mono text-[11px] font-black text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]">{difficultyThreshold} <span className="text-[9px] text-slate-500 font-sans tracking-widest uppercase">kWh/JLT</span></span>
                </div>
            </div>
        </div>
    );
};

export default GridStatusView;
