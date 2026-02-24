import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { Cpu, Signal, Lock } from 'lucide-react';

const DeviceView: React.FC = () => {
    const { deviceKeys } = useWalletStore();

    if (!deviceKeys) {
        return (
            <div className="p-4 text-center text-gray-400 mt-10">
                No devices connected
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Registered Devices</h2>
                <button className="text-xs bg-joulet-green/20 text-joulet-green px-3 py-1 rounded-full hover:bg-joulet-green/30 transition">
                    + Add Device
                </button>
            </div>

            <div className="bg-joulet-card rounded-xl p-5 border border-gray-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                    <div className="flex items-center space-x-1 text-green-400 text-xs font-semibold bg-green-900/30 px-2 py-1 rounded-full">
                        <Signal size={12} className="animate-pulse" />
                        <span>Online</span>
                    </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center border border-gray-600 shadow-inner">
                        <Cpu size={28} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">Smart Meter Alpha</h3>
                        <p className="text-xs text-gray-400">Joulet IoT Node v1.2</p>
                    </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400 flex items-center gap-1"><Lock size={12} /> Pub Key Hash</span>
                        <span className="font-mono text-blue-300">
                            {deviceKeys.address.slice(0, 6)}...{deviceKeys.address.slice(-4)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-gray-400">Role</span>
                        <span className="text-gray-200">Telemetry Signer</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Last Ping</span>
                        <span className="text-green-400">Just now</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeviceView;
