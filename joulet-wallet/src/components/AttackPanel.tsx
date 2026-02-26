import { useState, useRef, useEffect } from 'react';
import { Skull, AlertOctagon, ZapOff, CloudLightning, Terminal as TerminalIcon } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';

interface LogEntry {
    type: 'info' | 'warn' | 'error' | 'success' | 'raw';
    text: string;
    timestamp: string;
}

export default function AttackPanel() {
    const [statusText, setStatusText] = useState("System Normal");
    const [isAttacking, setIsAttacking] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([
        { type: 'info', text: 'Initializing Adversary Toolkit v2.1.4...', timestamp: new Date().toLocaleTimeString() },
        { type: 'info', text: 'Connected to Oracle Network Node [127.0.0.1:5010]', timestamp: new Date().toLocaleTimeString() },
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

    const triggerAttack = async (type: string, description: string) => {
        setIsAttacking(true);
        setStatusText(`Injecting ${type}...`);

        addLog('warn', `>>> INITIATING ATTACK VECTOR: [${type}]`);
        addLog('info', `Deploying payload: ${description}`);

        try {
            // Simulated fake payload to send to Oracle 1
            const payload = {
                "Device_ID": "solar_node_gamma",
                "Voltage": 230.1,
                "Current": type === 'SPIKE' ? 45.0 : 15.0, // Induce a spike if requested
                "Power_kW": type === 'SPIKE' ? 10.35 : (type === 'PHYSICS' ? 24.5 : 3.45),
                "Timestamp": type === 'NIGHT' ? new Date(new Date().setHours(2)).toISOString() : new Date().toISOString()
            };

            // In a real attack, the signature might be forged or stolen. 
            // We use a dummy invalid signature for the "FORGERY" attack.
            let signature = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"; // valid-ish sig format
            if (type === 'FORGERY') {
                signature = "0x" + "0".repeat(128);
            }

            // Simulate typing the raw payload into the terminal
            setTimeout(() => addLog('info', `Crafting malicious JSON payload...`), 400);
            setTimeout(() => addLog('raw', JSON.stringify({ payload, signature: signature.substring(0, 15) + '...' }, null, 2)), 800);
            setTimeout(() => addLog('warn', `Transmitting payload directly to 127.0.0.1:5010/api/oracle/submit...`), 1200);

            // Execute actual request after visual delay
            setTimeout(async () => {
                try {
                    const response = await fetch("http://127.0.0.1:5010/api/oracle/submit", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ payload, signature })
                    });

                    const data = await response.json();

                    if (response.status === 406 || response.status === 400 || response.status === 500) {
                        setStatusText(`Blocked By Oracle`);
                        addLog('error', `[ORACLE NODE RESPONSE] 406 Not Acceptable`);
                        addLog('error', `✖ BLOCKED: ${data.reason || data.error || 'Request Rejected'}`);
                        addLog('info', `Attack successfully mitigated by Oracle Defense Network.`);
                        addIncident(`ATTACK BLOCKED: ${description}`);
                    } else {
                        setStatusText("Attack Successful (Warning!)");
                        addLog('success', `[ORACLE NODE RESPONSE] 200 OK`);
                        addLog('success', `✔ CRITICAL: Payload accepted! Attack bypassed filters!`);
                        addIncident(`CRITICAL: Attack bypassed filters!`);
                    }
                } catch (e) {
                    setStatusText("Attack Failed: Target Offline");
                    addLog('error', `✖ CONNECTION REFUSED: Oracle Node offline or unreachable.`);
                }
            }, 1800);

        } catch (e) {
            setStatusText("Attack Failed: Target Offline");
            addLog('error', `✖ CONNECTION REFUSED: Target Offline`);
        }

        setTimeout(() => {
            setIsAttacking(false);
            setStatusText(prev => prev.includes("Injecting") ? "System Normal" : prev);
        }, 4000);
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

                <p className="text-xs text-white/60 mb-6">
                    Inject fraudulent structural data payloads directly into the Joulet Oracle Network. Prove the resilience of decentralized physics validation by launching real cyber-attacks against your local API bridge.
                </p>

                <div className="grid grid-cols-1 gap-3 flex-1 content-start">
                    <AttackButton
                        icon={<AlertOctagon size={16} />}
                        label="Spoof ECDSA Signature"
                        onClick={() => triggerAttack('FORGERY', 'Invalid ECDSA Cryptography')}
                        disabled={isAttacking}
                    />
                    <AttackButton
                        icon={<CloudLightning size={16} />}
                        label="Replay Night Generation"
                        onClick={() => triggerAttack('NIGHT', 'Solar production outside daylight hours')}
                        disabled={isAttacking}
                    />
                    <AttackButton
                        icon={<ZapOff size={16} />}
                        label="Induce Capacity Spike"
                        onClick={() => triggerAttack('SPIKE', 'Sudden +3kW anomaly / Over-capacity')}
                        disabled={isAttacking}
                    />
                    <AttackButton
                        icon={<Skull size={16} />}
                        label="Inject Physics Forgery"
                        onClick={() => triggerAttack('PHYSICS', 'V * I != Power Math violation')}
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
                            <span className="text-slate-500 mr-3">[{log.timestamp}]</span>
                            {log.type === 'info' && <span className="text-blue-400">{log.text}</span>}
                            {log.type === 'warn' && <span className="text-yellow-400">{log.text}</span>}
                            {log.type === 'error' && <span className="text-red-500 font-semibold">{log.text}</span>}
                            {log.type === 'success' && <span className="text-green-500">{log.text}</span>}
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
        </div>
    );
}

function AttackButton({ icon, label, onClick, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-3 bg-[#0a0f1e] hover:bg-joulet-red/20 border border-joulet-red/20 hover:border-joulet-red/50 text-white/80 hover:text-white p-4 rounded-xl transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed group text-left"
        >
            <div className="w-10 h-10 rounded-lg bg-joulet-red/10 flex items-center justify-center text-joulet-red group-hover:bg-joulet-red group-hover:text-[#0a0f1e] transition-colors shrink-0">
                {icon}
            </div>
            {label}
        </button>
    );
}
