import './styles/global.css'

// ----------------------------------------------------------------------------
// Dark mode toggle functionality
// ----------------------------------------------------------------------------
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark')
  const isDark = document.documentElement.classList.contains('dark')
  localStorage.setItem('darkMode', String(isDark))
}

// Initialize dark mode from localStorage
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.classList.add('dark')
}

// Expose toggleDarkMode to global scope for onclick handlers
declare global {
  interface Window {
    toggleDarkMode: () => void
  }
}
window.toggleDarkMode = toggleDarkMode

// ----------------------------------------------------------------------------
// Mobile menu toggle functionality
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuButton = document.getElementById('mobile-menu-button')
  const mobileMenu = document.getElementById('mobile-menu')
  const mobileMenuOverlay = document.getElementById('mobile-menu-overlay')
  const menuIcon = document.getElementById('menu-icon')
  const closeIcon = document.getElementById('close-icon')

  function toggleMenu() {
    const isExpanded = mobileMenuButton?.getAttribute('aria-expanded') === 'true'

    // Toggle menu visibility
    mobileMenu?.classList.toggle('hidden')
    mobileMenuOverlay?.classList.toggle('hidden')

    // Toggle icons
    menuIcon?.classList.toggle('hidden')
    closeIcon?.classList.toggle('hidden')

    // Update aria-expanded
    mobileMenuButton?.setAttribute('aria-expanded', String(!isExpanded))

    // Prevent body scroll when menu is open
    if (!isExpanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }

  function closeMenu() {
    mobileMenu?.classList.add('hidden')
    mobileMenuOverlay?.classList.add('hidden')
    menuIcon?.classList.remove('hidden')
    closeIcon?.classList.add('hidden')
    mobileMenuButton?.setAttribute('aria-expanded', 'false')
    document.body.style.overflow = ''
  }

  if (mobileMenuButton && mobileMenu) {
    // Toggle menu on button click
    mobileMenuButton.addEventListener('click', toggleMenu)

    // Close menu when clicking overlay
    mobileMenuOverlay?.addEventListener('click', closeMenu)

    // Close menu when clicking a link
    const menuLinks = mobileMenu.querySelectorAll('a')
    menuLinks.forEach((link) => {
      link.addEventListener('click', closeMenu)
    })

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        closeMenu()
      }
    })
  }
})
