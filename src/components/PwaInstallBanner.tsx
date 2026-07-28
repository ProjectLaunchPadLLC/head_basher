import React, { useState, useEffect } from 'react';
import { Download, X, WifiOff, CheckCircle2 } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Listen for offline/online events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capture install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isOffline) {
    return (
      <div id="pwa-offline-banner" className="bg-amber-950/90 border-b border-amber-800 text-amber-200 px-4 py-2 text-xs flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
          <span><strong>Offline Mode:</strong> Shell commands require active backend connection, but offline app frame is active.</span>
        </div>
      </div>
    );
  }

  if (!showBanner || isInstalled) return null;

  return (
    <div id="pwa-install-banner" className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-blue-800/60 text-slate-200 px-4 py-2 text-xs flex items-center justify-between z-50 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-blue-600/30 rounded-lg border border-blue-500/40 text-blue-400">
          <Download className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-slate-100">Install Linux Terminal PWA</span>
          <span className="hidden sm:inline text-slate-400 ml-2">Add to desktop or home screen for full standalone experience & fast access</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          id="btn-pwa-install"
          onClick={handleInstall}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md shadow transition flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
        <button
          id="btn-pwa-dismiss"
          onClick={() => setShowBanner(false)}
          className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition cursor-pointer"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
