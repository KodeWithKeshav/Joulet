import React, { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { X, ArrowDownUp, AlertTriangle, Repeat, BadgeDollarSign, CheckCircle2 } from 'lucide-react';

interface SwapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SwapModal: React.FC<SwapModalProps> = ({ isOpen, onClose }) => {
    const { jltBalance, getFiatBalance, currentJltPrice, executeTrade } = useWalletStore();
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'idle' | 'simulating' | 'success'>('idle');
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const parseAmount = parseFloat(amount);
    const isAmountValid = !isNaN(parseAmount) && parseAmount > 0;
    const estimatedValue = (parseAmount * currentJltPrice).toFixed(2) || '0.00';
    const fiatBalance = getFiatBalance();

    const canSwap = isAmountValid && status !== 'simulating' && (
        tradeType === 'buy' ? fiatBalance >= parseFloat(estimatedValue) : jltBalance >= parseAmount
    );

    const handleSwap = async () => {
        if (!canSwap) return;
        setStatus('simulating');
        setErrorMessage('');

        try {
            const success = await executeTrade(tradeType, parseAmount);
            if (success) {
                setStatus('success');
            } else {
                setStatus('idle');
                setErrorMessage("Trade failed due to insufficient liquidity.");
            }
        } catch (e) {
            setStatus('idle');
            setErrorMessage("Simulated DEX Router error.");
        }
    };

    const handleClose = () => {
        setStatus('idle');
        setAmount('');
        setErrorMessage('');
        onClose();
    };

    const toggleTradeType = () => {
        setTradeType(prev => prev === 'buy' ? 'sell' : 'buy');
        setAmount('');
        setErrorMessage('');
    };

    const isBuy = tradeType === 'buy';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 backdrop-blur-md bg-[#0a0f1e]/80">
            <div className="bg-[#0f172a] border border-white/8 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative">

                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                >
                    <X size={18} />
                </button>

                <div className="p-7">
                    <h2 className="text-lg font-bold text-white tracking-wide mb-0.5 flex items-center gap-2">
                        <Repeat size={16} className="text-joulet-indigo" /> Convert Liquidity
                    </h2>
                    <div className="text-[11px] text-joulet-green font-medium tracking-wider mb-7 flex items-center gap-1.5">
                        <BadgeDollarSign size={11} /> 1 JLT = ${currentJltPrice.toFixed(2)}
                    </div>

                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <CheckCircle2 size={48} className="text-joulet-indigo mb-4" />
                            <h3 className="text-lg font-bold text-white text-center mb-2">Swap Approved</h3>
                            <p className="text-xs text-slate-400 text-center mb-5 max-w-[250px]">Balances have been updated.</p>
                            <button
                                onClick={handleClose}
                                className="w-full bg-joulet-indigo/8 border border-joulet-indigo/20 text-joulet-indigo font-semibold py-3 rounded-xl hover:bg-joulet-indigo/15 transition-all text-xs tracking-wider"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 relative z-10">
                            {/* Input */}
                            <div className={`bg-black/20 border ${isBuy ? 'border-emerald-500/15' : 'border-joulet-green/15'} rounded-xl p-4`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-medium text-slate-400 tracking-wider">
                                        Amount of JLT to {isBuy ? 'Buy' : 'Sell'}
                                    </label>
                                    <label
                                        className="text-[10px] font-medium text-joulet-green tracking-wider cursor-pointer"
                                        onClick={() => !isBuy && setAmount(jltBalance.toString())}
                                    >
                                        Balance: {jltBalance.toFixed(2)} JLT
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="flex-1 bg-transparent text-2xl font-bold text-white placeholder-slate-600 focus:outline-none w-full"
                                    />
                                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/8 font-medium text-sm shrink-0">
                                        JLT
                                    </div>
                                </div>
                            </div>

                            {/* Swap Toggle */}
                            <div className="flex justify-center -my-2 relative z-20">
                                <div onClick={toggleTradeType} className="bg-[#0f172a] border border-white/8 p-2 rounded-full text-slate-400 hover:text-joulet-indigo hover:border-joulet-indigo/30 transition-colors cursor-pointer">
                                    <ArrowDownUp size={14} />
                                </div>
                            </div>

                            {/* Output */}
                            <div className={`bg-black/30 border ${isBuy ? 'border-joulet-red/15' : 'border-emerald-500/15'} rounded-xl p-4`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-medium text-slate-400 tracking-wider">
                                        {isBuy ? 'Total Cost' : 'You Receive'}
                                    </label>
                                    <label className="text-[10px] font-medium text-slate-400 tracking-wider">
                                        Fiat: ${fiatBalance.toFixed(2)}
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        readOnly
                                        value={amount ? estimatedValue : ""}
                                        placeholder="0.00"
                                        className={`flex-1 bg-transparent text-2xl font-bold placeholder-slate-600 focus:outline-none w-full ${isBuy ? 'text-joulet-red' : 'text-emerald-400'}`}
                                    />
                                    <div className="flex items-center gap-1.5 bg-emerald-500/8 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/15 font-medium text-sm shrink-0">
                                        USD
                                    </div>
                                </div>
                            </div>

                            {/* Warnings */}
                            {amount && !canSwap && !errorMessage && (
                                <div className="bg-joulet-red/8 border border-joulet-red/15 rounded-xl p-3 flex items-start gap-2.5">
                                    <AlertTriangle size={14} className="text-joulet-red shrink-0 mt-0.5" />
                                    <span className="text-xs font-semibold text-joulet-red">Insufficient {isBuy ? 'Fiat Funds' : 'JLT Balance'}</span>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="bg-joulet-red/8 border border-joulet-red/15 rounded-xl p-3 flex items-start gap-2.5">
                                    <AlertTriangle size={14} className="text-joulet-red shrink-0 mt-0.5" />
                                    <span className="text-xs font-semibold text-joulet-red">{errorMessage}</span>
                                </div>
                            )}

                            {/* Button */}
                            <button
                                onClick={handleSwap}
                                disabled={!canSwap}
                                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all flex justify-center items-center gap-2 mt-2
                                    ${canSwap
                                        ? 'bg-joulet-indigo text-white hover:bg-indigo-400'
                                        : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                {status === 'simulating' ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                                        Routing...
                                    </>
                                ) : (
                                    `Execute ${isBuy ? 'Buy' : 'Sell'} Order`
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SwapModal;
