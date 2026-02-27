import React, { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { X, Building, CheckCircle2 } from 'lucide-react';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
    const { addFiat } = useWalletStore();
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    if (!isOpen) return null;

    const parseAmount = parseFloat(amount);
    const isAmountValid = !isNaN(parseAmount) && parseAmount > 0;

    const handleDeposit = () => {
        if (!isAmountValid) return;
        setStatus('processing');

        setTimeout(() => {
            addFiat(parseAmount);
            setStatus('success');
            setAmount('');
        }, 1200);
    };

    const handleClose = () => {
        setStatus('idle');
        setAmount('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 backdrop-blur-md bg-[#0D0D0D]/80">
            <div className="bg-[#161616] border border-white/8 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative">

                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-[#888888] hover:text-white"
                >
                    <X size={18} />
                </button>

                <div className="p-7">
                    <h2 className="text-lg font-bold text-white tracking-wide mb-0.5 flex items-center gap-2">
                        <Building size={16} className="text-joulet-green" /> Bank Transfer
                    </h2>
                    <p className="text-[11px] text-[#555] tracking-wider mb-7">Simulate Fiat Deposit</p>

                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <CheckCircle2 size={48} className="text-joulet-green mb-4" />
                            <h3 className="text-lg font-bold text-white text-center mb-2">Wire Successful</h3>
                            <p className="text-xs text-[#888888] text-center mb-5 max-w-[250px]">Fiat funds are now available for trading JLT.</p>
                            <button
                                onClick={handleClose}
                                className="w-full bg-joulet-green/8 border border-joulet-green/20 text-joulet-green font-semibold py-3 rounded-xl hover:bg-joulet-green/15 transition-all text-xs tracking-wider"
                            >
                                Continue
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-[#888888] tracking-wider">USD Amount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-[#0D0D0D] border border-white/5 focus:border-joulet-green/40 rounded-xl px-4 py-3 text-xl font-bold text-white placeholder-slate-600 focus:outline-none transition-colors"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <span className="text-sm font-medium text-joulet-green">USD</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleDeposit}
                                disabled={!isAmountValid || status === 'processing'}
                                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all flex justify-center items-center gap-2
                                    ${(isAmountValid && status !== 'processing')
                                        ? 'bg-joulet-green text-[#0D0D0D] hover:bg-joulet-green'
                                        : 'bg-white/5 text-[#555] cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                {status === 'processing' ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                                        Clearing Wire...
                                    </>
                                ) : (
                                    'Authorize Deposit'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DepositModal;
