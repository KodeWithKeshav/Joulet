import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import KeyManager, { type KeyPair, HARDHAT_PROFILES } from '../core/keyManager';
import TransactionManager from '../core/transactionManager';
import { ethers } from 'ethers';

const HARDHAT_RPC = 'http://127.0.0.1:8545';
const API_URL = "http://127.0.0.1:5004/api/status"; // Main Producer API
const CONSENSUS_API_URL = "http://127.0.0.1:5010/api/consensus/status"; // Oracle Consensus Engine
const GRID_API_URL = "http://127.0.0.1:5004/api/grid/status"; // Real RLC physics grid data

interface WalletState {
    authStatus: 'locked' | 'unlocked';
    activeProfileId: number | null;

    walletKeys: KeyPair | null;
    deviceKeys: KeyPair | null;

    fiatBalances: Record<number, number>; // Maps profileId -> fiat amount
    jltBalance: number;
    currentJltPrice: number;
    carbonNfts: number;
    totalKwhGenerated: number;
    verifiedBatches: number;
    pendingEnergy: number;

    rmsVoltage: number;
    isBrownout: boolean;
    difficultyThreshold: number;
    difficultyHistory: number[];
    oracleReputations: Record<string, number>;
    incidentLog: string[];

    isApiConnected: boolean;

    login: (profileId: number) => void;
    logout: () => void;

    getFiatBalance: () => number;
    addFiat: (amount: number) => void;
    executeTrade: (type: 'buy' | 'sell', jltAmount: number) => Promise<boolean>;

    updateAssets: (updates: Partial<WalletState>) => void;
    updateGridStatus: (updates: Partial<WalletState>) => void;
    addIncident: (msg: string) => void;
    fetchLiveStatus: () => Promise<void>;
    reset: () => void;
}

export const useWalletStore = create<WalletState>()(
    persist(
        (set, get) => ({
            authStatus: 'locked',
            activeProfileId: null,

            walletKeys: null,
            deviceKeys: null,

            fiatBalances: {},
            jltBalance: 0,
            currentJltPrice: 0.50, // default genesis price
            carbonNfts: 0,
            totalKwhGenerated: 0,
            verifiedBatches: 0,
            pendingEnergy: 0,

            rmsVoltage: 0,
            isBrownout: false,
            difficultyThreshold: 1000,
            difficultyHistory: [],
            oracleReputations: {},
            incidentLog: [],
            isApiConnected: false,

            login: (profileId: number) => {
                const wallet = KeyManager.loadProfile(profileId);
                const device = KeyManager.generateDeviceKeys(); // Still generate random device keys for simulation

                // Initialize DEX Pool if we login as producer
                if (profileId === 0) {
                    TransactionManager.initDexPool(HARDHAT_PROFILES[0].privateKey).catch(console.error);
                }

                // Initialize fiat balance for new users (Consumers get $200 starter balance)
                const state = get();
                const existingFiatBalance = state.fiatBalances[profileId];
                const newFiatBalances = existingFiatBalance === undefined 
                    ? { ...state.fiatBalances, [profileId]: profileId === 0 ? 0 : 200 }
                    : state.fiatBalances;

                set({
                    authStatus: 'unlocked',
                    activeProfileId: profileId,
                    walletKeys: wallet,
                    deviceKeys: device,
                    jltBalance: 0,
                    totalKwhGenerated: 0,
                    verifiedBatches: 0,
                    pendingEnergy: 0,
                    fiatBalances: newFiatBalances
                });
            },

            logout: () => {
                set({
                    authStatus: 'locked',
                    activeProfileId: null,
                    walletKeys: null,
                    deviceKeys: null
                });
                get().reset(); // wipe potentially sensitive state
            },

            getFiatBalance: () => {
                const state = get();
                if (state.activeProfileId === null) return 0;
                return state.fiatBalances[state.activeProfileId] || 0;
            },

            addFiat: (amount: number) => {
                const state = get();
                if (state.activeProfileId === null) return;
                const current = state.fiatBalances[state.activeProfileId] || 0;
                set({
                    fiatBalances: {
                        ...state.fiatBalances,
                        [state.activeProfileId]: current + amount
                    }
                });
                get().addIncident(`Deposited $${amount.toFixed(2)} USD via Wire Transfer.`);
            },

            executeTrade: async (type: 'buy' | 'sell', jltAmount: number) => {
                const state = get();
                if (state.activeProfileId === null || !state.walletKeys) return false;

                const price = state.currentJltPrice;
                const totalValue = jltAmount * price;
                const currentFiat = state.fiatBalances[state.activeProfileId] || 0;

                // Basic validation
                if (type === 'buy' && currentFiat < totalValue) return false;
                if (type === 'sell' && state.jltBalance < jltAmount) return false;

                try {
                    // Trigger actual blockchain transfer using TransactionManager
                    await TransactionManager.executeOnChainSwap(state.walletKeys.privateKey, type, jltAmount);

                    // Transaction successful, update Fiat state (token balance updates safely via fetchLiveStatus loops)
                    let reportMessage = "";
                    if (type === 'buy') {
                        set({
                            fiatBalances: {
                                ...state.fiatBalances,
                                [state.activeProfileId]: currentFiat - totalValue
                            }
                        });
                        reportMessage = `Market DEX Buy: ${state.walletKeys.address.slice(0, 6)}... bought ${jltAmount} JLT for $${totalValue.toFixed(2)}`;
                        get().addIncident(`Executed Market Buy: +${jltAmount} JLT for $${totalValue.toFixed(2)}.`);
                    } else {
                        set({
                            fiatBalances: {
                                ...state.fiatBalances,
                                [state.activeProfileId]: currentFiat + totalValue
                            }
                        });
                        reportMessage = `Market DEX Sell: ${state.walletKeys.address.slice(0, 6)}... sold ${jltAmount} JLT for $${totalValue.toFixed(2)}`;
                        get().addIncident(`Executed Market Sell: -${jltAmount} JLT for $${totalValue.toFixed(2)}.`);
                    }

                    // Push to the global Dashboard ledger
                    try {
                        const baseUrl = API_URL.replace('/api/status', '/api/ledger/trade');
                        await fetch(baseUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ details: reportMessage })
                        });
                    } catch (e) {
                        console.warn("Could not sync with Global Ledger", e);
                    }

                    // Immediately fetch live token balance since it changed
                    await get().fetchLiveStatus();
                    return true;
                } catch (err) {
                    console.error("Trade Execution Failed:", err);
                    get().addIncident(`Trade Failed: ${type} ${jltAmount} JLT`);
                    return false;
                }
            },

            updateAssets: (updates) => set((state) => ({ ...state, ...updates })),

            updateGridStatus: (updates) => set((state) => ({ ...state, ...updates })),

            addIncident: (msg) => set((state) => ({
                incidentLog: [
                    `[${new Date().toLocaleTimeString()}] ${msg}`,
                    ...state.incidentLog.slice(0, 49)
                ]
            })),

            fetchLiveStatus: async () => {
                const state = get();
                // If not logged in, we can still fetch grid status, but balancing logic should skip.

                try {
                    const response = await fetch(API_URL);
                    if (!response.ok) throw new Error("API Offline");

                    const data = await response.json();

                    const pending = data.metrics?.accumulated_energy || 0;

                    // ── Fetch REAL grid physics data from RLC simulation ──
                    let liveVoltage = state.rmsVoltage || 230;
                    let liveBrownout = false;
                    try {
                        const gridRes = await fetch(GRID_API_URL);
                        if (gridRes.ok) {
                            const gridData = await gridRes.json();
                            // Real RLC-physics voltage from api_bridge.py grid simulation
                            liveVoltage = gridData.voltage || 230;
                            // Brownout = voltage sag below 210V (IEEE standard ~10% sag)
                            liveBrownout = liveVoltage < 210.0;
                        }
                    } catch {
                        // Grid API may not be available; keep previous values
                    }

                    if (liveBrownout && !state.isBrownout) {
                        state.addIncident(`⚠ Grid Brownout Detected: Voltage ${liveVoltage.toFixed(1)}V (< 210V threshold)`);
                    }

                    // Extract actual blockchain difficulty directly from API bridge
                    const liveDifficulty = data.metrics?.reporting_threshold || state.difficultyThreshold;
                    let newDiffHistory = [...state.difficultyHistory];

                    // Only push if changed to avoid massive array of duplicates
                    if (newDiffHistory.length === 0 || liveDifficulty !== newDiffHistory[newDiffHistory.length - 1]) {
                        newDiffHistory.push(liveDifficulty);
                        // Keep last 15 points
                        if (newDiffHistory.length > 15) newDiffHistory.shift();
                    }

                    // Calculate dynamic JLT Price based on difficulty metrics. 
                    // Higher difficulty means harder to mine, establishing a higher floor price
                    const computedPrice = Math.max(0.10, (liveDifficulty / 10) * 0.50);

                    let jltBalance = state.jltBalance;
                    let additionalIncidents: string[] = [];
                    const contractAddr = data.contract?.address || data.oracle?.address;

                    // Only attempt to fetch wallet balance if currently logged in
                    if (contractAddr && state.authStatus === 'unlocked' && state.walletKeys) {
                        try {
                            const provider = new ethers.JsonRpcProvider(HARDHAT_RPC);
                            const abi = ["function balanceOf(address owner) view returns (uint256)"];
                            const contract = new ethers.Contract(contractAddr, abi, provider);

                            const rawBalance = await contract.balanceOf(state.walletKeys.address);
                            let parsedBal = parseFloat(ethers.formatUnits(rawBalance, 18));
                            // Hide the generic genesis liquidity from the UI so live mining feels authentic
                            if (state.activeProfileId === 0 && parsedBal >= 450000) {
                                parsedBal -= 450000;
                            }

                            // Clamp to max(0, bal) in case we manually burned tokens in test scripts
                            const newBal = Math.max(0, parsedBal);

                            // Detect background transfers / deposits that weren't manually triggered
                            if (state.jltBalance > 0 && newBal !== state.jltBalance) {
                                const diff = newBal - state.jltBalance;
                                if (diff > 0) {
                                    const amountStr = diff.toFixed(2);
                                    if (!state.incidentLog.slice(0, 5).some(l => l.includes(`+${amountStr}`))) {
                                        additionalIncidents.push(`[${new Date().toLocaleTimeString()}] Received Transfer: +${amountStr} JLT deposited to your wallet.`);
                                    }
                                } else {
                                    const amountStr = Math.abs(diff).toFixed(2);
                                    if (!state.incidentLog.slice(0, 5).some(l => l.includes(`-${amountStr}`))) {
                                        additionalIncidents.push(`[${new Date().toLocaleTimeString()}] Outbound Transfer: -${amountStr} JLT sent from your wallet.`);
                                    }
                                }
                            }
                            jltBalance = newBal;
                        } catch (err) {
                            console.error("Blockchain fetch failed:", err);
                        }
                    }

                    // ── Fetch REAL oracle reputations from consensus engine ──
                    let liveReputations: Record<string, number> = {};
                    try {
                        const consensusRes = await fetch(CONSENSUS_API_URL);
                        if (consensusRes.ok) {
                            const consensusData = await consensusRes.json();
                            if (consensusData.oracle?.reputations) {
                                // Map raw consensus engine keys to display names
                                const rawReps = consensusData.oracle.reputations as Record<string, number>;
                                const nameMap: Record<string, string> = {
                                    'oracle_1': 'Node_Alpha',
                                    'oracle_2': 'Node_Beta',
                                    'oracle_3': 'Node_Gamma'
                                };
                                for (const [key, val] of Object.entries(rawReps)) {
                                    const displayName = nameMap[key] || key;
                                    liveReputations[displayName] = val;
                                }
                            }
                        }
                    } catch {
                        // Keep previous if offline
                        liveReputations = state.oracleReputations;
                    }

                    set({
                        isApiConnected: true,
                        // Update metrics (using total_reported for total kWh generated)
                        pendingEnergy: state.activeProfileId === 0 ? pending : 0,
                        totalKwhGenerated: state.activeProfileId === 0 ? (data.metrics?.total_reported || 0) : 0,
                        verifiedBatches: state.activeProfileId === 0 ? (data.metrics?.reports_count || 0) : 0,

                        rmsVoltage: liveVoltage,
                        isBrownout: liveBrownout,
                        jltBalance: jltBalance,
                        currentJltPrice: computedPrice,
                        difficultyThreshold: liveDifficulty,
                        difficultyHistory: newDiffHistory,
                        oracleReputations: liveReputations,
                        ...(additionalIncidents.length > 0 && {
                            incidentLog: [...additionalIncidents, ...state.incidentLog].slice(0, 50)
                        })
                    });

                } catch (error) {
                    set({ isApiConnected: false });
                }
            },

            reset: () => set({
                jltBalance: 0,
                carbonNfts: 0,
                difficultyHistory: [],
                incidentLog: []
            })
        }),
        {
            name: 'joulet-wallet-storage',
            partialize: (state) => ({
                authStatus: state.authStatus,
                activeProfileId: state.activeProfileId,
                walletKeys: state.walletKeys,
                deviceKeys: state.deviceKeys,
                fiatBalances: state.fiatBalances,
                difficultyHistory: state.difficultyHistory,
                incidentLog: state.incidentLog
            }),
        }
    )
);
