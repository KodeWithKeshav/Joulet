import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

const GridStatusView: React.FC = () => {
    const { rmsVoltage, isBrownout, difficultyThreshold, oracleReputations } = useWalletStore();

    // Determines gauge color
    const getVoltageColor = (volts: number) => {
        if (volts >= 220) return "text-joulet-green stroke-joulet-green drop-shadow-[0_0_10px_rgba(0,230,118,0.8)]";
        if (volts >= 210) return "text-yellow-400 stroke-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]";
        return "text-red-500 stroke-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(255,59,48,0.8)]";
    };

    const textColor = getVoltageColor(rmsVoltage).split(' ')[0];

    return (
        <div className="p-5 space-y-5 h-full relative z-10">
            <div className="flex items-center space-x-3 mb-6 pb-2 border-b border-white/10">
                <div className="bg-joulet-blue/10 p-1.5 rounded-lg border border-joulet-blue/30 shadow-[0_0_10px_rgba(0,229,255,0.2)] flex items-center justify-center">
                    <Activity className="text-joulet-blue" size={18} />
                </div>
                <h2 className="text-sm font-bold text-white/90 uppercase tracking-wider">Live Grid State</h2>
            </div>

            {/* Voltage Gauge */}
            <div className={`bg-joulet-card/80 backdrop-blur-md rounded-2xl p-8 border ${isBrownout ? 'border-red-500 shadow-[0_0_30px_rgba(255,59,48,0.4)]' : 'border-white/10'} flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group hover:border-joulet-blue/30`}>

                {/* Background Grid Lines Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

                <div className="relative flex items-center justify-center w-36 h-36 z-10 group-hover:scale-110 transition-transform duration-500">
                    {/* Pulsing ring from behind */}
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${textColor.replace('text-', 'bg-')}`} />

                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        {/* Track */}
                        <path
                            className="stroke-white/5"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            strokeWidth="2.5"
                        />
                        {/* Progress */}
                        <path
                            className={`${getVoltageColor(rmsVoltage)} transition-all duration-1000 ease-in-out`}
                            strokeDasharray={`${Math.min((rmsVoltage / 250) * 100, 100)}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center bg-black/40 rounded-full w-24 h-24 justify-center border border-white/5 shadow-inner backdrop-blur-sm">
                        <span className={`text-4xl font-black tracking-tight ${textColor}`}>{rmsVoltage.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">VOLTS</span>
                    </div>
                </div>

                {isBrownout && (
                    <div className="mt-6 flex items-center space-x-2 text-white bg-red-600 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest animate-pulse shadow-[0_0_20px_rgba(255,59,48,0.8)] border-2 border-red-400 z-10 w-full justify-center">
                        <AlertTriangle size={16} className="text-white" />
                        <span>GRID EMERGENCY</span>
                    </div>
                )}
                {!isBrownout && (
                    <div className="mt-6 text-center z-10 text-[10px] font-bold text-joulet-green uppercase tracking-widest bg-joulet-green/10 px-4 py-1.5 rounded-full border border-joulet-green/30 shadow-[0_0_10px_rgba(0,230,118,0.2)]">
                        Voltage Stable
                    </div>
                )}
            </div>

            {/* Oracle Consensus Panel */}
            <div className="bg-joulet-card/80 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-joulet-green/30 transition-colors shadow-lg">
                <div className="flex items-center space-x-3 mb-5 border-b border-white/10 pb-3">
                    <div className="w-8 h-8 rounded-full bg-joulet-green/10 flex items-center justify-center border border-joulet-green/30 shadow-[0_0_10px_rgba(0,230,118,0.2)]">
                        <ShieldCheck className="text-joulet-green" size={16} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white">Trust Layer</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Reputation Nodes</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {Object.entries(oracleReputations).map(([id, rep]) => (
                        <div key={id} className="flex flex-col space-y-1.5 group">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="font-mono text-slate-300 bg-black/30 px-2 py-0.5 rounded uppercase tracking-wider">{id.replace('_', ' ')}</span>
                                <span className="text-joulet-green drop-shadow-[0_0_5px_rgba(0,230,118,0.5)]">{(rep * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
                                <div className="bg-gradient-to-r from-joulet-green to-teal-400 h-2 rounded-full group-hover:shadow-[0_0_10px_rgba(0,230,118,0.8)] transition-all duration-300" style={{ width: `${rep * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center bg-[#05080E]/40 p-3 rounded-xl border border-black/50">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Protocol Diff</span>
                    <span className="font-mono text-sm font-black text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">{difficultyThreshold} <span className="text-[10px] text-slate-500 font-sans tracking-tight">kWh / JLT</span></span>
                </div>
            </div>
        </div>
    );
};

export default GridStatusView;
