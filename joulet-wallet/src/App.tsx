import React, { useEffect, useState } from 'react';
import { useWalletStore } from './store/walletStore';
import WalletHeader from './components/WalletHeader';
import AssetView from './components/AssetView';
import ActivityView from './components/ActivityView';
import DeviceView from './components/DeviceView';
import GridStatusView from './components/GridStatusView';
import ConfirmModal from './components/ConfirmModal';
import LoginScreen from './components/LoginScreen';
import { Activity, LayoutList, Cpu, Zap, RadioTower, AlertTriangle, LogOut } from 'lucide-react';

function App() {
  const { authStatus, logout, pendingEnergy, isBrownout, fetchLiveStatus, isApiConnected } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'assets' | 'activity' | 'devices' | 'grid'>('assets');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock Merkle Root
  const mockMerkle = "0x8a3c9b7e4d2f1a6b0c8e9d4f1a2b3c4d5e6f7a8b9c0... (Mocked)";

  // Live Blockchain & API Data Feeds
  useEffect(() => {
    fetchLiveStatus(); // Initial fetch
    const fetchInterval = setInterval(() => {
      fetchLiveStatus();
    }, 2500); // Poll API and Blockchain every 2.5s

    return () => clearInterval(fetchInterval);
  }, [fetchLiveStatus]);

  // Trigger auto flush modal on critical brownouts
  useEffect(() => {
    if (isBrownout && pendingEnergy > 0) {
      setIsModalOpen(true);
    }
  }, [isBrownout, pendingEnergy]);


  if (authStatus === 'locked') {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen w-screen bg-[#0a0f1e] text-[#e2e8f0] font-sans flex relative overflow-hidden">

      {/* Desktop Navigation Sidebar */}
      <aside className="hidden lg:flex w-[220px] flex-col border-r border-white/5 bg-[#0f172a]/80 backdrop-blur-xl z-20 shrink-0">
        <div className="p-5 border-b border-white/5 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#064E3B] flex items-center justify-center">
            <Zap className="text-joulet-green" size={16} />
          </div>
          <span className="font-display font-black text-joulet-green tracking-wide text-lg">JOULET</span>
        </div>

        <div className="flex-1 px-3 py-4 flex flex-col justify-between">
          <div className="space-y-1">
            <SidebarButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<Zap size={18} />} label="Wallet Assets" accentColor="joulet-green" />
            <SidebarButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={<LayoutList size={18} />} label="Network Logs" accentColor="joulet-blue" />
            <SidebarButton active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} icon={<Cpu size={18} />} label="IOT Devices" accentColor="joulet-indigo" />
            <div className="xl:hidden">
              <SidebarButton active={activeTab === 'grid'} onClick={() => setActiveTab('grid')} icon={<Activity size={18} />} label="Grid Status" accentColor="joulet-amber" />
            </div>
          </div>

          <div className="pb-3">
            <div
              onClick={logout}
              className="group flex items-center space-x-3 w-full p-3 rounded-xl cursor-pointer transition-all border border-transparent hover:bg-white/5 text-slate-500 hover:text-joulet-red"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[11px] font-bold uppercase tracking-widest transition-colors">Switch Profile</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center space-x-2 bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isApiConnected ? 'bg-joulet-green' : 'bg-joulet-red'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isApiConnected ? 'bg-joulet-green' : 'bg-joulet-red'}`}></span>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">{isApiConnected ? 'Connected' : 'Disconnected'}</div>
              <div className="text-[9px] text-slate-500 tracking-wider">Local RPC • 127.0.0.1</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10 overflow-hidden relative">

        <WalletHeader />

        {/* Notifications */}
        <div className="shrink-0 w-full z-20">
          {!isApiConnected && (
            <div className="bg-joulet-red/10 text-joulet-red text-xs font-semibold py-2.5 px-6 flex items-center justify-center gap-2 border-b border-joulet-red/20">
              <AlertTriangle size={14} /> API and blockchain disconnected. Check local services.
            </div>
          )}

          {pendingEnergy > 500 && !isBrownout && (
            <div className="bg-joulet-teal/10 text-joulet-teal text-xs font-semibold py-2.5 px-6 flex justify-between items-center border-b border-joulet-teal/20">
              <span className="flex items-center gap-2">Batch threshold reached: {pendingEnergy.toFixed(1)} kWh</span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-joulet-teal text-[#0a0f1e] px-4 py-1.5 rounded-full hover:bg-joulet-green transition-all text-xs font-bold"
              >
                Sign TX
              </button>
            </div>
          )}

          {isBrownout && pendingEnergy > 0 && (
            <div className="bg-joulet-red/15 text-white text-xs font-semibold py-2.5 px-6 flex justify-between items-center border-b border-joulet-red/30">
              <span className="flex items-center gap-2">
                <RadioTower size={16} className="text-joulet-red animate-pulse" />
                Emergency flush protocol active
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-joulet-red text-white px-4 py-1.5 rounded-full hover:bg-red-400 transition-all text-xs font-bold"
              >
                Approve
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 lg:p-8 w-full max-w-5xl mx-auto flex flex-col">
          <div className="w-full flex-1 bg-[#0f172a]/60 backdrop-blur-xl rounded-2xl border border-white/5 relative overflow-hidden">
            {activeTab === 'assets' && <AssetView />}
            {activeTab === 'activity' && <ActivityView />}
            {activeTab === 'devices' && <DeviceView />}
            {activeTab === 'grid' && <div className="xl:hidden h-full"><GridStatusView /></div>}
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden bg-[#0a0f1e]/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center pt-2 pb-5 px-2 z-30 shrink-0">
          <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<Zap size={20} />} label="Assets" accentColor="joulet-green" />
          <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={<LayoutList size={20} />} label="Activity" accentColor="joulet-blue" />
          <TabButton active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} icon={<Cpu size={20} />} label="Devices" accentColor="joulet-indigo" />
          <div className="xl:hidden">
            <TabButton active={activeTab === 'grid'} onClick={() => setActiveTab('grid')} icon={<Activity size={20} />} label="Status" accentColor="joulet-amber" />
          </div>
        </div>
      </main>

      {/* Right Sidebar - Grid Dashboard */}
      <aside className="hidden xl:flex w-[380px] 2xl:w-[440px] flex-col border-l border-white/5 bg-[#0f172a]/60 backdrop-blur-xl shrink-0 z-20 overflow-y-auto no-scrollbar">
        <GridStatusView isStandalone={true} />
      </aside>

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

// Helper for Sidebar Buttons (Desktop)
function SidebarButton({ active, onClick, icon, label, accentColor }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, accentColor: string }) {
  const activeColorClass = `text-${accentColor}`;
  const activeBgClass = `bg-${accentColor}/10`;

  return (
    <div
      onClick={onClick}
      className={`group flex items-center space-x-3 w-full p-3 rounded-xl cursor-pointer transition-all ${active ? `${activeBgClass} border border-${accentColor}/15` : 'border border-transparent hover:bg-white/5'}`}
    >
      <div className={`${active ? activeColorClass : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
        {icon}
      </div>
      <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{label}</span>
    </div>
  )
}

// Helper for Tab Navigation (Mobile)
function TabButton({ active, onClick, icon, label, accentColor }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, accentColor: string }) {
  const activeColorClass = `text-${accentColor}`;
  const activeBgClass = `bg-${accentColor}/10`;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col items-center justify-center w-[65px] cursor-pointer space-y-1 transition-all"
    >
      <div className={`p-2 rounded-xl transition-all ${active ? `${activeBgClass}` : ''}`}>
        <div className={`${active ? activeColorClass : 'text-slate-500'} transition-colors`}>
          {icon}
        </div>
      </div>
      <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
    </div>
  );
}

export default App;
