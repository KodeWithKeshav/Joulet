import { useState, useRef, useEffect } from 'react';
import { Skull, AlertOctagon, ZapOff, CloudLightning, Terminal as TerminalIcon, X, Settings } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';

interface LogEntry {
    type: 'info' | 'warn' | 'error' | 'success' | 'raw';
    text: string;
    timestamp: string;
}

interface AttackParams {
    deviceId: string;
    voltage: number;
    current: number;
    powerKw: number;
    timestamp: string;
    useInvalidSignature: boolean;
}

export default function AttackPanel() {
    const [statusText, setStatusText] = useState("System Normal");
    const [isAttacking, setIsAttacking] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [pendingAttackType, setPendingAttackType] = useState<{ type: string, description: string } | null>(null);
    
    // Custom attack parameters
    const [customParams, setCustomParams] = useState<AttackParams>({
        deviceId: 'solar_node_gamma',
        voltage: 230.1,
        current: 15.0,
        powerKw: 3.45,
        timestamp: new Date().toISOString(),
        useInvalidSignature: false
    });
    
    const [logs, setLogs] = useState<LogEntry[]>([
        { type: 'info', text: 'Initializing Adversary Toolkit v2.1.4...', timestamp: new Date().toLocaleTimeString() },
        { type: 'info', text: 'Connected to Oracle Network Node [127.0.0.1:5001]', timestamp: new Date().toLocaleTimeString() },
        { type: 'info', text: 'Waiting for attack vector injection...', timestamp: new Date().toLocaleTimeString() }
    ]);
    const { addIncident } = useWalletStore();
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const addLog = (type: LogEntry['type'], text: string) => {
        setLogs(prev => [...prev, { type, text, timestamp: new Date().toLocaleTimeString() }]);
    };

    const clearTerminal = () => {
        setLogs([
            { type: 'info', text: 'Terminal cleared.', timestamp: new Date().toLocaleTimeString() }
        ]);
    };

    const openCustomModal = (type: string, description: string) => {
        // Set default parameters based on attack type
        const now = new Date();
        
        switch(type) {
            case 'FORGERY':
                setCustomParams({
                    deviceId: 'solar_node_gamma',
                    voltage: 230.1,
                    current: 15.0,
                    powerKw: 3.45,
                    timestamp: now.toISOString(),
                    useInvalidSignature: true
                });
                break;
            case 'NIGHT':
                const nightTime = new Date(now);
                nightTime.setUTCHours(2, 0, 0, 0); // 2am UTC — outside 06-18 window
                setCustomParams({
                    deviceId: 'solar_node_gamma',
                    voltage: 230.1,
                    current: 15.0,
                    powerKw: 3.45,
                    timestamp: nightTime.toISOString(),
                    useInvalidSignature: false
                });
                break;
            case 'SPIKE':
                setCustomParams({
                    deviceId: 'solar_node_gamma',
                    voltage: 230.1,
                    current: 45.0, // High current
                    powerKw: 10.35, // Exceeds 5kW limit
                    timestamp: now.toISOString(),
                    useInvalidSignature: false
                });
                break;
            case 'PHYSICS':
                setCustomParams({
                    deviceId: 'solar_node_gamma',
                    voltage: 230.1,
                    current: 15.0,
                    powerKw: 24.5, // Doesn't match V*I
                    timestamp: now.toISOString(),
                    useInvalidSignature: false
                });
                break;
        }
        
        setPendingAttackType({ type, description });
        setShowCustomModal(true);
    };

    const executeAttack = async () => {
        if (!pendingAttackType) return;

        setShowCustomModal(false);
        setIsAttacking(true);
        setStatusText(`Injecting ${pendingAttackType.type}...`);

        const payload = {
            Device_ID: customParams.deviceId,
            Voltage: customParams.voltage,
            Current: customParams.current,
            Power_kW: customParams.powerKw,
            Timestamp: customParams.timestamp,
        };

        addLog('warn', `>>> INITIATING ATTACK: [${pendingAttackType.type}]`);
        addLog('info', `Payload → ${JSON.stringify(payload)}`);
        addLog('info', `Signature → ${customParams.useInvalidSignature ? '0x' + '0'.repeat(16) + '... (ZEROED)' : 'device key (auto-signed by oracle)'}`);
        addLog('warn', `Transmitting to 127.0.0.1:5001/api/oracle/attack-demo ...`);

        try {
            const res = await fetch('http://127.0.0.1:5001/api/oracle/attack-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attack_type: pendingAttackType.type,
                    params: {
                        device_id: customParams.deviceId,
                        voltage: customParams.voltage,
                        current: customParams.current,
                        power_kw: customParams.powerKw,
                        timestamp: customParams.timestamp,
                        use_invalid_signature: customParams.useInvalidSignature,
                    },
                }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                addLog('error', `Oracle error: ${data.error || res.statusText}`);
                setStatusText('Oracle Unreachable');
                setIsAttacking(false);
                return;
            }

            const trail: any[] = data.audit_trail || [];
            const passed: boolean = data.passed;

            addLog('info', `─────────────────────────────────────────`);
            addLog('info', `ORACLE AUDIT TRAIL — ${trail.length} validation layers`);
            addLog('info', `─────────────────────────────────────────`);

            trail.forEach((layer: any, idx: number) => {
                setTimeout(() => {
                    const icon = layer.status === 'PASS' ? '✅' : layer.status === 'FAIL' ? '❌' : '⬜';
                    const typeKey = layer.status === 'PASS' ? 'layer_pass' : layer.status === 'FAIL' ? 'layer_fail' : 'layer_skip';
                    addLog(typeKey as any, `${icon} Layer ${layer.layer_id}: ${layer.name} → ${layer.status}`);
                    addLog('raw_detail' as any, `   ${layer.detail}`);
                    if (layer.status === 'FAIL') {
                        addLog('info', `   🛡  Defense: ${describeDefense(layer.layer_id)}`);
                    }
                }, idx * 450);
            });

            const totalDelay = trail.length * 450 + 200;
            setTimeout(() => {
                addLog('info', `─────────────────────────────────────────`);
                if (passed) {
                    addLog('success', `⚠  ATTACK PASSED ALL LAYERS — payload accepted`);
                    setStatusText('⚠ Attack Bypassed!');
                    addIncident(`CRITICAL: ${pendingAttackType.type} bypassed oracle filters`);
                } else {
                    addLog('error', `✖  ATTACK BLOCKED — failed at Layer ${data.failed_at}: ${data.reason}`);
                    addLog('success', `✔  Oracle Defense Network: INTEGRITY MAINTAINED`);
                    setStatusText('Attack Blocked ✓');
                    addIncident(`BLOCKED: ${pendingAttackType.type} — ${data.reason}`);
                }
                setIsAttacking(false);
            }, totalDelay);

        } catch (e) {
            addLog('error', `✖ CONNECTION REFUSED — is oracle_node.py running on port 5001?`);
            setStatusText('Oracle Offline');
            setIsAttacking(false);
        }
    };

    const describeDefense = (layerId: number): string => {
        const map: Record<number, string> = {
            0: 'Device Registry — only whitelisted devices accepted',
            1: 'secp256k1 ecrecover — ECDSA cryptographic signature verification',
            2: 'Physics Integrity — V × I / 1000 must equal reported Power_kW (±0.1 kW)',
            3: 'Capacity Limit — max 5 kW per reading enforced',
            4: 'Daylight Window — solar generation only valid 06:00–18:00 UTC',
            5: 'Replay-Attack Freshness — timestamp must be within 300s sliding window',
            6: 'Anomaly / Spike Detection — ramp rate > 3 kW triggers alert',
        };
        return map[layerId] ?? 'Multi-Layer Oracle Defense';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Column: Attack Controls */}
            <div className="bg-joulet-red/10 border border-joulet-red/30 rounded-xl p-5 shadow-[0_0_15px_rgba(239,68,68,0.1)] flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-joulet-red/20">
                    <div className="flex items-center gap-2">
                        <Skull className="text-joulet-red animate-pulse" size={18} />
                        <h3 className="font-bold text-joulet-red tracking-wider">ADVERSARY CONTROLS</h3>
                    </div>
                    <div className="text-[10px] font-mono text-joulet-red/80 px-2 py-1 bg-joulet-red/10 rounded">
                        {statusText}
                    </div>
                </div>

                <p className="text-xs text-white/60 mb-4">
                    Inject fraudulent payloads directly into the Oracle Network. Customize attack parameters to test validation layers.
                </p>
                
                <div className="bg-joulet-indigo/10 border border-joulet-indigo/30 rounded-lg p-3 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings size={14} className="text-joulet-indigo" />
                        <span className="text-xs font-semibold text-joulet-indigo">Interactive Mode</span>
                    </div>
                    <p className="text-[10px] text-white/50">
                        Click any attack to customize Device ID, Voltage, Current, Power, Timestamp, and Signature validity before execution.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 flex-1 content-start">
                    <AttackButton
                        icon={<AlertOctagon size={16} />}
                        label="Spoof ECDSA Signature"
                        sublabel="Fails: Layer 1 — secp256k1 ecrecover"
                        onClick={() => openCustomModal('FORGERY', 'Invalid ECDSA Cryptography')}
                        disabled={isAttacking}
                    />
                    <AttackButton
                        icon={<CloudLightning size={16} />}
                        label="Replay Night Generation"
                        sublabel="Fails: Layer 4 — Daylight Window (UTC 02:00)"
                        onClick={() => openCustomModal('NIGHT', 'Solar production outside daylight hours')}
                        disabled={isAttacking}
                    />
                    <AttackButton
                        icon={<ZapOff size={16} />}
                        label="Induce Capacity Spike"
                        sublabel="Fails: Layer 3 — Capacity Limit > 5 kW"
                        onClick={() => openCustomModal('SPIKE', 'Sudden +3kW anomaly / Over-capacity')}
                        disabled={isAttacking}
                    />
                    <AttackButton
                        icon={<Skull size={16} />}
                        label="Inject Physics Forgery"
                        sublabel="Fails: Layer 2 — V × I ≠ Power_kW"
                        onClick={() => openCustomModal('PHYSICS', 'V * I != Power Math violation')}
                        disabled={isAttacking}
                    />
                </div>
            </div>

            {/* Right Column: Terminal Visualizer */}
            <div className="bg-[#050914] border border-[#1e293b] rounded-xl flex flex-col h-[500px] lg:h-auto overflow-hidden shadow-inner">
                <div className="bg-[#0f172a] border-b border-[#1e293b] px-4 py-2 flex items-center gap-2 shrink-0">
                    <TerminalIcon size={14} className="text-slate-400" />
                    <span className="text-xs font-mono text-slate-400">root@adversary:~//joulet-exploit</span>

                    <div className="ml-auto flex items-center gap-4">
                        <button
                            onClick={clearTerminal}
                            disabled={isAttacking}
                            className="text-[10px] font-mono text-slate-500 hover:text-white transition-colors disabled:opacity-50"
                        >
                            [clear]
                        </button>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
                        </div>
                    </div>
                </div>

                <div
                    ref={terminalRef}
                    className="flex-1 p-4 overflow-y-auto font-mono text-[11px] lg:text-xs leading-relaxed"
                >
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1.5 break-all">
                            {log.type !== 'raw_detail' && (
                                <span className="text-slate-500 mr-3">[{log.timestamp}]</span>
                            )}
                            {log.type === 'info' && <span className="text-blue-400">{log.text}</span>}
                            {log.type === 'warn' && <span className="text-yellow-300 font-semibold">{log.text}</span>}
                            {log.type === 'error' && <span className="text-red-500 font-bold">{log.text}</span>}
                            {log.type === 'success' && <span className="text-emerald-400 font-semibold">{log.text}</span>}
                            {(log.type as string) === 'layer_pass' && <span className="text-emerald-400">{log.text}</span>}
                            {(log.type as string) === 'layer_fail' && <span className="text-red-400 font-bold">{log.text}</span>}
                            {(log.type as string) === 'layer_skip' && <span className="text-slate-500">{log.text}</span>}
                            {(log.type as string) === 'raw_detail' && (
                                <span className="text-slate-400 text-[10px] pl-4 italic">{log.text}</span>
                            )}
                            {log.type === 'raw' && (
                                <pre className="text-purple-400 mt-1 mb-2 bg-[#0a0f1e] p-2 rounded border border-purple-500/20 whitespace-pre-wrap">
                                    {log.text}
                                </pre>
                            )}
                        </div>
                    ))}
                    {isAttacking && (
                        <div className="animate-pulse text-slate-500 mt-2">_</div>
                    )}
                </div>
            </div>

            {/* Custom Parameters Modal */}
            {showCustomModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-[#0a0f1e]/90">
                    <div className="bg-[#0f172a] border border-joulet-red/30 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="border-b border-white/10 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Settings className="text-joulet-red" size={20} />
                                <div>
                                    <h2 className="text-lg font-bold text-white">Customize Attack Parameters</h2>
                                    <p className="text-xs text-white/50 mt-1">{pendingAttackType?.description}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowCustomModal(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Device ID</label>
                                <input type="text" value={customParams.deviceId}
                                    onChange={(e) => setCustomParams({...customParams, deviceId: e.target.value})}
                                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-joulet-indigo"
                                    placeholder="solar_node_gamma" />
                                <p className="text-xs text-white/40 mt-1">Must match a registered device in oracle registry</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Voltage (V)</label>
                                    <input type="number" step="0.1" value={customParams.voltage}
                                        onChange={(e) => setCustomParams({...customParams, voltage: parseFloat(e.target.value)})}
                                        className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-joulet-indigo" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">Current (A)</label>
                                    <input type="number" step="0.1" value={customParams.current}
                                        onChange={(e) => setCustomParams({...customParams, current: parseFloat(e.target.value)})}
                                        className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-joulet-indigo" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Power (kW)</label>
                                <input type="number" step="0.01" value={customParams.powerKw}
                                    onChange={(e) => setCustomParams({...customParams, powerKw: parseFloat(e.target.value)})}
                                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-joulet-indigo" />
                                <p className="text-xs text-white/40 mt-1">
                                    Physics law: (V × A) / 1000 = {((customParams.voltage * customParams.current) / 1000).toFixed(3)} kW — mismatch triggers Layer 2
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Timestamp</label>
                                <input type="datetime-local" value={customParams.timestamp.slice(0, 16)}
                                    onChange={(e) => setCustomParams({...customParams, timestamp: new Date(e.target.value).toISOString()})}
                                    className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-joulet-indigo" />
                                <p className="text-xs text-white/40 mt-1">
                                    UTC hour: {new Date(customParams.timestamp).getUTCHours()}:00 — outside 06:00–18:00 triggers Layer 4
                                </p>
                            </div>

                            <div className="bg-joulet-red/10 border border-joulet-red/30 rounded-lg p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={customParams.useInvalidSignature}
                                        onChange={(e) => setCustomParams({...customParams, useInvalidSignature: e.target.checked})}
                                        className="w-5 h-5 rounded border-2 border-joulet-red/50 bg-[#0a0f1e] checked:bg-joulet-red checked:border-joulet-red focus:outline-none cursor-pointer" />
                                    <div>
                                        <span className="text-sm font-medium text-white">Use Invalid Signature</span>
                                        <p className="text-xs text-white/50 mt-0.5">Forces zeroed ECDSA sig → triggers Layer 1 cryptographic failure</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="border-t border-white/10 p-5 flex gap-3">
                            <button onClick={() => setShowCustomModal(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white py-3 rounded-xl font-semibold transition-colors">
                                Cancel
                            </button>
                            <button onClick={executeAttack} disabled={isAttacking}
                                className="flex-1 bg-joulet-red hover:bg-joulet-red/80 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Execute Attack
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AttackButton({ icon, label, sublabel, onClick, disabled }: any) {
    return (
        <button onClick={onClick} disabled={disabled}
            className="flex items-center gap-3 bg-[#0a0f1e] hover:bg-joulet-red/20 border border-joulet-red/20 hover:border-joulet-red/50 text-white/80 hover:text-white p-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left">
            <div className="w-10 h-10 rounded-lg bg-joulet-red/10 flex items-center justify-center text-joulet-red group-hover:bg-joulet-red group-hover:text-[#0a0f1e] transition-colors shrink-0">
                {icon}
            </div>
            <div>
                <div className="text-sm font-semibold">{label}</div>
                {sublabel && <div className="text-[10px] text-white/40 mt-0.5">{sublabel}</div>}
            </div>
        </button>
    );
}