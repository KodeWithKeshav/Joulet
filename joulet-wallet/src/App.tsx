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
    <div className="min-h-screen w-screen bg-[#05080E] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#05080E] to-black text-white font-sans flex relative overflow-hidden">
      {/* Subtle Grid Texture Background for the whole screen */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Desktop Navigation Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-[240px] flex-col border-r border-white/5 bg-[#0B101E]/60 backdrop-blur-2xl z-20 shrink-0 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-joulet-green to-teal-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,230,118,0.4)]">
            <Zap className="text-white fill-white/20" size={16} />
          </div>
          <span className="font-black text-white tracking-wider text-xl">JOULET</span>
        </div>

        <div className="flex-1 px-4 py-2 flex flex-col justify-between">
          <div className="space-y-2">
            <SidebarButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<Zap size={20} />} label="Wallet Assets" accentColor="joulet-green" />
            <SidebarButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={<LayoutList size={20} />} label="Network Logs" accentColor="joulet-blue" />
            <SidebarButton active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} icon={<Cpu size={20} />} label="IOT Devices" accentColor="purple-400" />
            <div className="xl:hidden">
              <SidebarButton active={activeTab === 'grid'} onClick={() => setActiveTab('grid')} icon={<Activity size={20} />} label="Grid Diagnostics" accentColor="yellow-400" />
            </div>
          </div>

          <div className="pb-4">
            <div
              onClick={logout}
              className="group flex items-center space-x-3 w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden border border-transparent hover:bg-white/5 text-slate-500 hover:text-red-400"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest transition-colors text-slate-500 group-hover:text-red-400">Switch Profile</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center space-x-2 bg-black/40 rounded-xl p-3 border border-white/5 group">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isApiConnected ? 'bg-joulet-green' : 'bg-red-500'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isApiConnected ? 'bg-joulet-green shadow-[0_0_8px_#00E676]' : 'bg-red-500 shadow-[0_0_8px_#EF4444]'}`}></span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-white uppercase tracking-widest">{isApiConnected ? 'Connected' : 'Disconnected'}</div>
              <div className="text-[9px] text-slate-500 tracking-wider">Local RPC • 127.0.0.1</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Fluid Center) */}
      <main className="flex-1 flex flex-col min-w-0 z-10 overflow-hidden relative">

        <WalletHeader />

        {/* Notifications area */}
        <div className="shrink-0 w-full z-20 shadow-xl">
          {/* API Warning */}
          {!isApiConnected && (
            <div className="bg-red-950/40 text-red-500 text-[11px] font-bold uppercase tracking-widest py-3 px-6 flex items-center justify-center gap-2 border-b border-red-500/30 backdrop-blur-md">
              <AlertTriangle size={14} className="animate-pulse" /> CRITICAL: API and Blockchain disconnected. Check Local Services.
            </div>
          )}

          {/* Notification Banner for Pending Energy */}
          {pendingEnergy > 500 && !isBrownout && (
            <div className="bg-joulet-blue/90 backdrop-blur-md text-[#05080E] text-[11px] font-black uppercase tracking-widest py-3 px-6 flex justify-between items-center z-20 border-b border-[#33EEFF] relative overflow-hidden shrink-0 shadow-[0_5px_30px_rgba(0,229,255,0.2)]">
              <span className="relative z-10 flex items-center gap-2 text-sm drop-shadow-md">Batch Threshold Reached: {pendingEnergy.toFixed(1)} <span className="tracking-tight text-[10px] bg-black/20 text-[#05080E] px-1.5 py-0.5 rounded shadow-inner">kWh</span></span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="relative z-10 bg-[#05080E] text-joulet-blue px-6 py-2 rounded-full hover:bg-black hover:scale-105 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.5)] border border-white/10 text-xs tracking-widest"
              >
                SIGN PROTOCOL TX
              </button>
              <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
            </div>
          )}

          {/* Emergency Banner */}
          {isBrownout && pendingEnergy > 0 && (
            <div className="bg-red-600/95 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-widest py-3 px-6 flex justify-between items-center z-20 shadow-[0_5px_30px_rgba(255,59,48,0.5)] border-b border-red-400 relative overflow-hidden shrink-0">
              <span className="flex items-center gap-2 relative z-10 text-sm drop-shadow-md">
                <RadioTower size={18} className="animate-ping text-white/80" />
                EMERGENCY FLUSH PROTOCOL ACTIVE
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="relative z-10 bg-white text-red-600 px-6 py-2 rounded-full hover:bg-gray-100 hover:scale-105 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.5)] border border-red-200 text-xs tracking-widest"
              >
                APPROVE
              </button>
              <div className="absolute inset-0 bg-black/20 animate-pulse pointer-events-none" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 lg:p-10 w-full max-w-6xl mx-auto flex flex-col">
          <div className="w-full flex-1 bg-[#0B101E]/40 backdrop-blur-xl rounded-[24px] border border-white/5 shadow-2xl relative overflow-hidden">
            {activeTab === 'assets' && <AssetView />}
            {activeTab === 'activity' && <ActivityView />}
            {activeTab === 'devices' && <DeviceView />}
            {activeTab === 'grid' && <div className="xl:hidden h-full"><GridStatusView /></div>}
          </div>
        </div>

        {/* Mobile Tab Navigation (Hidden on Desktop) */}
        <div className="lg:hidden bg-[#05080E]/90 backdrop-blur-lg border-t border-white/5 flex justify-around items-center pt-3 pb-6 px-2 z-30 shrink-0 safe-area-pb">
          <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} icon={<Zap size={22} />} label="Assets" accentColor="joulet-green" />
          <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={<LayoutList size={22} />} label="Activity" accentColor="joulet-blue" />
          <TabButton active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} icon={<Cpu size={22} />} label="Devices" accentColor="purple-400" />
          <div className="xl:hidden">
            <TabButton active={activeTab === 'grid'} onClick={() => setActiveTab('grid')} icon={<Activity size={22} />} label="Status" accentColor="yellow-400" />
          </div>
        </div>
      </main>

      {/* Right Sidebar - Live Grid Dashboard (Visible > 1200px) */}
      <aside className="hidden xl:flex w-[400px] 2xl:w-[480px] flex-col border-l border-white/5 bg-[#0B101E]/40 backdrop-blur-xl shrink-0 z-20 shadow-2xl overflow-y-auto no-scrollbar">
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
  const activeBgClass = `bg-${accentColor}/10 border-${accentColor}/20`;
  let dropShadowMatch = "";
  if (active) {
    if (accentColor === 'joulet-green') dropShadowMatch = "drop-shadow-[0_0_8px_rgba(0,230,118,0.8)]";
    if (accentColor === 'joulet-blue') dropShadowMatch = "drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]";
    if (accentColor === 'purple-400') dropShadowMatch = "drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]";
    if (accentColor === 'yellow-400') dropShadowMatch = "drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]";
  }

  return (
    <div
      onClick={onClick}
      className={`group flex items-center space-x-3 w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden ${active ? activeBgClass + ' border shadow-inner' : 'border border-transparent hover:bg-white/5'}`}
    >
      {active && (
        <div className={`absolute left-0 top-0 w-1 h-full bg-${accentColor} shadow-[0_0_15px_rgba(var(--color-${accentColor}),1)]`} />
      )}
      <div className={`${active ? activeColorClass + " " + dropShadowMatch : 'text-slate-500 group-hover:text-slate-300'} transition-all duration-300`}>
        {icon}
      </div>
      <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{label}</span>
    </div>
  )
}

// Helper for Tab Navigation (Mobile)
function TabButton({ active, onClick, icon, label, accentColor }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, accentColor: string }) {
  const activeColorClass = `text-${accentColor}`;
  const activeBgClass = `bg-${accentColor}/10`;
  const glowClass = `shadow-[0_0_12px_rgba(var(--color-${accentColor}), 0.4)]`;

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
      className={`group flex flex-col items-center justify-center w-[70px] cursor-pointer space-y-1 transition-all duration-300 relative px-1`}
    >
      <div className={`p-2 rounded-2xl transition-all duration-300 ${active ? `${activeBgClass} border border-${accentColor}/20` : 'border border-transparent bg-transparent'}`}>
        <div className={`${active ? activeColorClass + " " + dropShadowMatch : 'text-slate-500'} transition-all duration-300 transform ${active && 'scale-110'}`}>
          {icon}
        </div>
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
      {active && (
        <div className={`absolute -bottom-[20px] w-8 h-[3px] rounded-t-full bg-${accentColor} ${glowClass} animate-in fade-in zoom-in duration-300`} />
      )}
    </div>
  );
}

export default App;
