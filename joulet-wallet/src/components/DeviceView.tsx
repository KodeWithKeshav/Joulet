import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Cpu, Signal, Lock, Plus, Link2 } from 'lucide-react';

const DeviceView: React.FC = () => {
    const { deviceKeys, isApiConnected } = useWalletStore();

    if (!deviceKeys) {
        return (
            <div className="p-6 md:p-10 text-center text-slate-500 h-full flex flex-col items-center justify-center z-10 relative">
                <div className="w-20 h-20 rounded-2xl bg-[#151C2C]/50 border border-white/5 flex items-center justify-center mb-6">
                    <Cpu size={40} className="opacity-40" />
                </div>
                <p className="text-sm uppercase font-bold tracking-widest">No Oracle Nodes Provisioned</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 space-y-6 h-full relative z-10 flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Cpu size={16} className="text-purple-400" />
                    Registered Hardware
                </h2>
                <button className="group text-xs font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] border border-purple-500/20 px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer">
                    <Plus size={14} className="group-hover:scale-110 transition-transform" /> Add Node
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                {/* Main Node Card */}
                <div className="bg-[#151C2C]/60 backdrop-blur-xl rounded-[20px] p-6 md:p-8 border border-white/5 relative overflow-hidden shadow-xl z-10 hover:border-purple-500/30 transition-all duration-300 group flex flex-col">
                    {/* Glowing orb behind dev card */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none rounded-full" />

                    {/* Online Indicator tag */}
                    <div className="absolute top-4 right-4">
                        <div className={`flex items-center space-x-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded shadow-md border ${isApiConnected ? 'text-joulet-green bg-green-950/40 border-joulet-green/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'text-red-500 bg-red-950/40 border-red-500/20'}`}>
                            <Signal size={12} className={isApiConnected ? "animate-pulse" : ""} />
                            <span>{isApiConnected ? 'Online (Local)' : 'Offline'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 mt-4 mb-8 relative z-10">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0B101E] to-[#151C2C] flex items-center justify-center border border-white/5 shadow-[inset_0_-4px_20px_rgba(168,85,247,0.1),0_15px_30px_rgba(0,0,0,0.5)] mb-6 relative group-hover:-translate-y-2 transition-transform duration-500 group-hover:border-purple-500/30 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                            <Cpu size={40} className="text-purple-400 absolute group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-purple-400/5 rounded-3xl animate-pulse" />
                        </div>
                        <h3 className="font-black text-2xl text-white/90 tracking-wide mb-1">Smart Meter <span className="text-purple-400 font-bold">Alpha</span></h3>
                        <p className="text-[11px] text-slate-400 font-bold tracking-widest uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">Joulet IoT Node v1.2</p>
                    </div>

                    <div className="bg-black/40 rounded-[16px] p-5 space-y-4 text-sm border border-white/5 shadow-inner mt-auto relative z-10">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <span className="text-slate-400 flex items-center gap-2 font-medium tracking-widest text-[11px] uppercase"><Lock size={12} className="text-purple-400" /> Identity Hash</span>
                            <span className="font-mono text-white/80 bg-white/5 px-2.5 py-1 rounded border border-white/5 text-xs truncate max-w-[150px] md:max-w-none">
                                {deviceKeys.address}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <span className="text-slate-400 font-medium tracking-widest text-[11px] uppercase">Device Role</span>
                            <span className="font-black text-white/90 text-xs">Telemetry Signer</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-slate-400 font-medium tracking-widest text-[11px] uppercase">Last Heartbeat</span>
                            <span className={`font-bold flex items-center gap-1.5 text-xs tracking-wide uppercase ${isApiConnected ? 'text-joulet-green' : 'text-slate-500'}`}>
                                <div className={`w-2 h-2 rounded-full ${isApiConnected ? 'bg-joulet-green shadow-[0_0_8px_#00E676]' : 'bg-red-500 shadow-[0_0_8px_#EF4444]'}`} />
                                {isApiConnected ? 'Synchronized' : 'Desynced'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Node Config Panel */}
                <div className="hidden md:flex flex-col bg-[#0B101E]/40 backdrop-blur-md rounded-[20px] p-6 border border-white/5 border-dashed">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Link2 className="text-blue-400" size={16} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white/90 text-sm">Node Configuration</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Network Bindings</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5 relative group">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Endpoint URL</label>
                            <input type="text" readOnly value="http://localhost:5004/api/status" className="bg-black/50 border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-400 w-full focus:outline-none focus:border-joulet-blue/50 transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5 relative group">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Oracle RPC URL</label>
                            <input type="text" readOnly value="http://127.0.0.1:8545" className="bg-black/50 border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-400 w-full focus:outline-none focus:border-joulet-blue/50 transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1.5 relative group">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consensus Protocol</label>
                            <input type="text" readOnly value="Local DPoS (Joulet Simulation)" className="bg-black/50 border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-400 w-full focus:outline-none focus:border-joulet-blue/50 transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceView;
