import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Activity, ShieldCheck, Zap, Server, Cpu, RadioTower, ArrowRightLeft } from 'lucide-react';

const DashboardView: React.FC = () => {
    const {
        isApiConnected,
        totalKwhGenerated,
        verifiedBatches,
        oracleReputations,
        pendingEnergy,
        isBrownout,
        activeProfileId
    } = useWalletStore();

    const isProducer = activeProfileId === 0;

    return (
        <div className="p-6 md:p-8 space-y-6 h-full relative z-10 flex flex-col overflow-y-auto no-scrollbar">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                        <Activity size={20} className="text-joulet-green" />
                        Command Center
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Real-time DePIN Network Overview</p>
                </div>
                <div className="flex gap-3">
                    <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-semibold ${isApiConnected ? 'bg-joulet-green/10 text-joulet-green border-joulet-green/20' : 'bg-joulet-red/10 text-joulet-red border-joulet-red/20'}`}>
                        <Server size={14} />
                        {isApiConnected ? 'ORACLE ONLINE' : 'ORACLE OFFLINE'}
                    </div>
                    <div className="px-3 py-1.5 rounded-lg border bg-joulet-blue/10 text-joulet-blue border-joulet-blue/20 flex items-center gap-2 text-xs font-semibold">
                        <ShieldCheck size={14} />
                        ZK-PROOFS ACTIVE
                    </div>
                </div>
            </div>

            {/* Core Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Total Energy Verified"
                    value={`${totalKwhGenerated.toFixed(1)} kWh`}
                    subtitle="Cryptographically proven"
                    icon={<Zap className="text-amber-400" size={20} />}
                    color="amber"
                />
                <MetricCard
                    title="Verified Batches"
                    value={verifiedBatches.toString()}
                    subtitle="Merkle trees submitted"
                    icon={<Server className="text-joulet-blue" size={20} />}
                    color="blue"
                />
                <MetricCard
                    title="Security Posture"
                    value="Optimal"
                    subtitle="0 ongoing attacks detected"
                    icon={<ShieldCheck className="text-joulet-green" size={20} />}
                    color="green"
                />
            </div>

            {/* Dynamic Energy Flow Visualization */}
            <div className="bg-[#1e293b]/40 rounded-2xl border border-white/5 p-6 flex flex-col">
                <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                    <ArrowRightLeft size={16} className="text-joulet-indigo" />
                    Live DePIN Ecosystem Flow
                </h3>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 mt-4 relative">
                    {/* Connecting Line */}
                    <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-joulet-amber/20 via-joulet-green/20 to-joulet-blue/20 -translate-y-1/2 z-0" />

                    {/* Producer Node */}
                    <div className="relative z-10 flex flex-col items-center p-4 bg-[#0f172a] rounded-xl border border-white/10 w-44 hover:border-joulet-amber/50 transition-colors">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isProducer ? 'bg-joulet-amber/20' : 'bg-white/5'} border ${isProducer ? 'border-joulet-amber/40' : 'border-white/10'}`}>
                            <Cpu size={24} className={isProducer ? "text-joulet-amber" : "text-white/40"} />
                        </div>
                        <span className="font-bold text-sm text-white">Smart Meter</span>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">IoT Device</span>
                        {isProducer && pendingEnergy > 0 && (
                            <div className="mt-3 px-2 py-0.5 bg-joulet-amber/10 border border-joulet-amber/20 text-joulet-amber text-[10px] rounded animate-pulse">
                                +{pendingEnergy.toFixed(3)} kWh queued
                            </div>
                        )}
                    </div>

                    {/* Oracle Node (Consensus) */}
                    <div className="relative z-10 flex flex-col items-center p-4 bg-[#0f172a]/80 backdrop-blur-md rounded-xl border border-joulet-green/30 w-48 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-joulet-green/20 border border-joulet-green/50 relative">
                            {isApiConnected && <div className="absolute inset-0 rounded-full border border-joulet-green animate-ping opacity-20" />}
                            <Server size={28} className="text-joulet-green" />
                        </div>
                        <span className="font-bold text-sm text-white">Oracle Network</span>
                        <span className="text-[10px] text-joulet-green mt-1 text-center leading-tight">Physics & Math<br />Consensus</span>
                    </div>

                    {/* Blockchain / Consumer */}
                    <div className="relative z-10 flex flex-col items-center p-4 bg-[#0f172a] rounded-xl border border-white/10 w-44 hover:border-joulet-blue/50 transition-colors">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${!isProducer ? 'bg-joulet-blue/20' : 'bg-white/5'} border ${!isProducer ? 'border-joulet-blue/40' : 'border-white/10'}`}>
                            <Zap size={24} className={!isProducer ? "text-joulet-blue" : "text-white/40"} />
                        </div>
                        <span className="font-bold text-sm text-white">Token Yield</span>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Smart Contract</span>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/20 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Active Oracle Nodes</h4>
                        <div className="space-y-2">
                            {Object.entries(oracleReputations).length > 0 ? (
                                Object.entries(oracleReputations).map(([name, rep]) => (
                                    <div key={name} className="flex justify-between items-center text-sm">
                                        <span className="text-white/80 font-mono text-xs">{name}</span>
                                        <span className="text-joulet-green font-mono text-xs max-w-[100px] truncate" title={rep.toString()}>{rep.toString().substring(0, 10)}...</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-500 italic">Waiting for consensus data...</div>
                            )}
                        </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Grid Health Indicator</h4>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBrownout ? 'bg-joulet-red/20 text-joulet-red' : 'bg-joulet-green/20 text-joulet-green'}`}>
                                <RadioTower size={18} className={isBrownout ? 'animate-pulse' : ''} />
                            </div>
                            <div>
                                <div className={`font-bold text-sm ${isBrownout ? 'text-joulet-red' : 'text-joulet-green'}`}>
                                    {isBrownout ? 'BROWNOUT DETECTED' : 'GRID STABLE'}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Live physics monitoring</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, subtitle, icon, color }: any) => {
    let colorStyles = "";
    let baseContainer = "bg-[#1e293b]/50 p-5 rounded-xl border border-white/5 transition-colors flex flex-col ";

    if (color === 'amber') {
        colorStyles = "hover:border-amber-400/30";
    } else if (color === 'blue') {
        colorStyles = "hover:border-joulet-blue/30";
    } else {
        colorStyles = "hover:border-joulet-green/30";
    }

    let iconBg = "";
    if (color === 'amber') iconBg = "bg-amber-400/10";
    if (color === 'blue') iconBg = "bg-joulet-blue/10";
    if (color === 'green') iconBg = "bg-joulet-green/10";

    return (
        <div className={baseContainer + colorStyles}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
                <div className={`p-2 rounded-lg ${iconBg}`}>
                    {icon}
                </div>
            </div>
            <div className="mt-auto">
                <div className="text-2xl font-black text-white font-display mb-1">{value}</div>
                <div className="text-[10px] text-slate-500 tracking-wide">{subtitle}</div>
            </div>
        </div>
    );
};

export default DashboardView;
