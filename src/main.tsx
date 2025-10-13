import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { Capacitor } from '@capacitor/core'
import App from './App.tsx'
import './index.css'
import './utils/consoleCleanup'

// Detect if running in native mobile app
const isNative = Capacitor.isNativePlatform();

console.log(`🚀 PocketTeller starting in ${isNative ? 'NATIVE MOBILE' : 'WEB'} mode`);

// For native apps, disable Index (marketing) page completely
if (isNative) {
  console.log('📱 Mobile app detected - marketing pages will be skipped');
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
