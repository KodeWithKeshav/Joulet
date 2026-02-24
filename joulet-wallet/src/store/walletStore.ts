import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import KeyManager, { type KeyPair } from '../core/keyManager';

interface WalletState {
    // Identity
    walletKeys: KeyPair | null;
    deviceKeys: KeyPair | null;
    isInitialized: boolean;

    // Assets
    jltBalance: number;
    carbonNfts: number;
    totalKwhGenerated: number;
    verifiedBatches: number;
    pendingEnergy: number;

    // Grid Status
    rmsVoltage: number;
    isBrownout: boolean;
    difficultyThreshold: number;
    oracleReputations: Record<string, number>;
    incidentLog: string[];

    // Actions
    initializeWallet: () => void;
    updateAssets: (updates: Partial<WalletState>) => void;
    updateGridStatus: (updates: Partial<WalletState>) => void;
    addIncident: (msg: string) => void;
    reset: () => void;
}

export const useWalletStore = create<WalletState>()(
    persist(
        (set) => ({
            // Init State
            walletKeys: null,
            deviceKeys: null,
            isInitialized: false,

            // Init Assets
            jltBalance: 0,
            carbonNfts: 0,
            totalKwhGenerated: 0,
            verifiedBatches: 0,
            pendingEnergy: 0,

            // Init Grid
            rmsVoltage: 230.1,
            isBrownout: false,
            difficultyThreshold: 1000, // 1000 kWh per JLT initially
            oracleReputations: {
                "Oracle_01": 0.95,
                "Oracle_02": 0.98,
                "Oracle_03": 0.89,
            },
            incidentLog: [],

            initializeWallet: () => {
                const wallet = KeyManager.generateWallet();
                const device = KeyManager.generateDeviceKeys();
                set({
                    walletKeys: wallet,
                    deviceKeys: device,
                    isInitialized: true
                });
            },

            updateAssets: (updates) => set((state) => ({ ...state, ...updates })),

            updateGridStatus: (updates) => set((state) => ({ ...state, ...updates })),

            addIncident: (msg) => set((state) => ({
                incidentLog: [
                    `[${new Date().toLocaleTimeString()}] ${msg}`,
                    ...state.incidentLog.slice(0, 9)
                ]
            })),

            reset: () => set({ walletKeys: null, deviceKeys: null, isInitialized: false })
        }),
        {
            name: 'joulet-wallet-storage',
            partialize: (state) => ({
                walletKeys: state.walletKeys,
                deviceKeys: state.deviceKeys,
                isInitialized: state.isInitialized
            }), // Only persist keys, mock live data
        }
    )
);
