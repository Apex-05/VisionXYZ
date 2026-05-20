'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { captureInstallPrompt, triggerInstallPrompt, isInstallable, isPWAInstalled } from '@/app/pwa/offline';

export function InstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isPWAInstalled()) {
      setInstalled(true);
      return;
    }

    captureInstallPrompt();

    const check = setInterval(() => {
      setCanInstall(isInstallable());
    }, 500);

    return () => clearInterval(check);
  }, []);

  if (installed || dismissed || !canInstall) return null;

  const handleInstall = async () => {
    const accepted = await triggerInstallPrompt();
    if (accepted) {
      setInstalled(true);
    }
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-200 border border-accent-cyan/30 rounded-xl shadow-xl shadow-black/50">
        <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center flex-shrink-0">
          <Download className="w-4 h-4 text-accent-cyan" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Install VisionXYZ</p>
          <p className="text-xs text-gray-400">Use offline as a native app</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-accent-cyan text-black text-xs font-bold rounded-lg hover:bg-cyan-300 transition-colors"
          >
            Install
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
