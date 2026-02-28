import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; label?: string; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    // Inline (non-fullscreen) fallback for sub-component boundaries
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-joulet-red/10 border border-joulet-red/20 flex items-center justify-center">
          <AlertTriangle size={28} className="text-joulet-red" />
        </div>
        <div className="text-center max-w-md">
          <p className="text-white font-bold text-sm mb-1">
            {this.props.label ? `${this.props.label} crashed` : 'Something went wrong'}
          </p>
          <p className="text-slate-500 text-xs font-mono break-all">
            {this.state.error?.message ?? 'Unknown error'}
          </p>
        </div>
        <button
          onClick={this.reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-joulet-green/10 border border-joulet-green/25 text-joulet-green text-xs font-bold hover:bg-joulet-green/20 transition-all cursor-pointer"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }
}

/** Full-screen error boundary for the root App */
export class RootErrorBoundary extends React.Component<Pick<Props, 'children'>, State> {
  constructor(props: Pick<Props, 'children'>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RootErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh', width: '100vw', background: '#0a0f1e',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', gap: '1.5rem', fontFamily: 'Inter, sans-serif', color: '#e2e8f0',
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={32} style={{ color: '#fb7185' }} />
        </div>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Joulet encountered an error</p>
          <p style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 4 }}>
            {this.state.error?.message ?? 'Unknown error'}
          </p>
          <p style={{ color: '#334155', fontSize: 11 }}>
            Check the browser console for the full stack trace.
          </p>
        </div>
        <button
          onClick={this.reset}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            borderRadius: 12, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
            color: '#34d399', fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em',
          }}
        >
          <RefreshCw size={13} /> Try to recover
        </button>
      </div>
    );
  }
}
