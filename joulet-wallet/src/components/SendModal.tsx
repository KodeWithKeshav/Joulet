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
    const isAddressValid = toAddress.startsWith('0x') && toAddress.length === 42;
    const canSend = isAmountValid && isAddressValid && parseAmount <= jltBalance && status !== 'signing';

    const handleSend = async () => {
        if (!walletKeys || !canSend) return;

        setStatus('signing');
        setMessage('Broadcasting transaction to the Joulet Network...');

        try {
            const hash = await TransactionManager.transferTokens(
                walletKeys.privateKey,
                toAddress,
                parseAmount
            );
            setTxHash(hash);
            setStatus('success');
            setMessage('Transfer verified and confirmed on ledger.');
            setToAddress('');
            setAmount('');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || "Unknown error.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-10 backdrop-blur-md bg-[#0a0f1e]/80">
            <div className="bg-[#0f172a] border border-white/8 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                >
                    <X size={18} />
                </button>

                <div className="p-7">
                    <h2 className="text-lg font-bold text-white tracking-wide mb-0.5 flex items-center gap-2">
                        <Send size={16} className="text-joulet-blue" /> Send Payment
                    </h2>
                    <p className="text-[11px] text-slate-500 tracking-wider mb-7">Joulet Token Network (JLT)</p>

                    {status === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <CheckCircle2 size={48} className="text-joulet-green mb-4" />
                            <h3 className="text-lg font-bold text-white text-center mb-2">Transfer Successful</h3>
                            <p className="text-xs text-slate-400 text-center mb-5 max-w-[250px]">{message}</p>

                            <div className="bg-black/20 border border-white/5 rounded-xl p-4 w-full mb-5">
                                <div className="text-[9px] tracking-wider text-slate-500 font-medium mb-1">Receipt Hash</div>
                                <div className="text-[10px] font-mono text-joulet-green break-all leading-relaxed">
                                    {txHash}
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full bg-joulet-green/8 border border-joulet-green/20 text-joulet-green font-semibold py-3 rounded-xl hover:bg-joulet-green/15 transition-all text-xs tracking-wider"
                            >
                                Close Receipt
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Address Input */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-medium text-slate-400 tracking-wider">Recipient Address</label>
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    value={toAddress}
                                    onChange={(e) => setToAddress(e.target.value)}
                                    className="w-full bg-black/30 border border-white/5 focus:border-joulet-teal/40 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-medium text-slate-400 tracking-wider">Amount</label>
                                    <label className="text-[10px] font-medium text-joulet-green tracking-wider">Available: {jltBalance.toFixed(2)} JLT</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/30 border border-white/5 focus:border-joulet-teal/40 rounded-xl px-4 py-3 text-lg font-bold text-white placeholder-slate-600 focus:outline-none transition-colors"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <button
                                            onClick={() => setAmount(jltBalance.toString())}
                                            className="text-[9px] font-medium text-joulet-teal bg-joulet-teal/8 px-2 py-0.5 rounded border border-joulet-teal/15 hover:bg-joulet-teal/15"
                                        >
                                            MAX
                                        </button>
                                        <span className="text-sm font-medium text-white/40">JLT</span>
                                    </div>
                                </div>
                            </div>

                            {/* Warnings */}
                            {parseAmount > jltBalance && (
                                <div className="bg-joulet-red/8 border border-joulet-red/15 rounded-xl p-3 flex items-start gap-2.5">
                                    <AlertTriangle size={14} className="text-joulet-red shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-semibold text-joulet-red">Insufficient Balance</div>
                                        <div className="text-[10px] text-joulet-red/70 mt-0.5">Wait for oracle consensus to mint more tokens.</div>
                                    </div>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="bg-joulet-red/8 border border-joulet-red/15 rounded-xl p-3 flex items-start gap-2.5">
                                    <AlertTriangle size={14} className="text-joulet-red shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-semibold text-joulet-red">Transaction Failed</div>
                                        <div className="text-[10px] text-joulet-red/70 mt-0.5 break-words">{message}</div>
                                    </div>
                                </div>
                            )}

                            {/* Button */}
                            <button
                                onClick={handleSend}
                                disabled={!canSend}
                                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all flex justify-center items-center gap-2
                                    ${canSend
                                        ? 'bg-joulet-teal text-[#0a0f1e] hover:bg-joulet-green'
                                        : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                {status === 'signing' ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                                        Signing...
                                    </>
                                ) : (
                                    'Confirm & Sign'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SendModal;
