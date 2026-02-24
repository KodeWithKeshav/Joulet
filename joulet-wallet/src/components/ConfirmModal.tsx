import React, { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
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
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
            <div className="bg-joulet-darker w-full max-h-[80%] rounded-t-3xl border-t border-gray-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col animate-slide-up">

                <div className="p-5 border-b border-gray-700 text-center relative">
                    <h2 className="text-lg font-bold">Sign Transaction</h2>
                    <button
                        onClick={onClose}
                        className="absolute right-5 top-5 text-gray-400 hover:text-white"
                        disabled={isSubmitting}
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                    <div className="bg-gray-800 rounded-xl p-4 flex items-center space-x-3 border border-gray-700">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-white">Joulet Network</div>
                            <div className="text-xs text-gray-400">Submit Verified Batch</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm py-2 border-b border-gray-800">
                            <span className="text-gray-400">Energy Amount</span>
                            <span className="font-bold text-joulet-green">{energyAmount} kWh</span>
                        </div>
                        <div className="flex flex-col text-sm py-2 border-b border-gray-800">
                            <span className="text-gray-400 mb-1">Merkle Root</span>
                            <span className="font-mono text-xs text-blue-300 break-all bg-gray-900 p-2 rounded">
                                {merkleRoot}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-gray-800">
                            <span className="text-gray-400">Est. Gas Fee</span>
                            <span className="font-bold">0.0004 ETH</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900/40 border border-red-500 text-red-400 text-xs p-3 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-5 flex space-x-3 bg-gray-900 rounded-t-xl">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-xl font-bold bg-transparent border border-gray-600 hover:bg-gray-800 transition"
                    >
                        Reject
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="flex-1 py-3 rounded-xl font-bold bg-joulet-green text-black hover:bg-emerald-400 transition flex items-center justify-center"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
