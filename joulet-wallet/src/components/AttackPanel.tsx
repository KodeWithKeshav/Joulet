import React, { useState } from 'react';
import { Skull, AlertOctagon, ZapOff, CloudLightning } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';

export default function AttackPanel() {
    const [statusText, setStatusText] = useState("System Normal");
    const [isAttacking, setIsAttacking] = useState(false);
    const { addIncident } = useWalletStore();

    const triggerAttack = async (type: string, description: string) => {
        setIsAttacking(true);
        setStatusText(`Injecting ${type}...`);

        try {
            // Simulated fake payload to send to Oracle 1
            const payload = {
                "Device_ID": "solar_node_gamma",
                "Voltage": 230.1,
                "Current": type === 'SPIKE' ? 45.0 : 15.0, // Induce a spike if requested
                "Power_kW": type === 'SPIKE' ? 10.35 : 3.45,
                "Timestamp": type === 'NIGHT' ? new Date(new Date().setHours(2)).toISOString() : new Date().toISOString()
            };

            // In a real attack, the signature might be forged or stolen. 
            // We use a dummy invalid signature for the "FORGERY" attack.
            let signature = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"; // valid-ish sig format
            if (type === 'FORGERY') {
                signature = "0x" + "0".repeat(128);
            }

            const response = await fetch("http://localhost:5001/api/oracle/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payload, signature })
            });

            const data = await response.json();

            if (response.status === 406 || response.status === 400) {
                setStatusText(`Blocked: ${data.reason}`);
                addIncident(`ATTACK BLOCKED: ${description}`);
            } else {
                setStatusText("Attack Successful (Warning!)");
                addIncident(`CRITICAL: Attack bypassed filters!`);
            }

        } catch (e) {
            setStatusText("Attack Failed: Target Offline");
        }

        setTimeout(() => {
            setIsAttacking(false);
            if (statusText.includes("Injecting")) setStatusText("System Normal");
        }, 3000);
    };

    return (
        <div className="bg-joulet-red/10 border border-joulet-red/30 rounded-xl p-5 mb-6 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-joulet-red/20">
                <div className="flex items-center gap-2">
                    <Skull className="text-joulet-red animate-pulse" size={18} />
                    <h3 className="font-bold text-joulet-red tracking-wider">ADVERSARY ATTACK PANEL</h3>
                </div>
                <div className="text-[10px] font-mono text-joulet-red/80 px-2 py-1 bg-joulet-red/10 rounded">
                    {statusText}
                </div>
            </div>

            <p className="text-xs text-white/60 mb-4">
                Inject fraudulent data into the Oracle Network to verify distributed consensus rejection capabilities.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <AttackButton
                    icon={<AlertOctagon size={16} />}
                    label="Spoof Signature"
                    onClick={() => triggerAttack('FORGERY', 'Invalid ECDSA Cryptography')}
                    disabled={isAttacking}
                />
                <AttackButton
                    icon={<CloudLightning size={16} />}
                    label="Night Generation"
                    onClick={() => triggerAttack('NIGHT', 'Solar production outside daylight hours')}
                    disabled={isAttacking}
                />
                <AttackButton
                    icon={<ZapOff size={16} />}
                    label="Capacity Spike"
                    onClick={() => triggerAttack('SPIKE', 'Sudden +3kW anomaly')}
                    disabled={isAttacking}
                />
                <AttackButton
                    icon={<Skull size={16} />}
                    label="Physics Forgery"
                    onClick={() => triggerAttack('PHYSICS', 'V * I != Power Math violation')}
                    disabled={isAttacking}
                />
            </div>
        </div>
    );
}

function AttackButton({ icon, label, onClick, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-2 bg-black/40 hover:bg-joulet-red/20 border border-joulet-red/20 hover:border-joulet-red/50 text-white/80 hover:text-white px-3 py-2.5 rounded-lg transition-all text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <span className="text-joulet-red">{icon}</span>
            {label}
        </button>
    );
}
