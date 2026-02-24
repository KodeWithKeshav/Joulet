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

        // Simulating Bank Wire transfer delay
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 backdrop-blur-md bg-[#05080E]/80 animate-in fade-in duration-200">
            <div className="bg-[#0B101E]/95 border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] rounded-3xl w-full max-w-md overflow-hidden relative">

                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <h2 className="text-xl font-black text-white tracking-widest uppercase mb-1 flex items-center gap-2">
                        <Building size={18} className="text-emerald-400" /> Bank Transfer
                    </h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">Simulate Fiat Deposit</p>

                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in duration-500">
                            <CheckCircle2 size={64} className="text-emerald-500 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                            <h3 className="text-lg font-black text-white text-center mb-2">Wire Successful</h3>
                            <p className="text-xs text-slate-400 text-center mb-6 max-w-[250px]">Fiat funds are now available for trading JLT.</p>

                            <button
                                onClick={handleClose}
                                className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold py-3 rounded-xl hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all uppercase tracking-widest text-xs"
                            >
                                CONTINUE
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">USD Amount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-2xl font-black text-white placeholder-slate-600 focus:outline-none transition-colors"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <span className="text-sm font-bold text-emerald-500">USD</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleDeposit}
                                disabled={!isAmountValid || status === 'processing'}
                                className={`w-full py-4 rounded-xl font-black text-[13px] tracking-widest uppercase transition-all shadow-lg flex justify-center items-center gap-2 relative overflow-hidden group 
                                    ${(isAmountValid && status !== 'processing')
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-[1.02]'
                                        : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                {status === 'processing' ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-[2px] border-white/20 border-t-white animate-spin" />
                                        CLEARING WIRE...
                                    </>
                                ) : (
                                    <>AUTHORIZE DEPOSIT</>
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
