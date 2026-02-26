import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Target, ShieldCheck, Coins } from 'lucide-react';

const IntroOverlay: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeenIntro = localStorage.getItem('joulet_intro_seen');
        if (!hasSeenIntro) {
            // slight delay to let app load behind it
            setTimeout(() => setIsVisible(true), 500);
        }
    }, []);

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('joulet_intro_seen', 'true');
    };

    if (!isVisible) return null;

    const steps = [
        {
            icon: <Target className="text-joulet-indigo w-12 h-12" />,
            title: "Welcome to Joulet: The Energy DePIN",
            body: "You are looking at the future of decentralized physical infrastructure. Joulet connects IoT smart meters directly to blockchain settlement, cutting out centralized utility middlemen.",
            colors: { bg: 'bg-joulet-indigo', bgGhost: 'bg-joulet-indigo/10', border: 'border-joulet-indigo/20', text: 'text-joulet-indigo', shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]' }
        },
        {
            icon: <Zap className="text-joulet-amber w-12 h-12" />,
            title: "Physics-Based Oracles",
            body: "Smart meters constantly report energy production (V * I). But how do we trust physical devices? Our Oracle Consensus Network cryptographically verifies the laws of physics before any data hits the blockchain.",
            colors: { bg: 'bg-joulet-amber', bgGhost: 'bg-joulet-amber/10', border: 'border-joulet-amber/20', text: 'text-joulet-amber', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' }
        },
        {
            icon: <ShieldCheck className="text-joulet-red w-12 h-12" />,
            title: "Cybersecurity Operations (CSOC)",
            body: "Try the 'Security Center' tab! You can act as an adversary and inject fraudulent payloads. Watch the Oracle Network detect math anomalies and invalid signatures in real-time, instantly blocking the attacks.",
            colors: { bg: 'bg-joulet-red', bgGhost: 'bg-joulet-red/10', border: 'border-joulet-red/20', text: 'text-joulet-red', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' }
        },
        {
            icon: <Coins className="text-joulet-green w-12 h-12" />,
            title: "Decentralized Liquidity",
            body: "Once energy is cryptographically verified, Joulet Tokens (JLT) are minted to the producer. Producers can instantly swap JLT for Fiat on our custom automated market maker (DEX). Welcome to the New Grid.",
            colors: { bg: 'bg-joulet-green', bgGhost: 'bg-joulet-green/10', border: 'border-joulet-green/20', text: 'text-joulet-green', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' }
        }
    ];

    const current = steps[step];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0f1e]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">

                {/* Background glow tied to current step color */}
                <div className={`absolute top-0 right-0 w-64 h-64 ${current.colors.bgGhost} blur-[80px] pointer-events-none transition-colors duration-500`} />
                <div className={`absolute bottom-0 left-0 w-64 h-64 ${current.colors.bgGhost} blur-[80px] pointer-events-none transition-colors duration-500`} />

                <div className="p-8 relative z-10">
                    <div className={`w-20 h-20 rounded-2xl ${current.colors.bgGhost} border ${current.colors.border} flex items-center justify-center mb-6 transition-colors duration-500`}>
                        {current.icon}
                    </div>

                    <h2 className="text-2xl font-display font-black text-white mb-3">
                        {current.title}
                    </h2>

                    <p className="text-slate-400 text-sm leading-relaxed mb-8 min-h-[80px]">
                        {current.body}
                    </p>

                    <div className="flex items-center justify-between mt-8">
                        {/* Step Indicators */}
                        <div className="flex gap-2">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? `w-6 ${current.colors.bg}` : 'w-2 bg-white/10'}`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleComplete}
                                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                            >
                                Skip Tour
                            </button>
                            <button
                                onClick={handleNext}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg ${current.colors.bg} text-[#0a0f1e] text-xs font-bold hover:brightness-110 ${current.colors.shadow} transition-all`}
                            >
                                {step === 3 ? "Start Hacking" : "Next"}
                                {step < 3 && <ArrowRight size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntroOverlay;
