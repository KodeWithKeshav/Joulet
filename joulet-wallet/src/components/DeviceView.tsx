import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Cpu, Signal, Lock, Plus } from 'lucide-react';

const DeviceView: React.FC = () => {
    const { deviceKeys } = useWalletStore();

    if (!deviceKeys) {
        return (
            <div className="p-6 text-center text-slate-500 h-full bg-transparent flex flex-col items-center justify-center z-10 relative">
                <div className="w-16 h-16 rounded-2xl bg-[#151C2C]/50 border border-white/5 flex items-center justify-center mb-4">
                    <Cpu size={32} className="opacity-40" />
                </div>
                <p className="text-xs uppercase font-bold tracking-widest">No Oracle Nodes</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-4 h-full relative z-10 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Cpu size={12} className="text-purple-400" />
                    Registered Hardware
                </h2>
                <button className="group text-[9px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] border border-purple-500/20 px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer">
                    <Plus size={10} className="group-hover:scale-110 transition-transform" /> Add Node
                </button>
            </div>

            {/* Glowing orb behind dev card */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/10 blur-[80px] pointer-events-none rounded-full" />

            <div className="bg-[#151C2C]/60 backdrop-blur-xl rounded-2xl p-5 border border-white/5 relative overflow-hidden shadow-lg z-10 hover:border-purple-500/30 transition-all duration-300 group flex-1">
                {/* Online Indicator tag */}
                <div className="absolute top-0 right-0 p-3">
                    <div className="flex items-center space-x-1.5 text-joulet-green text-[9px] font-black tracking-widest uppercase bg-green-950/40 border border-joulet-green/20 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        <Signal size={10} className="animate-pulse" />
                        <span>Online</span>
                    </div>
                </div>

                <div className="flex justify-center items-center flex-col mt-6 mb-6 relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B101E] to-[#151C2C] flex items-center justify-center border border-white/5 shadow-[inset_0_-2px_10px_rgba(168,85,247,0.1),0_10px_20px_rgba(0,0,0,0.5)] mb-4 relative z-10 group-hover:-translate-y-1 transition-transform duration-500 group-hover:border-purple-500/30 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                        <Cpu size={28} className="text-purple-400 absolute group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-purple-400/5 rounded-2xl animate-pulse" />
                    </div>
                    <h3 className="font-black text-lg text-white/90 tracking-wide">Smart Meter <span className="text-purple-400 font-bold">Alpha</span></h3>
                    <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">Joulet IoT Node v1.2</p>
                </div>

                <div className="bg-black/40 rounded-xl p-3.5 space-y-3 text-xs border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <span className="text-slate-400 flex items-center gap-1.5 font-medium tracking-widest text-[10px] uppercase"><Lock size={10} className="text-purple-400" /> Identity Hash</span>
                        <span className="font-mono text-white/80 bg-white/5 px-2 py-0.5 rounded border border-white/5 text-[10px]">
                            {deviceKeys.address.slice(0, 6)}...{deviceKeys.address.slice(-4)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                        <span className="text-slate-400 font-medium tracking-widest text-[10px] uppercase">Device Role</span>
                        <span className="font-bold text-gray-300 text-[11px]">Telemetry Signer</span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5">
                        <span className="text-slate-400 font-medium tracking-widest text-[10px] uppercase">Last Heartbeat</span>
                        <span className="text-joulet-green font-bold flex items-center gap-1.5 text-[10px] tracking-wide uppercase"><div className="w-1.5 h-1.5 bg-joulet-green rounded-full shadow-[0_0_5px_#00E676]" /> Synchronized</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceView;
