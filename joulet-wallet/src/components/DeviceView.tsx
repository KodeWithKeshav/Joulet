import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Cpu, Signal, Lock, Plus, Link2, Zap, RefreshCw, Play, Hand } from 'lucide-react';

const DeviceView: React.FC = () => {
    const { deviceKeys, isApiConnected, fetchLiveStatus, updateAssets } = useWalletStore();
    const [isSimulating, setIsSimulating] = React.useState(false);
    const [simMode, setSimMode] = React.useState<'manual' | 'auto'>('manual');
    const [isResetting, setIsResetting] = React.useState(false);
    const [modeLoading, setModeLoading] = React.useState(false);

    // Fetch current mode on mount
    React.useEffect(() => {
        fetch('http://localhost:5004/api/simulator/mode')
            .then(r => r.json())
            .then(d => setSimMode(d.mode === 'auto' ? 'auto' : 'manual'))
            .catch(() => {});
    }, [isApiConnected]);

    const toggleMode = async (target: 'manual' | 'auto') => {
        if (modeLoading || target === simMode) return;
        setModeLoading(true);
        try {
            const res = await fetch('http://localhost:5004/api/simulator/mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: target }),
            });
            const d = await res.json();
            setSimMode(d.mode === 'auto' ? 'auto' : 'manual');
        } catch {}
        setModeLoading(false);
    };

    const resetData = async () => {
        if (isResetting) return;
        setIsResetting(true);
        try {
            await fetch('http://localhost:5004/api/energy/reset', { method: 'POST' });
            // Immediately zero the UI — blockchain read on next poll will confirm 0
            updateAssets({ jltBalance: 0, totalKwhGenerated: 0, verifiedBatches: 0, pendingEnergy: 0, incidentLog: [], difficultyHistory: [] });
            await fetchLiveStatus();
        } catch {}
        setIsResetting(false);
    };

    if (!deviceKeys) {
        return (
            <div className="p-6 md:p-8 text-center text-slate-500 h-full flex flex-col items-center justify-center z-10 relative">
                <div className="w-16 h-16 rounded-xl bg-[#1e293b]/50 border border-white/5 flex items-center justify-center mb-5">
                    <Cpu size={32} className="opacity-30" />
                </div>
                <p className="text-sm font-medium tracking-wider">No Oracle Nodes Provisioned</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-5 h-full relative z-10 flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Cpu size={14} className="text-joulet-indigo" />
                    Registered Hardware
                </h2>
                <button className="text-xs font-medium tracking-wider uppercase bg-joulet-indigo/8 text-joulet-indigo hover:bg-joulet-indigo/15 border border-joulet-indigo/15 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
                    <Plus size={12} /> Add Node
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {/* Main Node Card */}
                <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-white/5 relative overflow-hidden hover:border-joulet-indigo/20 transition-all flex flex-col">
                    {/* Online Indicator */}
                    <div className="absolute top-4 right-4">
                        <div className={`flex items-center space-x-1.5 text-[9px] font-medium tracking-wider uppercase px-2.5 py-1 rounded border ${isApiConnected ? 'text-joulet-green bg-joulet-green/8 border-joulet-green/15' : 'text-joulet-red bg-joulet-red/8 border-joulet-red/15'}`}>
                            <Signal size={10} className={isApiConnected ? "animate-pulse" : ""} />
                            <span>{isApiConnected ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 mt-2 mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-[#0f172a] flex items-center justify-center border border-white/5 mb-5">
                            <Cpu size={32} className="text-joulet-indigo" />
                        </div>
                        <h3 className="font-display font-black text-xl text-white/90 mb-1">Smart Meter <span className="text-joulet-indigo">Alpha</span></h3>
                        <p className="text-[10px] text-slate-400 font-medium tracking-wider bg-white/5 px-3 py-1 rounded-full border border-white/5">Joulet IoT Node v1.2</p>
                    </div>

                    <div className="bg-black/20 rounded-lg p-4 space-y-3 text-sm border border-white/5 mt-auto">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 flex items-center gap-1.5 font-medium text-[11px] tracking-wider"><Lock size={10} className="text-joulet-indigo" /> Identity Hash</span>
                            <span className="font-mono text-white/70 bg-white/5 px-2 py-0.5 rounded text-xs truncate max-w-[140px]">
                                {deviceKeys.address}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 font-medium text-[11px] tracking-wider">Device Role</span>
                            <span className="font-semibold text-white/80 text-xs">Telemetry Signer</span>
                        </div>
                        <div className="flex justify-between items-center pt-0.5">
                            <span className="text-slate-400 font-medium text-[11px] tracking-wider">Last Heartbeat</span>
                            <span className={`font-medium flex items-center gap-1.5 text-xs tracking-wider ${isApiConnected ? 'text-joulet-green' : 'text-slate-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${isApiConnected ? 'bg-joulet-green' : 'bg-joulet-red'}`} />
                                {isApiConnected ? 'Synchronized' : 'Desynced'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Node Config */}
                <div className="hidden md:flex flex-col bg-[#0f172a]/60 rounded-xl p-5 border border-white/5 border-dashed">
                    <div className="flex items-center space-x-2.5 mb-5">
                        <div className="p-1.5 bg-joulet-blue/8 rounded-lg border border-joulet-blue/15">
                            <Link2 className="text-joulet-blue" size={14} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-white/90 text-sm">Node Configuration</h4>
                            <p className="text-[9px] text-slate-500 tracking-wider">Network Bindings</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">API Endpoint URL</label>
                            <input type="text" readOnly value="http://localhost:5004/api/status" className="bg-black/30 border border-white/8 rounded-lg p-2.5 text-xs font-mono text-slate-400 w-full focus:outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Oracle RPC URL</label>
                            <input type="text" readOnly value="http://127.0.0.1:8545" className="bg-black/30 border border-white/8 rounded-lg p-2.5 text-xs font-mono text-slate-400 w-full focus:outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Consensus Protocol</label>
                            <input type="text" readOnly value="Local DPoS (Joulet Simulation)" className="bg-black/30 border border-white/8 rounded-lg p-2.5 text-xs font-mono text-slate-400 w-full focus:outline-none" />
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                            {/* Mode toggle */}
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-medium">Trigger Mode</p>
                                <div className="flex rounded-lg overflow-hidden border border-white/8">
                                    <button
                                        onClick={() => toggleMode('manual')}
                                        disabled={!isApiConnected || modeLoading}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold tracking-wider transition-all ${
                                            simMode === 'manual'
                                                ? 'bg-joulet-indigo text-white'
                                                : 'bg-transparent text-slate-400 hover:text-white'
                                        } disabled:opacity-40`}
                                    >
                                        <Hand size={11} /> Manual
                                    </button>
                                    <button
                                        onClick={() => toggleMode('auto')}
                                        disabled={!isApiConnected || modeLoading}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold tracking-wider transition-all ${
                                            simMode === 'auto'
                                                ? 'bg-joulet-green text-[#0f172a]'
                                                : 'bg-transparent text-slate-400 hover:text-white'
                                        } disabled:opacity-40`}
                                    >
                                        <Play size={11} /> Auto
                                    </button>
                                </div>
                                <p className="text-[9px] text-slate-500 mt-1.5">
                                    {simMode === 'auto' ? '⚡ Auto-generating readings every 5s' : '🖐 Only manual 10kWh triggers are sent'}
                                </p>
                            </div>

                            {/* Simulate button */}
                            <button
                                onClick={async () => {
                                    if (isSimulating) return;
                                    setIsSimulating(true);
                                    try {
                                        await fetch("http://localhost:5004/api/test/simulate?kwh=10.0", { method: "POST" });
                                        await fetchLiveStatus();
                                    } catch (e) {
                                        console.error("Simulation failed", e);
                                    }
                                    setIsSimulating(false);
                                }}
                                disabled={!isApiConnected || isSimulating}
                                className="w-full bg-joulet-green/10 hover:bg-joulet-green/20 border border-joulet-green/30 text-joulet-green text-xs font-bold py-2.5 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <Zap size={14} />
                                {isSimulating ? "Transmitting..." : "Simulate 10kWh Production"}
                            </button>

                            {/* Reset button */}
                            <button
                                onClick={resetData}
                                disabled={!isApiConnected || isResetting}
                                className="w-full bg-joulet-red/8 hover:bg-joulet-red/18 border border-joulet-red/25 text-joulet-red text-xs font-bold py-2.5 rounded-lg flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={13} className={isResetting ? 'animate-spin' : ''} />
                                {isResetting ? 'Resetting...' : 'Reset All Data'}
                            </button>
                            <p className="text-[9px] text-slate-500 text-center">Sends verified telemetry to Blockchain to yield JLT.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceView;
