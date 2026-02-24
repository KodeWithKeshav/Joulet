import React, { useState, useEffect, useRef } from 'react';
import { Zap, Sun, DollarSign, Activity, Database, ArrowRight, User, Home, Lock, RefreshCw, AlertCircle, X, Maximize2, BarChart2 } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

// Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004';
const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';

// --- API Functions ---
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

// --- Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, disabled, children, variant = 'primary', className = "" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-400 text-slate-900",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100",
    outline: "border border-slate-600 hover:border-emerald-500 text-slate-300",
    danger: "bg-rose-500 hover:bg-rose-400 text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, color = "emerald" }) => (
  <span className={`px-2 py-1 rounded text-xs font-bold bg-${color}-500/20 text-${color}-400 border border-${color}-500/30 whitespace-nowrap`}>
    {children}
  </span>
);

// --- Chart Components ---

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-xl text-xs">
        <p className="text-slate-400">Step {label}</p>
        <p className="font-mono font-bold text-white">
          {Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const MetricAreaChart = ({ data, color = "sky", height = 40 }) => {
  if (!data || data.length < 2) return null;
  const chartData = data.map((val, i) => ({ index: i, value: val }));

  // Map color names to hex for Recharts (simplified map)
  const colors = { sky: "#38bdf8", emerald: "#34d399", rose: "#fb7185" };
  const strokeColor = colors[color] || colors.sky;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1 }} isAnimationActive={false} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          fillOpacity={1}
          fill={`url(#grad-${color})`}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const MetricBarChart = ({ data, color = "emerald", height = 40 }) => {
  if (!data || data.length === 0) return null;
  const chartData = data.map((val, i) => ({ index: i, value: val }));

  const colors = { emerald: "#34d399" };
  const fillColor = colors[color] || colors.emerald;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.2 }} isAnimationActive={false} />
        <Bar dataKey="value" fill={fillColor} radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default function JouletApp() {
  // --- State ---
  const [role, setRole] = useState('producer'); // 'producer' | 'consumer'
  const [showIntro, setShowIntro] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [blockchainConnected, setBlockchainConnected] = useState(false);


  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsType, setAnalyticsType] = useState('voltage'); // 'voltage' | 'mining'

  // Blockchain State
  const [blocks, setBlocks] = useState([
    { hash: "0x9a7...1f", prevHash: "0x000...00", type: "GENESIS", details: "Protocol Initiated", timestamp: new Date().toLocaleTimeString() }
  ]);
  const [apiReportsCount, setApiReportsCount] = useState(0);
  const apiReportsRef = useRef(0);

  // Producer State (Solar Farm)
  const [energyGenerated, setEnergyGenerated] = useState(0);
  const [pendingEnergy, setPendingEnergy] = useState(0);
  const [producerWallet, setProducerWallet] = useState({ jlt: 0, usd: 500 });
  // Mining difficulty (kWh required to mint 1 JLT) - synced from server
  // Default mining difficulty (will be synced from API on connect)
  const DEFAULT_MINING_DIFFICULTY = 10; // 10 kWh = 1 JLT
  const [miningDifficulty, setMiningDifficulty] = useState(DEFAULT_MINING_DIFFICULTY);

  // Consumer State (Household)
  const [consumerWallet, setConsumerWallet] = useState({ jlt: 0, usd: 2000, energyCredits: 0 });

  // Market State
  const JLT_RATE = Math.max(0.10, (miningDifficulty / 10) * 0.50); // Dynamic pricing based on network difficulty

  // --- Check API & Blockchain Connection ---
  useEffect(() => {
    const checkConnections = async () => {
      // Check API
      const apiStatus = await apiCall('/api/status');
      if (apiStatus) {
        setApiConnected(true);
        setBlockchainConnected(apiStatus.oracle?.connected || false);
        // Sync frontend state with API metrics from server-side simulator
        try {
          const m = apiStatus.metrics || {};
          // accumulated_energy -> pending buffer
          if (typeof m.accumulated_energy === 'number') {
            setPendingEnergy(m.accumulated_energy);
          }

          // Prefer server reporting_threshold when available for calculations
          const liveDifficulty = (typeof m.reporting_threshold === 'number') ? m.reporting_threshold : miningDifficulty;
          if (typeof m.reporting_threshold === 'number') setMiningDifficulty(m.reporting_threshold);

          // total_reported -> lifetime energy generated (approx)
          if (typeof m.total_reported === 'number') {
            setEnergyGenerated(m.total_reported);
            // derive JLT balance approximation from reported energy
            const jltMinted = Math.floor(m.total_reported / liveDifficulty);
            setProducerWallet(prev => ({ ...prev, jlt: jltMinted }));
          }

          // Detect new on-chain reports and create ledger blocks
          const reportsCount = m.reports_count || 0;
          if (reportsCount > apiReportsRef.current) {
            // fetch latest report details
            const history = await apiCall(`/api/energy/history?limit=1`);
            const latest = history?.reports?.[0];
            if (latest) {
              const amount = latest.amount || 0;
              const tokens = Math.floor(amount / liveDifficulty);
              addBlock('MINT', `Proof of Generation: ${amount} kWh -> ${tokens} JLT (on-chain)`);
            } else {
              addBlock('MINT', `Proof of Generation: new on-chain report`);
            }
            setApiReportsCount(reportsCount);
            apiReportsRef.current = reportsCount;
          }
        } catch (e) {
          console.warn('Failed to sync metrics from API', e);
        }
      }
    };

    checkConnections();
    const interval = setInterval(checkConnections, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const apiTradesRef = useRef(0);
  useEffect(() => {
    const fetchTrades = async () => {
      const h = await apiCall('/api/ledger/trades');
      if (h && h.trades) {
        if (h.trades.length > apiTradesRef.current) {
          const newTrades = h.trades.slice(apiTradesRef.current);
          newTrades.forEach(t => addBlock(t.type || 'TRADE', t.details));
          apiTradesRef.current = h.trades.length;
        }
      }
    };
    const interval = setInterval(fetchTrades, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- Actions ---

  const addBlock = (type, details) => {
    const prevBlock = blocks[0];
    const newBlock = {
      hash: "0x" + Math.random().toString(16).substr(2, 8),
      prevHash: prevBlock.hash.substr(0, 8) + "...",
      type,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    // Use functional update to avoid stale closure resetting previous blocks
    setBlocks(prev => [newBlock, ...prev]);
  };

  const simulateProduction = async () => {
    // Simulates a smart meter reading real energy
    const production = Math.floor(Math.random() * 5) + 2;

    // Send to API bridge
    if (apiConnected) {
      const result = await apiCall('/api/test/simulate', 'POST', { kwh: production });
      if (result) {
        setPendingEnergy(result.metrics?.accumulated_energy || 0);

        // If threshold reached, show mining block
        if (result.should_report && result.auto_reported) {
          setEnergyGenerated(prev => prev + production);
          setProducerWallet(prev => ({ ...prev, jlt: prev.jlt + 1 }));
          addBlock("MINT", `Proof of Generation: ${production} kWh -> 1 JLT (via API)`);
        } else {
          const newPending = pendingEnergy + production;
          setPendingEnergy(newPending);

          // Also do local simulation for immediate feedback using live difficulty
          if (newPending >= miningDifficulty) {
            const tokensToMint = Math.floor(newPending / miningDifficulty);
            setPendingEnergy(newPending % miningDifficulty);
            setEnergyGenerated(prev => prev + (newPending - (newPending % miningDifficulty)));
            setProducerWallet(prev => ({ ...prev, jlt: prev.jlt + tokensToMint }));
            addBlock("MINT", `Proof of Generation: ${tokensToMint * miningDifficulty} kWh -> ${tokensToMint} JLT`);
          }
        }
      }
    } else {
      // Fallback to local simulation
      const newPending = pendingEnergy + production;
      setPendingEnergy(newPending);

      if (newPending >= miningDifficulty) {
        const tokensToMint = Math.floor(newPending / miningDifficulty);
        const remainder = newPending % miningDifficulty;

        setPendingEnergy(remainder);
        setEnergyGenerated(prev => prev + (newPending - remainder));
        setProducerWallet(prev => ({ ...prev, jlt: prev.jlt + tokensToMint }));

        addBlock("MINT", `Proof of Generation: ${tokensToMint * miningDifficulty} kWh -> ${tokensToMint} JLT`);
      }
    }
  };

  const buyJoulet = (amountJlt) => {
    const cost = amountJlt * JLT_RATE;
    if (consumerWallet.usd >= cost && producerWallet.jlt >= amountJlt) {
      setConsumerWallet(prev => ({ ...prev, usd: prev.usd - cost, jlt: prev.jlt + amountJlt }));
      setProducerWallet(prev => ({ ...prev, usd: prev.usd + cost, jlt: prev.jlt - amountJlt }));
      addBlock("TRADE", `Wallet A bought ${amountJlt} JLT for $${cost}`);
    } else {
      alert("Transaction Failed: Insufficient funds or market liquidity.");
    }
  };

  const consumeEnergy = () => {
    // Burn JLT to get Energy Credits (Physical delivery)
    if (consumerWallet.jlt >= 1) {
      setConsumerWallet(prev => ({ ...prev, jlt: prev.jlt - 1, energyCredits: prev.energyCredits + miningDifficulty }));
      addBlock("BURN", `Redeemed 1 JLT for ${miningDifficulty} kWh Physical Delivery`);
    }
  };

  // --- Views ---

  const Sidebar = () => (
    <div className="w-full md:w-64 bg-slate-900 p-6 flex flex-col gap-6 border-r border-slate-800">
      <div className="flex items-center gap-3 text-emerald-400 mb-6">
        <Zap className="w-8 h-8 fill-emerald-400" />
        <h1 className="text-2xl font-bold tracking-tighter">JOULET</h1>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Persona</p>
        <button
          onClick={() => setRole('producer')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${role === 'producer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          <Sun className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold">Producer</div>
            <div className="text-xs opacity-70">Solar Farm Node</div>
          </div>
        </button>

        <button
          onClick={() => setRole('consumer')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${role === 'consumer' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/50' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          <Home className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold">Consumer</div>
            <div className="text-xs opacity-70">Residential Node</div>
          </div>
        </button>


        <button
          onClick={() => setRole('grid')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${role === 'grid' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/50' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          <Activity className="w-5 h-5" />
          <div className="text-left">
            <div className="font-semibold">Grid Monitor</div>
            <div className="text-xs opacity-70">Infrastructure</div>
          </div>
        </button>
      </div>

      <div className="mt-auto">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
            <Activity className="w-4 h-4" /> Market Status
          </div>
          <div className="flex justify-between items-end gap-2">
            <div>
              <div className="text-xs text-slate-500">JLT Price</div>
              <div className="text-lg font-mono text-emerald-400 whitespace-nowrap">${JLT_RATE.toFixed(2)}</div>
            </div>
            <div className="text-right overflow-hidden">
              <div className="text-xs text-slate-500">Difficulty</div>
              <div className="text-sm font-mono text-white truncate" title={`${miningDifficulty} kWh`}>
                {typeof miningDifficulty === 'number' ? miningDifficulty.toFixed(2) : miningDifficulty} kWh
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );

  const BlockchainFeed = () => (
    <Card className="h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" /> Live Ledger
        </h3>
        <Badge color="indigo">Net: Main</Badge>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {blocks.map((block, i) => (
          <div key={i} className="bg-slate-900/50 p-3 rounded border border-slate-700/50 text-sm relative group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l"></div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{block.timestamp}</span>
              <span className="font-mono">{block.hash}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] 
                ${block.type === 'MINT' ? 'bg-emerald-500/20 text-emerald-400' :
                  block.type === 'TRADE' ? 'bg-blue-500/20 text-blue-400' :
                    block.type === 'BURN' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                {block.type}
              </span>
              <span className="text-slate-300">{block.details}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  // Poll Mining History for Graph
  const [miningHistory, setMiningHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const h = await apiCall('/api/energy/history?limit=20');
      if (h && h.reports) {
        setMiningHistory(h.reports);
      }
    };
    const interval = setInterval(fetchHistory, 2000);
    return () => clearInterval(interval);
  }, []);



  const ProducerView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-800/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h2 className="text-lg font-semibold text-slate-300 mb-1">Smart Meter (IoT Oracle)</h2>
              <div className="text-4xl font-bold text-white mb-2">{energyGenerated.toFixed(1)} <span className="text-lg text-slate-500 font-normal">kWh Lifetime</span></div>
            </div>
            <Button variant="outline" className="p-2 h-auto" onClick={() => { setAnalyticsType('mining_combined'); setShowAnalytics(true); }}>
              <Maximize2 className="w-4 h-4 text-emerald-400" />
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, (pendingEnergy / miningDifficulty) * 100)}%` }}
              ></div>
            </div>
            <span className="text-xs font-mono text-emerald-400 w-16 text-right">{pendingEnergy.toFixed(1)}/{miningDifficulty.toFixed(1)} kWh</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Buffer filling. Mining triggers automatically at threshold.</p>

          <div className="mt-6 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                <span>Difficulty Trend</span>
                <button onClick={() => { setAnalyticsType('mining_difficulty'); setShowAnalytics(true); }} className="hover:text-emerald-400">
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
              <div className="h-16">
                <MetricAreaChart data={miningHistory.map(d => d.difficulty || 10)} color="sky" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                <span>Production History</span>
                <button onClick={() => { setAnalyticsType('mining_production'); setShowAnalytics(true); }} className="hover:text-emerald-400">
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
              <div className="h-16">
                <MetricBarChart data={miningHistory.map(d => d.amount || 0)} color="emerald" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Producer Wallet</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">JLT Balance</div>
              <div className="text-2xl font-mono text-emerald-400">{producerWallet.jlt} JLT</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Fiat Holdings</div>
              <div className="text-2xl font-mono text-white">${producerWallet.usd.toFixed(2)}</div>
            </div>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded text-sm text-indigo-300">
            <span className="font-bold">Protocol Rule:</span> Tokens are only minted when confirmed by the Smart Meter Oracle.
          </div>
        </Card>
      </div>
    </div>
  );

  const ConsumerView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Energy Marketplace</h2>
          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-700 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Solar Farm #102</div>
                <div className="text-xs text-emerald-400">Selling 50 JLT @ $0.50</div>
              </div>
            </div>
            <Button variant="outline" onClick={() => buyJoulet(10)}>
              Buy 10 JLT ($5.00)
            </Button>
          </div>

          <div className="flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-700 opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-400">Wind Turbine #44</div>
                <div className="text-xs text-slate-500">Out of Stock</div>
              </div>
            </div>
            <Button variant="secondary" disabled>Buy JLT</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">My Dashboard</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400 text-sm">Wallet USD</span>
              <span className="font-mono text-white">${consumerWallet.usd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400 text-sm">Joulet (JLT)</span>
              <span className="font-mono text-emerald-400">{consumerWallet.jlt}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-400 text-sm">Energy Credits</span>
              <span className="font-mono text-amber-400">{consumerWallet.energyCredits} kWh</span>
            </div>

            <div className="pt-4">
              <Button variant="primary" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900" onClick={consumeEnergy} disabled={consumerWallet.jlt < 1}>
                <Zap className="w-4 h-4" /> Redeem Energy
              </Button>
              <p className="text-xs text-center text-slate-500 mt-2">1 JLT = {miningDifficulty} kWh delivery</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );


  const [gridStatus, setGridStatus] = useState({ voltage: 230.0, events: [], status: 'STABLE' });
  const [voltageHistory, setVoltageHistory] = useState(Array(50).fill(230));

  // Poll Grid Status
  useEffect(() => {
    const fetchGrid = async () => {
      const data = await apiCall('/api/grid/status');
      if (data) {
        // Determine status based on local threshold logic mimicking API
        const status = data.voltage < 210 ? 'BROWNOUT' : 'STABLE';

        // Sync events if provided, else we might maintain local log (API provides raw list in some impls, 
        // strictly the python code returned `events` list in the GET response? 
        // Let's check api_bridge.py: 'GET' returns `grid_status` dict which has `events`.

        setGridStatus(prev => ({
          voltage: data.voltage,
          events: data.events || [],
          status
        }));
        setVoltageHistory(prev => [...prev.slice(1), data.voltage]);
      }
    };
    const interval = setInterval(fetchGrid, 1000);
    return () => clearInterval(interval);
  }, []);

  const GridMonitor = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Main Voltage Gauge */}
        <Card className="relative overflow-hidden flex flex-col items-center justify-center p-10 min-h-[300px]">
          <div className={`absolute inset-0 opacity-10 ${gridStatus.status === 'BROWNOUT' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>

          <div className="absolute top-4 right-4 z-20">
            <Button variant="secondary" className="p-2 h-auto bg-slate-900/80 border border-slate-700 backdrop-blur-sm" onClick={() => { setAnalyticsType('voltage'); setShowAnalytics(true); }}>
              <BarChart2 className="w-4 h-4 text-slate-300" />
            </Button>
          </div>

          <h2 className="text-slate-400 font-semibold mb-4 uppercase tracking-widest">Live Grid Voltage</h2>

          <div className="relative z-10">
            <div className={`text-6xl font-black font-mono tracking-tighter ${gridStatus.status === 'BROWNOUT' ? 'text-red-500' : 'text-emerald-400'}`}>
              {gridStatus.voltage.toFixed(1)}<span className="text-2xl text-slate-500 ml-2">V</span>
            </div>
          </div>

          <div className={`mt-4 px-4 py-1 rounded-full text-xs font-bold border ${gridStatus.status === 'BROWNOUT'
            ? 'bg-red-500/20 text-red-400 border-red-500/50'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'}`}>
            {gridStatus.status === 'BROWNOUT' ? '⚠️ UNSTABLE - BROWNOUT' : '✓ GRID STABLE'}
          </div>

          {/* Real-time Voltage Chart */}
          <div className="absolute bottom-0 left-0 right-0 h-24 px-4 pb-2 opacity-50">
            <MetricAreaChart data={voltageHistory} color={gridStatus.status === 'BROWNOUT' ? 'rose' : 'emerald'} height={60} />
          </div>
        </Card>

        {/* Event Log */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-300">Incident Log</h2>
            <Badge color={gridStatus.events.length > 0 ? 'amber' : 'slate'}>{gridStatus.events.length} Events</Badge>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {gridStatus.events.length === 0 ? (
              <div className="text-center text-slate-600 py-10">
                No grid anomalies detected.
              </div>
            ) : (
              gridStatus.events.map((e, i) => (
                <div key={i} className="bg-slate-900/80 p-3 rounded border-l-2 border-red-500 flex justify-between items-start">
                  <div>
                    <div className="text-red-400 font-bold text-sm">Brownout Detected</div>
                    <div className="text-slate-500 text-xs">Voltage dipped to {e.voltage.toFixed(1)}V</div>
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded text-xs text-red-300/70">
            <span className="font-bold">Automated Response:</span> High-priority transactions are dispatched to the blockchain to secure accumulating energy credits during instability.
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-950">
          <div className="flex items-center gap-4 text-sm">
            {apiConnected ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>API Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>API Disconnected</span>
              </div>
            )}

            {blockchainConnected ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>Blockchain Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="w-4 h-4" />
                <span>Blockchain Disconnected</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500">Current Block Height</div>
              <div className="text-sm font-mono text-emerald-400">#{blocks.length + 1024}</div>
            </div>
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-emerald-500 to-blue-500"></div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col md:flex-row gap-6">
          <div className="flex-1 overflow-y-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">
                {role === 'producer' ? 'Producer Console' : 'Consumer Dashboard'}
              </h1>
              <p className="text-slate-400">
                {role === 'producer' ? 'Manage generation assets and mint tokens.' : 'Purchase tokens and manage energy consumption.'}
              </p>
            </div>
            {role === 'producer' ? <ProducerView /> : role === 'consumer' ? <ConsumerView /> : <GridMonitor />}
          </div>

          <div className="w-full md:w-80 h-1/3 md:h-auto">
            <BlockchainFeed />
          </div>
        </div>
      </main>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full h-full max-w-7xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                  {analyticsType === 'voltage' ? <Activity className="w-6 h-6 text-sky-400" /> : <Sun className="w-6 h-6 text-emerald-400" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {analyticsType === 'voltage' ? 'Grid Stability Analysis' :
                      analyticsType === 'mining_difficulty' ? 'Mining Difficulty Trend' :
                        analyticsType === 'mining_production' ? 'Energy Production History' :
                          'Generation Efficiency Metrics'}
                  </h2>
                  <p className="text-sm text-slate-400 font-mono uppercase tracking-wider">
                    {analyticsType === 'voltage' ? 'Real-time Voltage Telemetry' :
                      analyticsType === 'mining_difficulty' ? 'Target adjustment over time (kWh/Block)' :
                        analyticsType === 'mining_production' ? 'Energy output per block (kWh)' :
                          'Proof of Generation / Difficulty Ratio'}
                  </p>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setShowAnalytics(false)}>
                <X className="w-5 h-5" /> Close Analysis
              </Button>
            </div>

            <div className="flex-1 p-8 overflow-hidden flex flex-col gap-6">
              {/* Main Chart Area */}
              <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800 p-6 relative">
                <div className="absolute inset-0 p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    {analyticsType === 'voltage' ? (
                      <LineChart data={voltageHistory.map((v, i) => ({ time: i, voltage: v, min: 210, nom: 230 }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="time" stroke="#475569" label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -10 }} />
                        <YAxis domain={[180, 260]} stroke="#475569" label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend />
                        <ReferenceLine y={210} label="Brownout Limit (210V)" stroke="#f43f5e" strokeDasharray="3 3" />
                        <ReferenceLine y={230} label="Nominal (230V)" stroke="#10b981" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="voltage" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3, fill: '#38bdf8' }} activeDot={{ r: 6 }} name="Grid Voltage" animationDuration={300} />
                      </LineChart>
                    ) : (
                      <ComposedChart data={miningHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="timestamp" stroke="#475569" tick={false} label={{ value: 'Recent Blocks', position: 'insideBottom', offset: -5 }} />
                        {/* Y-Axis Logic: Show both if combined, or specific one */}
                        {(analyticsType.includes('combined') || analyticsType.includes('production')) &&
                          <YAxis yAxisId="left" stroke="#10b981" label={{ value: 'Production (kWh)', angle: -90, position: 'insideLeft' }} />}

                        {(analyticsType.includes('combined') || analyticsType.includes('difficulty')) &&
                          <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" label={{ value: 'Difficulty', angle: 90, position: 'insideRight' }} />}

                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}
                        />
                        <Legend />

                        {(analyticsType.includes('combined') || analyticsType.includes('production')) &&
                          <Bar yAxisId="left" dataKey="amount" fill="#34d399" name="Energy Produced" barSize={20} radius={[4, 4, 0, 0]} />}

                        {(analyticsType.includes('combined') || analyticsType.includes('difficulty')) &&
                          <Line yAxisId="right" type="monotone" dataKey="difficulty" stroke="#38bdf8" strokeWidth={3} name="Mining Difficulty" />}
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800 p-4">
                  <div className="text-xs text-slate-500 uppercase">Current Value</div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {analyticsType === 'voltage' ? `${gridStatus.voltage.toFixed(2)} V` : `${miningDifficulty.toFixed(2)} kWh`}
                  </div>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-4">
                  <div className="text-xs text-slate-500 uppercase">Sample Size</div>
                  <div className="text-2xl font-mono font-bold text-slate-300">
                    {analyticsType === 'voltage' ? voltageHistory.length : miningHistory.length}
                  </div>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-4">
                  <div className="text-xs text-slate-500 uppercase">Status</div>
                  <div className={`text-2xl font-mono font-bold ${gridStatus.status === 'BROWNOUT' ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {gridStatus.status}
                  </div>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-4">
                  <div className="text-xs text-slate-500 uppercase">Network</div>
                  <div className="text-2xl font-mono font-bold text-indigo-400">
                    MAINNET
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intro Overlay */}
      {showIntro && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-lg shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Zap className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome to Joulet</h2>
            <p className="text-slate-400 text-center mb-6">
              A decentralized energy trading platform backed by <strong>Proof of Generation</strong>.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <div className="mt-1 bg-slate-800 p-1 rounded"><Sun className="w-3 h-3 text-emerald-400" /></div>
                <p><strong>Entities</strong> generate electricity to mint JLT tokens.</p>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <div className="mt-1 bg-slate-800 p-1 rounded"><RefreshCw className="w-3 h-3 text-blue-400" /></div>
                <p><strong>Users</strong> trade JLT or redeem it for physical power.</p>
              </div>
            </div>
            <Button onClick={() => setShowIntro(false)} className="w-full py-3">
              Launch Demo Prototype
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}