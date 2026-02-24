import React, { useEffect, useState } from 'react';
import { useWalletStore } from './store/walletStore';
import WalletHeader from './components/WalletHeader';
import AssetView from './components/AssetView';
import ActivityView from './components/ActivityView';
import DeviceView from './components/DeviceView';
import GridStatusView from './components/GridStatusView';
import ConfirmModal from './components/ConfirmModal';
import { Activity, LayoutList, Cpu, Zap, RadioTower } from 'lucide-react';

function App() {
  const { isInitialized, initializeWallet, pendingEnergy, isBrownout, addIncident, updateGridStatus, updateAssets } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'assets' | 'activity' | 'devices' | 'grid'>('assets');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock Merkle Root
  const mockMerkle = "0x8a3c9b7e4d2f1a6b0c8e9d4f1a2b3c4d5e6f7a8b9c0... (Mocked)";

  // Bootstrap Wallet
  useEffect(() => {
    if (!isInitialized) {
      initializeWallet();
    }
  }, [isInitialized, initializeWallet]);

  // Mock Demo Data Injection (Live Grid Simulation)
  useEffect(() => {
    const simInterval = setInterval(() => {
      const randomDrop = Math.random() < 0.1;
      const newVolts = randomDrop ? 205 + Math.random() * 5 : 229 + Math.random() * 2;

      updateGridStatus({
        rmsVoltage: newVolts,
        isBrownout: newVolts < 210
      });

      if (newVolts < 210) {
        if (useWalletStore.getState().incidentLog.length === 0 || useWalletStore.getState().incidentLog[0].indexOf(`Voltage Drop to ${newVolts.toFixed(1)}V`) === -1) {
          addIncident(`Voltage Drop to ${newVolts.toFixed(1)}V`);
        }
        if (useWalletStore.getState().pendingEnergy > 0) {
          setIsModalOpen(true);
        }
      } else {
        updateAssets({
          pendingEnergy: useWalletStore.getState().pendingEnergy + Math.floor(Math.random() * 10),
          totalKwhGenerated: useWalletStore.getState().totalKwhGenerated + 1
        });
      }
    }, 3000);

    return () => clearInterval(simInterval);
  }, [addIncident, updateGridStatus, updateAssets]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#05080E] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-full max-w-[420px] bg-[#0B101E]/80 backdrop-blur-2xl rounded-[24px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border border-white/5 flex flex-col items-center justify-center p-12 relative overflow-hidden h-[500px]">
          <div className="absolute inset-0 bg-joulet-green/5 blur-3xl opacity-50 rounded-3xl pointer-events-none" />
          <Zap size={56} className="text-joulet-green mb-6 drop-shadow-[0_0_15px_rgba(0,230,118,0.6)] animate-pulse relative z-10" />
          <h1 className="text-2xl font-black mb-3 text-center tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-joulet-green to-joulet-blue relative z-10">Joulet Core</h1>
          <p className="text-slate-400 text-center text-xs font-medium tracking-widest uppercase mb-8 leading-relaxed relative z-10">Initializing<br />Hardware Security Module...</p>
          <div className="w-10 h-10 rounded-full border-[3px] border-white/10 border-t-joulet-blue animate-spin shadow-[0_0_15px_rgba(0,229,255,0.4)] relative z-10"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05080E] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#05080E] to-black text-white font-sans flex items-center justify-center p-4 lg:p-10 relative overflow-hidden">
      {/* Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="flex w-full max-w-[900px] justify-center xl:max-w-[1000px] xl:justify-between items-start gap-8 z-10 transition-all duration-500">

        {/* 1. Left Panel - Main Wallet Container */}
        <div className="w-full max-w-[420px] bg-[#0B101E]/80 backdrop-blur-2xl rounded-[24px] shadow-[0_30px_60px_-15px_rgba(0,0,0,1),0_0_20px_rgba(0,230,118,0.05)] border border-white/10 flex flex-col relative shrink-0 overflow-hidden" style={{ minHeight: "560px" }}>
          <WalletHeader />

          {/* Notification Banner for Pending Energy */}
          {pendingEnergy > 500 && !isBrownout && (
            <div className="bg-joulet-blue text-black text-[11px] font-black uppercase tracking-widest py-2 px-5 flex justify-between items-center z-20 shadow-[0_5px_20px_rgba(0,229,255,0.2)] border-b border-[#33EEFF]/50 relative overflow-hidden shrink-0">
              <span className="relative z-10 flex items-center gap-1">Batch Ready: {pendingEnergy} <span className="tracking-tight text-[9px] bg-black/10 px-1 py-0.5 rounded">kWh</span></span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="relative z-10 bg-black text-joulet-blue px-3 py-1 rounded-full hover:bg-black/80 hover:scale-105 transition-all shadow-inner border border-white/10 text-[10px]"
              >
                SIGN TX
              </button>
              <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
            </div>
          )}

          {/* Emergency Banner */}
          {isBrownout && pendingEnergy > 0 && (
            <div className="bg-red-600 text-white text-[11px] font-black uppercase tracking-widest py-2 px-5 flex justify-between items-center z-20 shadow-[0_5px_20px_rgba(255,59,48,0.4)] border-b border-red-400 relative overflow-hidden shrink-0">
              <span className="flex items-center gap-1.5 relative z-10">
                <RadioTower size={14} className="animate-ping text-white/80" />
                EMERGENCY FLUSH
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="relative z-10 bg-white text-red-600 px-3 py-1 rounded-full hover:bg-gray-100 hover:scale-105 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.4)] border border-red-200 shadow-inner text-[10px]"
              >
                APPROVE
              </button>
              <div className="absolute inset-0 bg-black/20 animate-pulse pointer-events-none" />
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 bg-[#05080E]/40" style={{ minHeight: "380px" }}>
            {activeTab === 'assets' && <AssetView />}
            {activeTab === 'activity' && <ActivityView />}
            {activeTab === 'devices' && <DeviceView />}
            {activeTab === 'grid' && <div className="xl:hidden h-full"><GridStatusView /></div>}
          </div>

          {/* Tab Navigation */}
          <div className="bg-[#05080E]/80 backdrop-blur-md border-t border-white/5 flex justify-around items-center pt-2 pb-4 px-2 z-20 relative shrink-0">
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<Zap size={20} />} label="Assets" accentColor="joulet-green" />
            <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={<LayoutList size={20} />} label="Activity" accentColor="joulet-blue" />
            <TabButton active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} icon={<Cpu size={20} />} label="Devices" accentColor="purple-400" />
            {/* Hide Grid tab on extra large screens where it's shown as a side panel */}
            <div className="xl:hidden">
              <TabButton active={activeTab === 'grid'} onClick={() => setActiveTab('grid')} icon={<Activity size={20} />} label="Status" accentColor="yellow-400" />
            </div>
          </div>
        </div>

        {/* 2. Right Panel - Live Grid Dashboard (Visible > 1200px) */}
        <div className="hidden xl:flex flex-col w-[420px] shrink-0 animate-in fade-in slide-in-from-right-8 duration-700">
          <GridStatusView isStandalone={true} />
        </div>
      </div>

      {/* Confirm Transaction Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        energyAmount={pendingEnergy}
        merkleRoot={mockMerkle}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  );
}

// Helper for Tab Navigation
function TabButton({ active, onClick, icon, label, accentColor }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, accentColor: string }) {

  const activeColorClass = `text-${accentColor}`;
  const activeBgClass = `bg-${accentColor}/10`;
  const glowClass = `shadow-[0_0_12px_rgba(var(--color-${accentColor}), 0.4)]`;

  // Quick fix: manually mapping tailwind colors for dynamic string interpolation
  let dropShadowMatch = "drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]";
  if (active) {
    if (accentColor === 'joulet-green') dropShadowMatch = "drop-shadow-[0_0_8px_rgba(0,230,118,0.8)]";
    if (accentColor === 'joulet-blue') dropShadowMatch = "drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]";
    if (accentColor === 'purple-400') dropShadowMatch = "drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]";
    if (accentColor === 'yellow-400') dropShadowMatch = "drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]";
  }

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col items-center justify-center w-[64px] cursor-pointer space-y-1 transition-all duration-300 relative px-1`}
    >
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? `${activeBgClass} border border-${accentColor}/20` : 'border border-transparent bg-transparent group-hover:bg-white/5 group-hover:-translate-y-0.5'}`}>
        <div className={`${active ? activeColorClass + " " + dropShadowMatch : 'text-slate-500 group-hover:text-slate-300'} transition-all duration-300 transform ${active && 'scale-110'}`}>
          {icon}
        </div>
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${active ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`}>{label}</span>
      {active && (
        <div className={`absolute -bottom-[14px] w-6 h-[3px] rounded-t-full bg-${accentColor} ${glowClass} animate-in fade-in zoom-in duration-300`} />
      )}
    </div>
  );
}

export default App;
