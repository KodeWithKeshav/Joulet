import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { HARDHAT_PROFILES } from '../core/keyManager';
import { ArrowRight } from 'lucide-react';

const LoginScreen: React.FC = () => {
    const { login, isApiConnected } = useWalletStore();

    const getIcon = (id: number) => {
        switch (id) {
            case 0: return <img src="/solar-icon.png" alt="Solar Station" className="w-14 h-14 object-contain" />;
            case 1: return <img src="/home-icon.png" alt="Smart Home" className="w-14 h-14 object-contain" />;
            case 2: return <img src="/building-icon.png" alt="Commercial Building" className="w-14 h-14 object-contain" />;
            default: return <img src="/mascot.png" alt="Default" className="w-14 h-14 object-contain" />;
        }
    };

    const getAccent = (id: number) => {
        switch (id) {
            case 0: return "hover:border-amber-500/30";
            case 1: return "hover:border-joulet-green/30";
            case 2: return "hover:border-joulet-blue/30";
            default: return "";
        }
    };

    const getRoleDescription = (id: number) => {
        switch (id) {
            case 0: return "Generate energy from IoT devices and earn JLT tokens";
            case 1: 
            case 2: 
                return "Buy JLT tokens to support clean energy grid";
            default: return "";
        }
    };

    const getRoleBadge = (id: number) => {
        if (id === 0) {
            return <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded">Producer</span>;
        }
        return <span className="px-2 py-1 bg-joulet-blue/20 border border-joulet-blue/30 text-joulet-blue text-[9px] font-bold uppercase tracking-wider rounded">Consumer</span>;
    };

    return (
        <div className="min-h-screen w-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-joulet-green/3 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">

                {/* Header */}
                <div className="text-center mb-14">
                    <img src="/mascot.png" alt="Joulet" className="w-16 h-16 mx-auto object-contain mb-6" />
                    <h1 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
                        Login to Joulet
                    </h1>
                    <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-sm">
                        Choose your role: <span className="text-amber-400 font-semibold">Producers</span> generate and sell energy, while <span className="text-joulet-blue font-semibold">Consumers</span> buy energy tokens.
                    </p>
                </div>

                {/* Profile Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                    {HARDHAT_PROFILES.map((profile) => (
                        <div
                            key={profile.id}
                            onClick={() => login(profile.id)}
                            className={`group bg-[#0f172a] border border-white/8 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:bg-[#162032] ${getAccent(profile.id)}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    {getIcon(profile.id)}
                                </div>
                                <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-colors">
                                    <ArrowRight size={12} className="text-white/40 group-hover:text-white/80 transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display text-xl font-black text-white">
                                        {profile.name}
                                    </h3>
                                    {getRoleBadge(profile.id)}
                                </div>

                                <p className="text-xs text-slate-400 leading-relaxed min-h-[2.5rem]">
                                    {getRoleDescription(profile.id)}
                                </p>

                                <div className="pt-2 border-t border-white/5">
                                    <div className="text-[10px] font-mono text-slate-500 bg-black/30 px-3 py-2 rounded-lg border border-white/5 truncate">
                                        {`${profile.role} • ...${profile.privateKey.substring(60)}`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Connection Status */}
                <div className="mt-12 flex items-center space-x-2 bg-[#0f172a] px-5 py-2.5 rounded-full border border-white/5">
                    <div className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isApiConnected ? 'bg-joulet-green' : 'bg-joulet-red'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isApiConnected ? 'bg-joulet-green' : 'bg-joulet-red'}`}></span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 tracking-wider">
                        {isApiConnected ? 'API Bridge Online' : 'API Bridge Disconnected — Run ./start.sh'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
