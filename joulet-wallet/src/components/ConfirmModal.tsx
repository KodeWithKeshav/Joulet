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
                jltBalance: useWalletStore.getState().jltBalance + (energyAmount / 10) // Fixed to match 1 JLT per 10 kWh from default config
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

            <div className="bg-[#0B101E]/95 backdrop-blur-2xl w-full max-h-[85%] rounded-t-[24px] border border-white/10 border-b-0 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col animate-slide-up relative overflow-hidden">

                {/* Neon Glow Header Base */}
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-joulet-blue to-transparent shadow-[0_0_20px_rgba(0,229,255,0.8)]" />

                <div className="p-5 text-center relative pt-6 pb-2">
                    <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-4" />
                    <h2 className="text-lg font-black tracking-wide text-white/90 flex items-center justify-center gap-2">
                        <Fingerprint className="text-joulet-blue" size={20} />
                        SIGN APPROVAL
                    </h2>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Hardware Security Confirmation</p>

                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                        disabled={isSubmitting}
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-4 no-scrollbar">
                    {/* Contract Details */}
                    <div className="bg-[#151C2C]/80 rounded-2xl p-4 flex items-center space-x-3 border border-white/5 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-joulet-green/5 rounded-full blur-xl group-hover:bg-joulet-green/10 transition-all" />

                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-joulet-green/10 to-teal-500/10 flex items-center justify-center text-joulet-green border border-joulet-green/20 shadow-[0_0_10px_rgba(0,230,118,0.1)]">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="relative z-10">
                            <div className="font-bold text-white/90 text-[13px] tracking-wide">Joulet Network protocol</div>
                            <div className="text-[9px] text-joulet-green font-bold tracking-widest uppercase mt-0.5">Submit Verified Batch</div>
                        </div>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-4 border border-white/5 shadow-inner space-y-3">
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 font-medium tracking-widest text-[10px] uppercase">Energy Value</span>
                            <span className="font-black text-sm text-joulet-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">{energyAmount} <span className="text-[9px] text-slate-500 font-sans tracking-widest uppercase">kWh</span></span>
                        </div>
                        <div className="flex flex-col text-xs border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 mb-2 font-medium tracking-widest text-[10px] uppercase">Merkle Root</span>
                            <span className="font-mono text-[9px] text-white/70 bg-black/50 p-2.5 rounded border border-white/5 shadow-inner break-all">
                                {merkleRoot}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-0.5">
                            <span className="text-slate-400 font-medium tracking-widest text-[10px] uppercase flex items-center gap-1.5">Network Fee <span className="bg-white/10 text-[8px] px-1.5 py-0.5 rounded font-black text-white/50">L2</span></span>
                            <span className="font-bold font-mono text-white/80 text-[11px] bg-black/40 px-2 py-0.5 rounded border border-white/5">~0.0004 ETH</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-950/40 border border-red-500/30 text-red-400 text-[10px] p-3 rounded-xl font-bold flex items-center gap-2">
                            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-5 bg-black/40 border-t border-white/5 flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-[0.4] py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                    >
                        Reject
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] bg-gradient-to-b from-joulet-blue to-[#00BCCC] text-[#0B101E] shadow-[0_5px_15px_rgba(0,229,255,0.3),inset_0_1px_1px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_25px_rgba(0,229,255,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 duration-200"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin text-[#0B101E]" /> : "Confirm Approval"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
