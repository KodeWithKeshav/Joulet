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
            const txHash = await TransactionManager.submitBatch(walletKeys.privateKey, energyAmount, merkleRoot);

            updateAssets({
                pendingEnergy: 0,
                verifiedBatches: useWalletStore.getState().verifiedBatches + 1,
                jltBalance: useWalletStore.getState().jltBalance + (energyAmount / 10)
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
        <div className="absolute inset-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-md flex items-end justify-center">
            <div className="bg-[#0f172a]/95 backdrop-blur-2xl w-full max-h-[85%] rounded-t-2xl border border-white/8 shadow-2xl flex flex-col relative overflow-hidden">

                {/* Top accent */}
                <div className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-joulet-teal to-transparent" />

                <div className="p-5 text-center relative pt-6 pb-2">
                    <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-4" />
                    <h2 className="text-lg font-bold tracking-wide text-white flex items-center justify-center gap-2">
                        <Fingerprint className="text-joulet-teal" size={18} />
                        Sign Approval
                    </h2>
                    <p className="text-[10px] text-slate-500 mt-1 tracking-wider">Hardware Security Confirmation</p>

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
                    <div className="bg-[#1e293b]/60 rounded-xl p-4 flex items-center space-x-3 border border-white/5">
                        <div className="w-9 h-9 rounded-lg bg-joulet-green/8 flex items-center justify-center text-joulet-green border border-joulet-green/15">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <div className="font-semibold text-white/90 text-sm">Joulet Network Protocol</div>
                            <div className="text-[9px] text-joulet-green font-medium tracking-wider mt-0.5">Submit Verified Batch</div>
                        </div>
                    </div>

                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 font-medium tracking-wider text-[10px]">Energy Value</span>
                            <span className="font-bold text-sm text-joulet-blue">{energyAmount} <span className="text-[9px] text-slate-500 tracking-wider">kWh</span></span>
                        </div>
                        <div className="flex flex-col text-xs border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 mb-1.5 font-medium tracking-wider text-[10px]">Merkle Root</span>
                            <span className="font-mono text-[9px] text-white/60 bg-black/30 p-2 rounded border border-white/5 break-all">
                                {merkleRoot}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-0.5">
                            <span className="text-slate-400 font-medium tracking-wider text-[10px] flex items-center gap-1.5">Network Fee <span className="bg-white/8 text-[8px] px-1.5 py-0.5 rounded text-white/50">L2</span></span>
                            <span className="font-medium font-mono text-white/70 text-[11px] bg-black/30 px-2 py-0.5 rounded border border-white/5">~0.0004 ETH</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-joulet-red/8 border border-joulet-red/20 text-joulet-red text-xs p-3 rounded-xl font-medium flex items-center gap-2">
                            <AlertTriangle size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="p-5 bg-black/20 border-t border-white/5 flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-[0.4] py-3 rounded-xl font-semibold text-xs bg-white/5 border border-white/8 text-slate-400 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                    >
                        Reject
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-xl font-bold text-xs bg-joulet-teal text-[#0a0f1e] hover:bg-joulet-green transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Confirm Approval"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
