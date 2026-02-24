import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import KeyManager, { type KeyPair } from '../core/keyManager';
import { ethers } from 'ethers';

// Keep this hardcoded for demo or load from env
const HARDHAT_RPC = 'http://127.0.0.1:8545';
const API_URL = 'http://localhost:5004/api/status';

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

    // Connectivity
    isApiConnected: boolean;

    // Actions
    initializeWallet: () => void;
    updateAssets: (updates: Partial<WalletState>) => void;
    updateGridStatus: (updates: Partial<WalletState>) => void;
    addIncident: (msg: string) => void;
    fetchLiveStatus: () => Promise<void>;
    reset: () => void;
}

export const useWalletStore = create<WalletState>()(
    persist(
        (set, get) => ({
            walletKeys: null,
            deviceKeys: null,
            isInitialized: false,

            jltBalance: 0,
            carbonNfts: 0,
            totalKwhGenerated: 0,
            verifiedBatches: 0,
            pendingEnergy: 0,

            rmsVoltage: 0,
            isBrownout: false,
            difficultyThreshold: 1000,
            oracleReputations: {},
            incidentLog: [],
            isApiConnected: false,

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
                    ...state.incidentLog.slice(0, 49) // Keep last 50
                ]
            })),

            fetchLiveStatus: async () => {
                try {
                    // 1. Fetch from IoT simulation API (Grid Status & Mocked Pending Energy)
                    const response = await fetch(API_URL);
                    if (!response.ok) throw new Error("API Offline");

                    const data = await response.json();

                    // The backend returns metrics like metrics.accumulated_energy
                    const pending = data.metrics?.accumulated_energy || 0;
                    const isOracleConnected = data.oracle?.connected || false;

                    // Simulated voltage logic based on current production vs threshold
                    const prodRatio = data.metrics?.current_production / (data.metrics?.reporting_threshold || 1);
                    const calculatedVolts = 230 - (prodRatio * 5); // Just a visual mock based on real api rate
                    const isBrownout = data.metrics?.current_production > 10; // Simple threshold logic

                    const state = get();
                    if (isBrownout && !state.isBrownout) {
                        state.addIncident(`Grid Stress Detected: Demand Spiking`);
                    }

                    // 2. Fetch from Blockchain if Contract address provided in API response
                    let jltBalance = state.jltBalance;
                    const contractAddr = data.contract?.address;
                    if (contractAddr && state.walletKeys) {
                        try {
                            const provider = new ethers.JsonRpcProvider(HARDHAT_RPC);

                            // ABI for checking balance
                            const abi = ["function balanceOf(address owner) view returns (uint256)"];
                            const contract = new ethers.Contract(contractAddr, abi, provider);

                            const rawBalance = await contract.balanceOf(state.walletKeys.address);
                            jltBalance = parseFloat(ethers.formatUnits(rawBalance, 18));
                        } catch (err) {
                            console.error("Blockchain fetch failed:", err);
                        }
                    }

                    set({
                        isApiConnected: true,
                        pendingEnergy: pending,
                        totalKwhGenerated: data.metrics?.total_reported || 0,
                        verifiedBatches: data.metrics?.reports_count || 0,
                        rmsVoltage: calculatedVolts > 0 ? calculatedVolts : 230,
                        isBrownout: isBrownout,
                        jltBalance: jltBalance,
                        // Update reputations purely visually for now if oracle connected
                        oracleReputations: isOracleConnected ? {
                            "Node_Alpha": 0.99,
                            "Node_Beta": 0.94,
                            "Node_Gamma": 0.88
                        } : {}
                    });

                } catch (error) {
                    set({ isApiConnected: false });
                }
            },

            reset: () => set({ walletKeys: null, deviceKeys: null, isInitialized: false })
        }),
        {
            name: 'joulet-wallet-storage',
            partialize: (state) => ({
                walletKeys: state.walletKeys,
                deviceKeys: state.deviceKeys,
                isInitialized: state.isInitialized
            }),
        }
    )
);
