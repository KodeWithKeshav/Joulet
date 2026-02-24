import React, { useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { X, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import TransactionManager from '../core/transactionManager';

interface SendModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SendModal: React.FC<SendModalProps> = ({ isOpen, onClose }) => {
    const { jltBalance, walletKeys } = useWalletStore();
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'idle' | 'signing' | 'error' | 'success'>('idle');
    const [message, setMessage] = useState('');
    const [txHash, setTxHash] = useState('');

    if (!isOpen) return null;

    const parseAmount = parseFloat(amount);
    const isAmountValid = !isNaN(parseAmount) && parseAmount > 0;
    // Basic formatting check for 0x address
    const isAddressValid = toAddress.startsWith('0x') && toAddress.length === 42;
    const canSend = isAmountValid && isAddressValid && parseAmount <= jltBalance && status !== 'signing';

    const handleSend = async () => {
        if (!walletKeys || !canSend) return;

        setStatus('signing');
        setMessage('Authenticating and Broadcasting Transaction to the Joulet Network...');

        try {
            const hash = await TransactionManager.transferTokens(
                walletKeys.privateKey,
                toAddress,
                parseAmount
            );
            setTxHash(hash);
            setStatus('success');
            setMessage('Transfer Verified and Confirmed on Ledger.');
            // Clear inputs on success
            setToAddress('');
            setAmount('');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || "Unknown cryptographic error.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 backdrop-blur-md bg-[#05080E]/80 animate-in fade-in duration-200">
            <div className="bg-[#0B101E]/95 border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] rounded-3xl w-full max-w-md overflow-hidden relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <h2 className="text-xl font-black text-white tracking-widest uppercase mb-1 flex items-center gap-2">
                        <Send size={18} className="text-joulet-blue" /> Submit Payment
                    </h2>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">Joulet Token Network (JLT)</p>

                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in duration-500">
                            <CheckCircle2 size={64} className="text-joulet-green mb-4 drop-shadow-[0_0_15px_rgba(0,230,118,0.5)] animate-pulse" />
                            <h3 className="text-lg font-black text-white text-center mb-2">Transfer Successful</h3>
                            <p className="text-xs text-slate-400 text-center mb-6 max-w-[250px]">{message}</p>

                            <div className="bg-black/50 border border-white/5 rounded-xl p-4 w-full mb-6">
                                <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Receipt Hash</div>
                                <div className="text-[10px] font-mono text-joulet-green break-all leading-relaxed">
                                    {txHash}
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full bg-joulet-green/10 border border-joulet-green/30 text-joulet-green font-bold py-3 rounded-xl hover:bg-joulet-green/20 hover:shadow-[0_0_20px_rgba(0,230,118,0.2)] transition-all uppercase tracking-widest text-xs"
                            >
                                CLOSE RECEIPT
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 relative z-10">
                            {/* Address Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient Identity</label>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter 0x... Address"
                                    value={toAddress}
                                    onChange={(e) => setToAddress(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 focus:border-joulet-blue/50 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Energy Asset Output</label>
                                    <label className="text-[10px] font-bold text-joulet-green uppercase tracking-widest">Available: {jltBalance.toFixed(2)} JLT</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 focus:border-joulet-blue/50 rounded-xl px-4 py-3 text-lg font-black text-white placeholder-slate-600 focus:outline-none transition-colors"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <button
                                            onClick={() => setAmount(jltBalance.toString())}
                                            className="text-[9px] font-bold uppercase tracking-widest text-joulet-blue bg-joulet-blue/10 px-2 py-0.5 rounded border border-joulet-blue/20 hover:bg-joulet-blue/20"
                                        >
                                            MAX
                                        </button>
                                        <span className="text-sm font-bold text-white/50">JLT</span>
                                    </div>
                                </div>
                            </div>

                            {/* Warning Box */}
                            {parseAmount > jltBalance && (
                                <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-3 flex items-start gap-3">
                                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-red-500">Insufficient Liquidity</div>
                                        <div className="text-[10px] text-red-400/80 mt-1">Wait for oracle consensus to mint more tokens from pending energy.</div>
                                    </div>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-3 flex items-start gap-3">
                                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-red-500">Transaction Failed</div>
                                        <div className="text-[10px] text-red-400/80 mt-1 break-words">{message}</div>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={handleSend}
                                disabled={!canSend}
                                className={`w-full py-4 rounded-xl font-black text-[13px] tracking-widest uppercase transition-all shadow-lg flex justify-center items-center gap-2 relative overflow-hidden group 
                                    ${canSend
                                        ? 'bg-gradient-to-r from-joulet-blue to-teal-500 text-black hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:scale-[1.02]'
                                        : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                {status === 'signing' ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-[2px] border-black/20 border-t-black animate-spin" />
                                        Authenticating Ledger...
                                    </>
                                ) : (
                                    <>
                                        CONFIRM AND SIGN
                                    </>
                                )}

                                {canSend && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SendModal;
