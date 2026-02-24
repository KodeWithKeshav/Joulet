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
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy'); // 'buy' means spending USD for JLT
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const parseAmount = parseFloat(amount);
    const isAmountValid = !isNaN(parseAmount) && parseAmount > 0;

    // Dynamic rate based on Blockchain Difficulty
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
                        <Repeat size={18} className="text-purple-400" /> Convert Liquidity
                    </h2>
                    <div className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <BadgeDollarSign size={12} /> Active Market Order: 1 JLT = ${currentJltPrice.toFixed(2)}
                    </div>

                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in duration-500">
                            <CheckCircle2 size={64} className="text-purple-500 mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-pulse" />
                            <h3 className="text-lg font-black text-white text-center mb-2">Swap Approved</h3>
                            <p className="text-xs text-slate-400 text-center mb-6 max-w-[250px]">Market maker routed the transaction. Balances have been updated.</p>

                            <button
                                onClick={handleClose}
                                className="w-full bg-purple-500/10 border border-purple-500/30 text-purple-500 font-bold py-3 rounded-xl hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all uppercase tracking-widest text-xs"
                            >
                                CLOSE TERMINAL
                            </button>
                        </div>
                    ) : (

                        <div className="space-y-4 relative z-10">
                            {/* Input Container (What user specifies: always JLT amount) */}
                            <div className={`bg-black/40 border ${isBuy ? 'border-emerald-500/20' : 'border-joulet-green/20'} rounded-[20px] p-4 group transition-colors`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Amount of JLT to {isBuy ? 'Buy' : 'Sell'}
                                    </label>
                                    <label
                                        className="text-[10px] font-bold text-joulet-green uppercase tracking-widest hover:text-purple-400 transition-colors cursor-pointer"
                                        onClick={() => !isBuy && setAmount(jltBalance.toString())}
                                    >
                                        Balance: {jltBalance.toFixed(2)} JLT
                                    </label>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="flex-1 bg-transparent text-3xl font-black text-white placeholder-slate-600 focus:outline-none w-full"
                                    />
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 font-bold text-sm shrink-0">
                                        JLT
                                    </div>
                                </div>
                            </div>

                            {/* Swap Icon */}
                            <div className="flex justify-center -my-3 relative z-20">
                                <div onClick={toggleTradeType} className="bg-[#0B101E] border border-white/10 p-2 rounded-full text-slate-400 hover:text-purple-400 hover:border-purple-500/50 transition-colors cursor-pointer shadow-lg">
                                    <ArrowDownUp size={16} />
                                </div>
                            </div>

                            {/* Output/Cost Container (What user gets/pays in USD) */}
                            <div className={`bg-black/60 border ${isBuy ? 'border-red-500/20' : 'border-emerald-500/20'} rounded-[20px] p-4`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {isBuy ? 'Total Cost' : 'You Receive'}
                                    </label>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Fiat: ${fiatBalance.toFixed(2)}
                                    </label>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="text"
                                        readOnly
                                        value={amount ? estimatedValue : ""}
                                        placeholder="0.00"
                                        className={`flex-1 bg-transparent text-3xl font-black placeholder-slate-600 focus:outline-none w-full ${isBuy ? 'text-red-400' : 'text-emerald-400'}`}
                                    />
                                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-bold text-sm shrink-0">
                                        USD
                                    </div>
                                </div>
                            </div>

                            {/* Warning Box */}
                            {amount && !canSwap && !errorMessage && (
                                <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 !mt-6">
                                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-red-500">Insufficient {isBuy ? 'Fiat Funds' : 'JLT Balance'}</div>
                                    </div>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 !mt-6">
                                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-red-500">{errorMessage}</div>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={handleSwap}
                                disabled={!canSwap}
                                className={`w-full py-4 rounded-xl font-black text-[13px] tracking-widest uppercase transition-all shadow-lg flex justify-center items-center gap-2 relative overflow-hidden group mt-6
                                    ${canSwap
                                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-[1.02]'
                                        : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                {status === 'simulating' ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-[2px] border-white/20 border-t-white animate-spin" />
                                        Locating Best Route...
                                    </>
                                ) : (
                                    <>
                                        EXECUTE {isBuy ? 'BUY' : 'SELL'} ORDER
                                    </>
                                )}

                                {canSwap && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SwapModal;
