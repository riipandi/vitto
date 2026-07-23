import './styles/global.css';

// ----------------------------------------------------------------------------
// Dark mode
// ----------------------------------------------------------------------------
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('darkMode', String(isDark));
}

if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.classList.add('dark');
}

declare global {
  interface Window {
    toggleDarkMode: () => void;
  }
}
window.toggleDarkMode = toggleDarkMode;

// ----------------------------------------------------------------------------
// Intersection Observer — reveal on scroll
// ----------------------------------------------------------------------------
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach((el) => observer.observe(el));
}

// ----------------------------------------------------------------------------
// Mobile menu
// ----------------------------------------------------------------------------
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-button');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');

  if (!btn || !menu) return;

  function toggle() {
    const open = menu!.classList.toggle('hidden');
    overlay?.classList.toggle('hidden');
    menuIcon?.classList.toggle('hidden');
    closeIcon?.classList.toggle('hidden');
    btn!.setAttribute('aria-expanded', String(!open));
    document.body.style.overflow = open ? '' : 'hidden';
  }

  function close() {
    menu!.classList.add('hidden');
    overlay?.classList.add('hidden');
    menuIcon?.classList.remove('hidden');
    closeIcon?.classList.add('hidden');
    btn!.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', toggle);
  overlay?.addEventListener('click', close);
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu!.classList.contains('hidden')) close();
  });
}

// ----------------------------------------------------------------------------
// Copy command
// ----------------------------------------------------------------------------
async function copyCommand(el: HTMLElement, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    const original = el.innerHTML;
    el.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    el.classList.add('text-green-500');
    setTimeout(() => {
      el.innerHTML = original;
      el.classList.remove('text-green-500');
    }, 1500);
  } catch {
    // Fallback
  }
}

declare global {
  interface Window {
    copyCommand: (el: HTMLElement, text: string) => void;
  }
}
window.copyCommand = copyCommand;

// ----------------------------------------------------------------------------
// Init
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initMobileMenu();
});
