import React, { useEffect, useState } from 'react';
import { useWalletStore } from './store/walletStore';
import WalletHeader from './components/WalletHeader';
import AssetView from './components/AssetView';
import ActivityView from './components/ActivityView';
import DeviceView from './components/DeviceView';
import GridStatusView from './components/GridStatusView';
import AttackView from './components/AttackView';
import DashboardView from './components/DashboardView';
import ConfirmModal from './components/ConfirmModal';
import LoginScreen from './components/LoginScreen';
import IntroOverlay from './components/IntroOverlay';
import ChatBot from './components/ChatBot';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RadioTower, AlertTriangle, LayoutDashboard, LogOut } from 'lucide-react';
import { HARDHAT_PROFILES } from './core/keyManager';

function App() {
  const { authStatus, logout, activeProfileId, pendingEnergy, isBrownout, fetchLiveStatus, isApiConnected } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assets' | 'activity' | 'devices' | 'grid' | 'security'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get current profile info
  const currentProfile = activeProfileId !== null ? HARDHAT_PROFILES[activeProfileId] : null;

  // Mock Merkle Root
  const mockMerkle = "0x8a3c9b7e4d2f1a6b0c8e9d4f1a2b3c4d5e6f7a8b9c0... (Mocked)";

  // Live Blockchain & API Data Feeds
  useEffect(() => {
    fetchLiveStatus(); // Initial fetch
    const fetchInterval = setInterval(() => {
      fetchLiveStatus();
    }, 1500); // Poll API and Blockchain every 1.5s

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
          <img src="/mascot.png" alt="Joulet" className="w-8 h-8 object-contain" />
          <span className="font-display font-black text-joulet-green tracking-wide text-lg">JOULET</span>
        </div>

        <div className="flex-1 px-3 py-4 flex flex-col justify-between">
          <div className="space-y-1">
            <SidebarButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Command Center" accentColor="joulet-indigo" />
            <SidebarButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<img src="/yield-icon.png" alt="Assets" className="w-[20px] h-[20px] object-contain" />} label="Wallet Assets" accentColor="joulet-green" />
            <SidebarButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={<img src="/nft-icon.png" alt="Logs" className="w-[20px] h-[20px] object-contain" />} label="Network Logs" accentColor="joulet-blue" />
            <SidebarButton active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} icon={<img src="/solar-icon.png" alt="Devices" className="w-[20px] h-[20px] object-contain" />} label="IOT Devices" accentColor="joulet-amber" />
            <SidebarButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<AlertTriangle size={20} />} label="Security Center" accentColor="joulet-red" />
            <div className="xl:hidden">
              <SidebarButton active={activeTab === 'grid'} onClick={() => setActiveTab('grid')} icon={<img src="/consensus-icon.png" alt="Status" className="w-[20px] h-[20px] object-contain" />} label="Grid Status" accentColor="joulet-amber" />
            </div>
          </div>

          <div className="pb-3 space-y-2">
            {/* Current Profile Info */}
            <div className="bg-[#0a0f1e]/50 border border-white/10 rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {activeProfileId === 0 ? (
                    <img src="/solar-icon.png" alt="Producer" className="w-8 h-8 object-contain" />
                  ) : (
                    <img src="/home-icon.png" alt="Consumer" className="w-8 h-8 object-contain" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">
                      {currentProfile?.name}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {currentProfile?.role}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-[9px] font-mono text-slate-500 bg-black/30 px-2 py-1.5 rounded border border-white/5 truncate">
                {currentProfile?.name.substring(0, 20)}...
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="group flex items-center justify-center gap-2 w-full p-3 rounded-xl cursor-pointer transition-all border border-joulet-red/20 bg-joulet-red/5 hover:bg-joulet-red/10 hover:border-joulet-red/30 text-white"
            >
              <LogOut size={16} className="text-joulet-red" />
              <span className="text-xs font-bold uppercase tracking-wider text-joulet-red">
                Logout
              </span>
            </button>
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

        <IntroOverlay />

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
            {activeTab === 'dashboard' && <ErrorBoundary label="Dashboard"><DashboardView /></ErrorBoundary>}
            {activeTab === 'assets' && <ErrorBoundary label="Assets"><AssetView /></ErrorBoundary>}
            {activeTab === 'activity' && <ErrorBoundary label="Activity"><ActivityView /></ErrorBoundary>}
            {activeTab === 'devices' && <ErrorBoundary label="Devices"><DeviceView /></ErrorBoundary>}
            {activeTab === 'security' && <ErrorBoundary label="Security"><AttackView /></ErrorBoundary>}
            {activeTab === 'grid' && <div className="xl:hidden h-full"><ErrorBoundary label="Grid"><GridStatusView /></ErrorBoundary></div>}
          </div>
        </div>

        <div className="lg:hidden bg-[#0a0f1e]/95 backdrop-blur-lg border-t border-white/5 flex justify-around items-center pt-2 pb-5 px-2 z-30 shrink-0">
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18} />} label="Dash" accentColor="joulet-indigo" />
          <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<img src="/yield-icon.png" alt="Assets" className="w-5 h-5 object-contain" />} label="Assets" accentColor="joulet-green" />
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<AlertTriangle size={18} />} label="CSOC" accentColor="joulet-red" />
          <TabButton active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} icon={<img src="/solar-icon.png" alt="Devices" className="w-5 h-5 object-contain" />} label="Devices" accentColor="joulet-amber" />
        </div>
      </main>

      {/* Right Sidebar - Grid Dashboard */}
      <aside className="hidden xl:flex w-[380px] 2xl:w-[440px] flex-col border-l border-white/5 bg-[#0f172a]/60 backdrop-blur-xl shrink-0 z-20 overflow-y-auto no-scrollbar">
        <ErrorBoundary label="Network Analytics"><GridStatusView isStandalone={true} /></ErrorBoundary>
      </aside>

      {/* Confirm Transaction Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        energyAmount={pendingEnergy}
        merkleRoot={mockMerkle}
        onSuccess={() => setIsModalOpen(false)}
      />

      {/* Floating AI Chatbot — only shown when logged in */}
      <ErrorBoundary label="ChatBot" fallback={<></>}>
        <ChatBot onNavigate={(tab) => setActiveTab(tab as any)} />
      </ErrorBoundary>

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
