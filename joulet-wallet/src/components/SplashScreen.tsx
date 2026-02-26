import React, { useEffect, useState, useRef } from 'react';

interface SplashScreenProps {
    onComplete: () => void;
    minimumDuration?: number; // ms
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, minimumDuration = 4500 }) => {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'loading' | 'complete' | 'fadeout'>('loading');
    const [statusText, setStatusText] = useState('Initializing Protocol...');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);

    // Particle system on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Particle class
        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            alpha: number;
            color: string;
            life: number;
            maxLife: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
                this.size = Math.random() * 2.5 + 0.5;
                this.alpha = Math.random() * 0.6 + 0.1;
                const colors = ['#34d399', '#38bdf8', '#2dd4bf', '#818cf8', '#a78bfa'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.life = 0;
                this.maxLife = Math.random() * 300 + 200;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life++;

                // Drift towards center gently
                const cx = canvas!.width / 2;
                const cy = canvas!.height / 2;
                const dx = cx - this.x;
                const dy = cy - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 200) {
                    this.vx += dx * 0.00003;
                    this.vy += dy * 0.00003;
                }

                if (this.life > this.maxLife || this.x < -10 || this.x > canvas!.width + 10 || this.y < -10 || this.y > canvas!.height + 10) {
                    this.x = Math.random() * canvas!.width;
                    this.y = Math.random() * canvas!.height;
                    this.life = 0;
                    this.vx = (Math.random() - 0.5) * 0.8;
                    this.vy = (Math.random() - 0.5) * 0.8;
                }
            }

            draw(ctx: CanvasRenderingContext2D) {
                const fadeIn = Math.min(this.life / 30, 1);
                const fadeOut = Math.max(0, 1 - (this.life - this.maxLife + 30) / 30);
                const a = this.alpha * fadeIn * (this.life > this.maxLife - 30 ? fadeOut : 1);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = a;
                ctx.fill();

                // Glow
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
                grad.addColorStop(0, this.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.globalAlpha = a * 0.3;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // Connection lines
        const particles: Particle[] = [];
        for (let i = 0; i < 80; i++) {
            particles.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connection lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = '#34d399';
                        ctx.globalAlpha = (1 - dist / 120) * 0.08;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            }

            particles.forEach(p => {
                p.update();
                p.draw(ctx);
            });

            animFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    // Progress and status text simulation
    useEffect(() => {
        const statusMessages = [
            { at: 0, text: 'Initializing Protocol...' },
            { at: 15, text: 'Connecting to Blockchain...' },
            { at: 30, text: 'Syncing Smart Contracts...' },
            { at: 50, text: 'Loading DEX Engine...' },
            { at: 65, text: 'Verifying Node Identity...' },
            { at: 80, text: 'Establishing P2P Channels...' },
            { at: 92, text: 'Finalizing Genesis Block...' },
            { at: 100, text: 'Network Ready ✓' },
        ];

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(100, (elapsed / minimumDuration) * 100);
            setProgress(newProgress);

            // Update status text based on progress
            const currentStatus = [...statusMessages].reverse().find(s => newProgress >= s.at);
            if (currentStatus) {
                setStatusText(currentStatus.text);
            }

            if (newProgress >= 100) {
                clearInterval(interval);
                setPhase('complete');
                setTimeout(() => {
                    setPhase('fadeout');
                    setTimeout(() => {
                        onComplete();
                    }, 800);
                }, 600);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [minimumDuration, onComplete]);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-800 ${phase === 'fadeout' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                }`}
            style={{ background: 'radial-gradient(ellipse at center, #0f172a 0%, #070b14 50%, #030508 100%)' }}
        >
            {/* Particle Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0" />

            {/* Animated Orbital Rings */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                {/* Ring 1 */}
                <div className="splash-ring splash-ring-1" />
                {/* Ring 2 */}
                <div className="splash-ring splash-ring-2" />
                {/* Ring 3 */}
                <div className="splash-ring splash-ring-3" />
            </div>

            {/* Central Content */}
            <div className="relative z-20 flex flex-col items-center">
                {/* Glowing Logo Container */}
                <div className="relative mb-10">
                    {/* Outer glow pulse */}
                    <div className="absolute inset-0 -m-8 rounded-full bg-joulet-green/10 blur-3xl animate-pulse" />
                    <div className="absolute inset-0 -m-4 rounded-full bg-joulet-green/5 blur-2xl splash-breathe" />

                    {/* Logo */}
                    <div className="relative w-24 h-24 flex items-center justify-center splash-float">
                        {/* Hexagonal frame */}
                        <svg className="absolute w-32 h-32 splash-rotate-slow" viewBox="0 0 100 100">
                            <polygon
                                points="50,2 93,25 93,75 50,98 7,75 7,25"
                                fill="none"
                                stroke="url(#hexGrad)"
                                strokeWidth="0.8"
                                className="splash-hex-dash"
                            />
                            <defs>
                                <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Inner energy bolt */}
                        <svg className="w-14 h-14 splash-energy-pulse" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                                fill="url(#boltGrad)"
                                stroke="#34d399"
                                strokeWidth="0.5"
                                strokeLinejoin="round"
                            />
                            <defs>
                                <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#34d399" />
                                    <stop offset="100%" stopColor="#2dd4bf" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* Brand */}
                <h1
                    className="font-display text-5xl md:text-6xl font-black tracking-wider mb-2 splash-text-reveal"
                    style={{
                        background: 'linear-gradient(135deg, #34d399 0%, #38bdf8 50%, #818cf8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    JOULET
                </h1>

                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400/80 mb-12 splash-fade-in-delay">
                    Decentralized Energy Protocol
                </p>

                {/* Progress Bar */}
                <div className="w-64 md:w-80 mb-6">
                    <div className="h-[3px] bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                            className="h-full rounded-full transition-all duration-100 ease-out relative"
                            style={{
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #34d399, #38bdf8, #818cf8)',
                            }}
                        >
                            {/* Shimmer effect on progress bar */}
                            <div className="absolute inset-0 splash-shimmer" />
                        </div>
                    </div>
                </div>

                {/* Status Text */}
                <div className="flex items-center space-x-2.5">
                    {phase !== 'complete' && (
                        <div className="flex space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-joulet-green splash-dot-1" />
                            <span className="w-1.5 h-1.5 rounded-full bg-joulet-green splash-dot-2" />
                            <span className="w-1.5 h-1.5 rounded-full bg-joulet-green splash-dot-3" />
                        </div>
                    )}
                    <span
                        className={`text-xs font-mono tracking-wider transition-all duration-300 ${phase === 'complete' ? 'text-joulet-green' : 'text-slate-500'
                            }`}
                    >
                        {statusText}
                    </span>
                </div>

                {/* Percentage */}
                <div className="mt-4 text-[10px] font-mono text-white/20 tracking-widest">
                    {Math.floor(progress)}%
                </div>
            </div>

            {/* Corner circuit decorations */}
            <svg className="absolute top-6 left-6 w-20 h-20 text-joulet-green/10 z-10" viewBox="0 0 80 80">
                <path d="M0 40 L20 40 L30 20 L40 20" fill="none" stroke="currentColor" strokeWidth="1" className="splash-circuit" />
                <path d="M40 0 L40 15 L25 30 L25 40" fill="none" stroke="currentColor" strokeWidth="1" className="splash-circuit-delay" />
                <circle cx="20" cy="40" r="2" fill="currentColor" className="splash-node-blink" />
                <circle cx="40" cy="20" r="2" fill="currentColor" className="splash-node-blink-delay" />
            </svg>
            <svg className="absolute bottom-6 right-6 w-20 h-20 text-joulet-green/10 z-10 rotate-180" viewBox="0 0 80 80">
                <path d="M0 40 L20 40 L30 20 L40 20" fill="none" stroke="currentColor" strokeWidth="1" className="splash-circuit" />
                <path d="M40 0 L40 15 L25 30 L25 40" fill="none" stroke="currentColor" strokeWidth="1" className="splash-circuit-delay" />
                <circle cx="20" cy="40" r="2" fill="currentColor" className="splash-node-blink" />
                <circle cx="40" cy="20" r="2" fill="currentColor" className="splash-node-blink-delay" />
            </svg>
            <svg className="absolute top-6 right-6 w-16 h-16 text-joulet-blue/8 z-10" viewBox="0 0 60 60">
                <path d="M60 30 L40 30 L30 10" fill="none" stroke="currentColor" strokeWidth="1" className="splash-circuit" />
                <circle cx="40" cy="30" r="1.5" fill="currentColor" className="splash-node-blink" />
            </svg>
            <svg className="absolute bottom-6 left-6 w-16 h-16 text-joulet-blue/8 z-10" viewBox="0 0 60 60">
                <path d="M60 30 L40 30 L30 10" fill="none" stroke="currentColor" strokeWidth="1" className="splash-circuit" />
                <circle cx="40" cy="30" r="1.5" fill="currentColor" className="splash-node-blink" />
            </svg>
        </div>
    );
};

export default SplashScreen;
