import './styles/global.css';
import type { Alpine as AlpineType } from 'alpinejs';
import Alpine from 'alpinejs';

declare global {
  interface Window {
    Alpine: AlpineType;
  }
}

window.Alpine = Alpine;
Alpine.start();
