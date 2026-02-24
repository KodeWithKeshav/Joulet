import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Cpu, Signal, Lock } from 'lucide-react';

const DeviceView: React.FC = () => {
    const { deviceKeys } = useWalletStore();

    if (!deviceKeys) {
        return (
            <div className="p-5 text-center text-slate-500 mt-10 h-full bg-joulet-dark flex flex-col items-center justify-center">
                <Cpu size={48} className="opacity-20 mb-4" />
                <p>No IoT devices connected</p>
            </div>
        );
    }

    return (
        <div className="p-5 space-y-5 bg-joulet-dark h-full relative">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/10">
                <h2 className="text-sm font-bold text-white/90 uppercase tracking-wider">Registered Devices</h2>
                <button className="text-[11px] font-bold tracking-wide uppercase bg-joulet-blue/10 text-joulet-blue hover:bg-joulet-blue/20 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] border border-joulet-blue/30 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer">
                    <span>+</span> Add Device
                </button>
            </div>

            {/* Glowing orb behind dev card */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-joulet-blue/10 blur-[80px] pointer-events-none rounded-full" />

            <div className="bg-joulet-card/80 backdrop-blur-md rounded-2xl p-6 border border-white/10 relative overflow-hidden shadow-2xl z-10 hover:border-joulet-blue/30 transition-all group">
                {/* Online Indicator tag */}
                <div className="absolute top-0 right-0 p-4">
                    <div className="flex items-center space-x-1.5 text-joulet-green text-[10px] font-black tracking-wider uppercase bg-green-950/50 border border-joulet-green/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <Signal size={12} className="animate-pulse" />
                        <span>Online</span>
                    </div>
                </div>

                <div className="flex justify-center items-center flex-col mt-4 mb-6 relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0B101E] to-[#151C2C] flex items-center justify-center border border-white/10 shadow-[inset_0_-2px_10px_rgba(0,0,255,0.1),0_10px_30px_rgba(0,0,0,0.5)] mb-4 relative z-10 group-hover:scale-105 transition-transform duration-500 group-hover:border-joulet-blue/50 group-hover:shadow-[0_0_30px_rgba(0,229,255,0.2)]">
                        <Cpu size={36} className="text-joulet-blue absolute" />
                        <div className="absolute inset-0 bg-joulet-blue/5 rounded-2xl animate-pulse" />
                    </div>
                    <h3 className="font-black text-xl text-white tracking-wide">Smart Meter <span className="text-joulet-blue">Alpha</span></h3>
                    <p className="text-[11px] text-joulet-green font-bold tracking-widest uppercase mt-1">Joulet IoT Node v1.2</p>
                </div>

                <div className="bg-[#05080E]/60 rounded-xl p-4 space-y-3 text-xs border border-black/50 shadow-inner">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-slate-400 flex items-center gap-1.5 font-medium tracking-wide"><Lock size={12} className="text-joulet-blue" /> Pub Key Hash</span>
                        <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                            {deviceKeys.address.slice(0, 6)}...{deviceKeys.address.slice(-4)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-slate-400 font-medium tracking-wide">Device Role</span>
                        <span className="font-bold text-gray-200">Telemetry Signer</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-400 font-medium tracking-wide">Last Heartbeat</span>
                        <span className="text-joulet-green font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-joulet-green rounded-full shadow-[0_0_5px_#00E676]" /> Synchronized</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceView;
