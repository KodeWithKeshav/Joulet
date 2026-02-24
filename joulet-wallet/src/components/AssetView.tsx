import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Zap, Leaf, Activity, ArrowDownToLine, ArrowUpRight } from 'lucide-react';

const AssetView: React.FC = () => {
    const { jltBalance, carbonNfts, totalKwhGenerated, verifiedBatches } = useWalletStore();

    return (
        <div className="p-4 space-y-4">
            {/* Primary Balance */}
            <div className="text-center py-6">
                <div className="text-4xl font-bold text-white mb-2 flex justify-center items-center gap-2">
                    {jltBalance.toFixed(2)} <span className="text-joulet-green text-3xl">JLT</span>
                </div>
                <div className="text-sm text-gray-400">Joulet Energy Token</div>
            </div>

            {/* Quick Actions (Mock) */}
            <div className="flex justify-center space-x-8 mb-6 pb-6 border-b border-gray-700">
                <div className="flex flex-col items-center cursor-pointer hover:text-joulet-green transition-colors text-blue-400">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                        <ArrowDownToLine size={20} />
                    </div>
                    <span className="text-xs font-medium">Receive</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:text-joulet-green transition-colors text-blue-400">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                        <ArrowUpRight size={20} />
                    </div>
                    <span className="text-xs font-medium">Send</span>
                </div>
            </div>

            {/* Asset List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between bg-joulet-card p-4 rounded-xl hover:bg-gray-700 transition cursor-pointer">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                            <Leaf size={20} />
                        </div>
                        <div>
                            <div className="font-semibold text-white">Carbon NFTs</div>
                            <div className="text-xs text-gray-400">Verified Offsets</div>
                        </div>
                    </div>
                    <div className="text-lg font-bold">{carbonNfts}</div>
                </div>

                <div className="flex items-center justify-between bg-joulet-card p-4 rounded-xl hover:bg-gray-700 transition cursor-pointer">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                            <Zap size={20} />
                        </div>
                        <div>
                            <div className="font-semibold text-white">Total Output</div>
                            <div className="text-xs text-gray-400">Lifetime energy generated</div>
                        </div>
                    </div>
                    <div className="text-lg font-bold">{totalKwhGenerated} <span className="text-sm text-gray-400 font-normal">kWh</span></div>
                </div>

                <div className="flex items-center justify-between bg-joulet-card p-4 rounded-xl hover:bg-gray-700 transition cursor-pointer">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Activity size={20} />
                        </div>
                        <div>
                            <div className="font-semibold text-white">Verified Batches</div>
                            <div className="text-xs text-gray-400">Oracle consensus</div>
                        </div>
                    </div>
                    <div className="text-lg font-bold">{verifiedBatches}</div>
                </div>
            </div>
        </div>
    );
};

export default AssetView;
