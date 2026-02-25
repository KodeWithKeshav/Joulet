import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Cpu, Signal, Lock, Plus, Link2 } from 'lucide-react';

const DeviceView: React.FC = () => {
    const { deviceKeys, isApiConnected } = useWalletStore();

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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceView;
