import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { HARDHAT_PROFILES } from '../core/keyManager';
import { Sun, HomeIcon, Building2, Zap, ArrowRight } from 'lucide-react';

const LoginScreen: React.FC = () => {
    const { login, isApiConnected } = useWalletStore();

    const getIcon = (id: number) => {
        switch (id) {
            case 0: return <Sun className="text-amber-400" size={32} />;
            case 1: return <HomeIcon className="text-joulet-green" size={32} />;
            case 2: return <Building2 className="text-joulet-blue" size={32} />;
            default: return <Zap className="text-white" size={32} />;
        }
    };

    const getAccent = (id: number) => {
        switch (id) {
            case 0: return "from-amber-500/20 to-orange-500/5 group-hover:border-amber-500/50 shadow-[0_0_30px_rgba(251,191,36,0.1)] group-hover:shadow-[0_0_40px_rgba(251,191,36,0.3)]";
            case 1: return "from-joulet-green/20 to-teal-500/5 group-hover:border-joulet-green/50 shadow-[0_0_30px_rgba(0,230,118,0.1)] group-hover:shadow-[0_0_40px_rgba(0,230,118,0.3)]";
            case 2: return "from-joulet-blue/20 to-cyan-500/5 group-hover:border-joulet-blue/50 shadow-[0_0_30px_rgba(0,229,255,0.1)] group-hover:shadow-[0_0_40px_rgba(0,229,255,0.3)]";
            default: return "";
        }
    };

    return (
        <div className="min-h-screen w-screen bg-[#05080E] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#05080E] to-black opacity-80" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-joulet-green/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">

                {/* Header */}
                <div className="text-center mb-16 animate-in slide-in-from-top-10 fade-in duration-1000">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-joulet-green to-teal-600 flex items-center justify-center shadow-[0_0_40px_rgba(0,230,118,0.4)] mb-8 border-[1px] border-white/20">
                        <Zap className="text-white fill-white/20" size={40} />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        Select Persona
                    </h1>
                    <p className="text-slate-400 max-w-lg mx-auto leading-relaxed text-sm md:text-base">
                        Choose an active profile to simulate transactions on the <span className="text-joulet-green font-bold">Joulet Network</span>. These accounts are deterministically fueled by your local Hardhat node.
                    </p>
                </div>

                {/* Profile Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
                    {HARDHAT_PROFILES.map((profile, i) => (
                        <div
                            key={profile.id}
                            onClick={() => login(profile.id)}
                            className={`group bg-[#0B101E]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br ${getAccent(profile.id)} animate-in fade-in slide-in-from-bottom-${4 + i * 2}`}
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <div className="flex justify-between items-start mb-12">
                                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                                    {getIcon(profile.id)}
                                </div>
                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-black/20 group-hover:bg-white/10 transition-colors">
                                    <ArrowRight size={14} className="text-white/50 group-hover:text-white transition-colors" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-white mb-2 tracking-wide group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all">
                                    {profile.name}
                                </h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">
                                    {profile.role}
                                </p>

                                <div className="text-[10px] font-mono text-slate-500 bg-black/40 px-3 py-2 rounded-lg border border-white/5 truncate group-hover:text-slate-300 transition-colors">
                                    {`Key: ...${profile.privateKey.substring(60)}`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Connection Status Footer */}
                <div className="mt-16 flex items-center space-x-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 animate-in fade-in duration-1000 delay-500">
                    <div className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isApiConnected ? 'bg-joulet-green' : 'bg-red-500'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isApiConnected ? 'bg-joulet-green shadow-[0_0_8px_#00E676]' : 'bg-red-500 shadow-[0_0_8px_#EF4444]'}`}></span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {isApiConnected ? 'API Bridge Online • Ready for Interoperability' : 'API Bridge Disconnected • Run ./start.sh'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
