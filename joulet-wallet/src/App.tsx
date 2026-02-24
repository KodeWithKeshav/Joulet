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
  const mockMerkle = "0x8a3c...d9f1 (Mocked)";

  // Bootstrap Wallet
  useEffect(() => {
    if (!isInitialized) {
      initializeWallet();
    }
  }, [isInitialized, initializeWallet]);

  // Mock Demo Data Injection (Live Grid Simulation)
  useEffect(() => {
    const simInterval = setInterval(() => {
      const randomDrop = Math.random() < 0.1; // 10% chance
      const newVolts = randomDrop ? 205 + Math.random() * 5 : 229 + Math.random() * 2;

      updateGridStatus({
        rmsVoltage: newVolts,
        isBrownout: newVolts < 210
      });

      if (newVolts < 210) {
        addIncident(`Voltage Drop to ${newVolts.toFixed(1)}V`);
        // Auto flush trigger
        if (useWalletStore.getState().pendingEnergy > 0) {
          console.log("Brownout detected! Auto-flushing pending energy...");
          setIsModalOpen(true);
        }
      } else {
        // Randomly accumulate energy 
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
      <div className="w-[400px] h-[600px] bg-joulet-dark flex items-center justify-center text-white font-sans rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="flex flex-col items-center">
          <Zap size={48} className="text-joulet-green mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold mb-2">Joulet Wallet</h1>
          <p className="text-gray-400 mb-8 text-center text-sm px-6">Initializing secure cryptographic environment...</p>
          <div className="w-8 h-8 rounded-full border-4 border-joulet-green border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[400px] h-[600px] bg-joulet-dark text-white font-sans rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden border border-gray-700 flex flex-col relative">
      <WalletHeader />

      {/* Notification Banner for Pending Energy */}
      {pendingEnergy > 500 && !isBrownout && (
        <div className="bg-blue-600/90 text-white text-xs py-2 px-4 flex justify-between items-center z-10">
          <span>Batch Ready: {pendingEnergy} kWh</span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-blue-600 px-3 py-1 rounded-full font-bold hover:bg-gray-100 transition"
          >
            Submit
          </button>
        </div>
      )}

      {/* Emergency Banner */}
      {isBrownout && pendingEnergy > 0 && (
        <div className="bg-red-500 text-white text-xs py-2 px-4 flex justify-between items-center z-10 animate-pulse">
          <span className="font-bold flex items-center gap-1"><RadioTower size={14} /> EMERGENCY FLUSH REQUIRED</span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-3 py-1 rounded-full font-bold border border-red-400"
          >
            Sign TX
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {activeTab === 'assets' && <AssetView />}
        {activeTab === 'activity' && <ActivityView />}
        {activeTab === 'devices' && <DeviceView />}
        {activeTab === 'grid' && <GridStatusView />}
      </div>

      {/* Tab Navigation */}
      <div className="bg-joulet-darker border-t border-gray-800 flex justify-around items-center p-3 z-10">
        <TabButton
          active={activeTab === 'assets'}
          onClick={() => setActiveTab('assets')}
          icon={<Zap size={20} />}
          label="Assets"
        />
        <TabButton
          active={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
          icon={<LayoutList size={20} />}
          label="Activity"
        />
        <TabButton
          active={activeTab === 'devices'}
          onClick={() => setActiveTab('devices')}
          icon={<Cpu size={20} />}
          label="Devices"
        />
        <TabButton
          active={activeTab === 'grid'}
          onClick={() => setActiveTab('grid')}
          icon={<Activity size={20} />}
          label="Grid"
        />
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
function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 cursor-pointer space-y-1 transition-colors ${active ? 'text-joulet-green' : 'text-gray-500 hover:text-gray-300'}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}

export default App;
