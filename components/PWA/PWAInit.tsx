'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/app/pwa/cache';
import { InstallPrompt } from './InstallPrompt';

export function PWAInit() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <InstallPrompt />;
}
