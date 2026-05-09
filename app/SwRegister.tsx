'use client';

import { useEffect } from 'react';

export default function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((err) => console.warn('sw register failed', err));
  }, []);
  return null;
}
