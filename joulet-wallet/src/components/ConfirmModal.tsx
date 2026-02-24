import React, { useState } from 'react';
import { ShieldCheck, Loader2, Fingerprint, AlertTriangle } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import TransactionManager from '../core/transactionManager';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    energyAmount: number;
    merkleRoot: string;
    onSuccess: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, energyAmount, merkleRoot, onSuccess }) => {
    const { walletKeys, updateAssets } = useWalletStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !walletKeys) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Mock submission for demo/testing
            const txHash = await TransactionManager.submitBatch(walletKeys.privateKey, energyAmount, merkleRoot);

            // Mock Success State Update
            updateAssets({
                pendingEnergy: 0,
                verifiedBatches: useWalletStore.getState().verifiedBatches + 1,
                jltBalance: useWalletStore.getState().jltBalance + (energyAmount / 100) // Mock 1 JLT per 100 kWh
            });

            console.log(`Transaction Confirmed: ${txHash}`);
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Transaction failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-[#05080E]/80 backdrop-blur-md flex items-end justify-center">

            <div className="bg-joulet-dark w-full max-h-[85%] rounded-t-3xl border-t border-joulet-blue/30 shadow-[0_-20px_60px_-15px_rgba(0,229,255,0.3)] flex flex-col animate-slide-up relative overflow-hidden">

                {/* Neon Glow Header Base */}
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-joulet-blue to-transparent shadow-[0_0_15px_rgba(0,229,255,1)]" />

                <div className="p-5 text-center relative pt-8">
                    <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4" />
                    <h2 className="text-xl font-black tracking-wide text-white flex items-center justify-center gap-2">
                        <Fingerprint className="text-joulet-blue" size={24} />
                        SIGN APPROVAL
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">Smart Contract Transaction</p>

                    <button
                        onClick={onClose}
                        className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                        disabled={isSubmitting}
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-5 no-scrollbar">
                    {/* Contract Details */}
                    <div className="bg-[#151C2C] rounded-2xl p-4 flex items-center space-x-4 border border-white/5 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-joulet-green/10 rounded-full blur-2xl group-hover:bg-joulet-green/20 transition-all" />

                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-joulet-green/20 to-teal-500/20 flex items-center justify-center text-joulet-green border border-joulet-green/30 shadow-[0_0_15px_rgba(0,230,118,0.2)]">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="relative z-10">
                            <div className="font-bold text-white text-base">Joulet Network</div>
                            <div className="text-xs text-joulet-green font-bold tracking-widest uppercase mt-0.5">Submit Verified Batch</div>
                        </div>
                    </div>

                    <div className="bg-[#05080E]/60 rounded-2xl p-5 border border-black/50 shadow-inner space-y-4">
                        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                            <span className="text-slate-400 font-medium tracking-wide">Energy Amount</span>
                            <span className="font-black text-lg text-joulet-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]">{energyAmount} <span className="text-[10px] text-slate-500 font-sans tracking-widest">KWH</span></span>
                        </div>
                        <div className="flex flex-col text-sm border-b border-white/5 pb-3">
                            <span className="text-slate-400 mb-2 font-medium tracking-wide">Merkle Root Verification</span>
                            <span className="font-mono text-[11px] text-white/80 bg-black p-3 rounded-lg border border-white/5 shadow-inner break-all">
                                {merkleRoot}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-1">
                            <span className="text-slate-400 font-medium tracking-wide flex items-center gap-1">Est. Network Fee <span className="bg-white/10 text-[9px] px-1.5 py-0.5 rounded font-black text-white/50">L2</span></span>
                            <span className="font-bold font-mono text-white/90">~0.0004 ETH</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-950/50 border border-red-500/50 text-red-400 text-[11px] p-4 rounded-xl font-bold flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-500" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-[#0B101E] border-t border-white/5 flex space-x-4">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 py-4 rounded-full font-bold uppercase tracking-widest text-xs bg-transparent border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
                    >
                        Reject
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="flex-1 py-4 rounded-full font-black uppercase tracking-widest text-xs bg-joulet-blue text-[#0B101E] shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] hover:bg-[#33EEFF] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin text-[#0B101E]" /> : "Confirm & Sign"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
