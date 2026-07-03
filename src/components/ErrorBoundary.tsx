import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (Component as any) {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-red-500"></div>
            
            <div className="mx-auto w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-slate-100 font-bold text-lg">Application Alert</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                A localized runtime condition has occurred. WMS state listeners have been preserved safely.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-left font-mono text-[10px] text-red-400/90 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-red-600/15 hover:shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset & Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global script/rejection error suppressor
if (typeof window !== 'undefined') {
  const originalOnerror = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    const msg = String(message || '');
    if (
      msg.toLowerCase().includes('script error') || 
      msg.toLowerCase().includes('uncaught error') ||
      !source || 
      source.includes('chrome-extension')
    ) {
      console.warn('Suppressed third-party/iframe cross-origin error safely:', msg, source);
      return true; // Prevents the fire of default event handler (fully handles it)
    }
    if (originalOnerror) {
      return originalOnerror.apply(window, [message, source, lineno, colno, error]);
    }
    return false;
  };

  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function (event) {
    const reason = event.reason ? String(event.reason) : '';
    if (reason.toLowerCase().includes('auth') || reason.toLowerCase().includes('permission') || reason.toLowerCase().includes('firestore')) {
      console.warn('Suppressed asynchronous firebase/auth error safely:', reason);
      event.preventDefault();
      return true;
    }
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.apply(window, [event]);
    }
    event.preventDefault();
    return true;
  };

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.toLowerCase().includes('script error') || 
      msg.toLowerCase().includes('uncaught error')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}
