import React from 'react';
import { ShieldAlert } from 'lucide-react';
import AttackPanel from './AttackPanel';

const AttackView: React.FC = () => {
    return (
        <div className="p-6 md:p-8 space-y-5 h-full relative z-10 flex flex-col">
            <div className="pb-3 border-b border-white/5">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={14} className="text-joulet-red" />
                    Cybersecurity Operations Center (CSOC)
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-4 content-start">
                <AttackPanel />
            </div>
        </div>
    );
};

export default AttackView;
