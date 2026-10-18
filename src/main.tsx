import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

async function showTestBanner() {
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    await AdMob.initialize();

    const options: BannerAdOptions = {
      adId: 'ca-app-pub-3940256099942544/9214589741',
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true,
      npa: true,
    };

    await AdMob.showBanner(options);
  } catch (error) {
    console.warn('No se pudo mostrar el banner AdMob de prueba:', error);
  }
}

window.addEventListener('load', () => {
  window.setTimeout(() => {
    void showTestBanner();
  }, 800);
});
