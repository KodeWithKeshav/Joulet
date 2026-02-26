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

    return (
        <div className="min-h-screen w-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-joulet-green/3 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">

                {/* Header */}
                <div className="text-center mb-14">
                    <img src="/mascot.png" alt="Joulet" className="w-16 h-16 mx-auto object-contain mb-6" />
                    <h1 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
                        Select Persona
                    </h1>
                    <p className="text-slate-400 max-w-md mx-auto leading-relaxed text-sm">
                        Choose an active profile to simulate transactions on the <span className="text-joulet-green font-semibold">Joulet Network</span>.
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
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    {getIcon(profile.id)}
                                </div>
                                <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-colors">
                                    <ArrowRight size={12} className="text-white/40 group-hover:text-white/80 transition-colors" />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-display text-xl font-black text-white mb-1">
                                    {profile.name}
                                </h3>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-5">
                                    {profile.role}
                                </p>

                                <div className="text-[10px] font-mono text-slate-500 bg-black/30 px-3 py-2 rounded-lg border border-white/5 truncate">
                                    {`Key: ...${profile.privateKey.substring(60)}`}
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
