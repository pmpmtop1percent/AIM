import React, { useState, useEffect, useRef } from 'react';
import { Camera, Scan, Sparkles, X, Volume2, Search, CornerDownLeft } from 'lucide-react';
import { useWms } from '../context/WmsContext';

interface BarcodeScannerProps {
  onScanSuccess: (sku: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const { items } = useWms();
  const [typedSku, setTypedSku] = useState('');
  const [scanningMode, setScanningMode] = useState<'camera' | 'manual'>('manual');
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play synthetic laser scanner beep
  const triggerBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch laser beep
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      
      oscillator.start();
      // stop after 100ms
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn('Web Audio API beep not supported or blocked by user gesture:', e);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Rear camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setErrorMsg('Camera access denied or unavailable in this client. Reverting to manual SKU input.');
      setScanningMode('manual');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (scanningMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [scanningMode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSku = typedSku.trim().toUpperCase();
    if (!cleanSku) return;

    // Check if it exists in item master
    const matched = items.find(i => i.sku === cleanSku);
    if (!matched) {
      setErrorMsg(`SKU "${cleanSku}" not registered in the system.`);
      return;
    }

    triggerBeepSound();
    onScanSuccess(cleanSku);
    onClose();
  };

  const handleSimulatedScan = (sku: string) => {
    triggerBeepSound();
    onScanSuccess(sku);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="font-semibold text-slate-100 tracking-tight font-sans">
              Integrated Barcode Reader
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toggle Tabs */}
        <div className="flex border-b border-slate-800 p-1 bg-slate-950">
          <button
            type="button"
            onClick={() => setScanningMode('manual')}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              scanningMode === 'manual'
                ? 'bg-slate-800 text-indigo-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            SKU Direct Lookup / Simulator
          </button>
          <button
            type="button"
            onClick={() => setScanningMode('camera')}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              scanningMode === 'camera'
                ? 'bg-slate-800 text-indigo-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Optic HUD Scanner
          </button>
        </div>

        {/* Viewfinder Content */}
        <div className="p-5 font-sans">
          
          {scanningMode === 'camera' && (
            <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-center items-center">
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover"
                playsInline 
                muted
              />
              
              {/* Retro HUD scanning box */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="relative w-48 h-24 border-2 border-indigo-400 rounded-lg animate-pulse" style={{ boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' }}>
                  {/* Glowing Laser line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 animate-bounce shadow-[0_0_10px_2px_rgba(239,68,68,0.7)]" style={{ top: '50%' }} />
                </div>
                <div className="mt-3 text-[10px] uppercase font-mono tracking-widest text-indigo-400 bg-slate-950/80 px-2 py-0.5 rounded">
                  Align Barcode / QR Inside HUD Box
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {scanningMode === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Input Alphanumeric SKU Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={typedSku}
                    onChange={(e) => setTypedSku(e.target.value)}
                    placeholder="e.g. CPU-INT-I9"
                    className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-indigo-600 text-slate-100 rounded-xl hover:bg-indigo-500 active:scale-98 transition-all flex items-center gap-1.5 focus:outline-none"
                  >
                    <CornerDownLeft className="w-4 h-4" />
                    Decode
                  </button>
                </div>
              </div>

              {/* Simulation Quick list */}
              <div className="border-t border-slate-800/60 pt-4">
                <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Simulate Interactive Package Scan
                </div>
                <p className="text-slate-500 text-xs mb-3">
                  Click on an active warehouse master item SKU below to mock direct hardware laser reading:
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {items.map((it) => (
                    <button
                      key={it.sku}
                      type="button"
                      onClick={() => handleSimulatedScan(it.sku)}
                      className="flex flex-col items-start p-2.5 bg-slate-950 text-left border border-slate-800 rounded-lg text-slate-300 hover:border-indigo-500/70 hover:bg-slate-900 transition-all font-sans group"
                    >
                      <span className="font-mono text-xs font-semibold text-indigo-300 group-hover:text-indigo-400">
                        {it.sku}
                      </span>
                      <span className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                        {it.name}
                      </span>
                    </button>
                  ))}
                  {items.length === 0 && (
                    <div className="col-span-2 text-center text-xs text-slate-600 py-3 italic">
                      No active master items registered yet. Click "Init Seed Data" in administration portal first.
                    </div>
                  )}
                </div>
              </div>
            </form>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-slate-400 text-xs text-center leading-relaxed">
                Aiming camera at package barcode identifies product SKU in real-world deployments. Move to manual mode above to simulate rapid clicks.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setScanningMode('manual')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs font-medium transition-all"
                >
                  Switch back to Manual Input
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
