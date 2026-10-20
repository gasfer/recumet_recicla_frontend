/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}'
  ],
  corePlugins: {
    // Desactivado para no romper Bootstrap 5 / Skote template
    preflight: false
  },
  darkMode: ['selector', '[data-bs-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'erp-header': 'var(--color-header-modal)',
        'erp-success-soft': 'rgb(var(--color-success-soft-rgb) / <alpha-value>)',
        'erp-info-soft': 'rgb(var(--color-info-soft-rgb) / <alpha-value>)',
        'erp-warning-soft': 'rgb(var(--color-warning-soft-rgb) / <alpha-value>)',
        'erp-danger-soft': 'rgb(var(--color-danger-soft-rgb) / <alpha-value>)',
        'erp-primary':      'rgb(var(--color-primary-rgb) / <alpha-value>)',
        'erp-primary-hover':'rgb(var(--color-primary-hover-rgb) / <alpha-value>)',
        'erp-primary-active': 'var(--color-primary-active)',
        'erp-selection': 'var(--color-primary-light)',
        'erp-action': 'var(--color-action-primary)',
        'erp-action-hover': 'var(--color-action-primary-hover)',
        'erp-action-secondary': 'var(--color-action-secondary)',
        'erp-surface': 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        'erp-bg': 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        'erp-border': 'rgb(var(--color-border-rgb) / <alpha-value>)',
        'erp-border-subtle': 'rgb(var(--color-border-subtle-rgb, 241 245 249) / <alpha-value>)',
        'erp-sidebar': 'rgb(var(--color-sidebar-rgb) / <alpha-value>)',
        'erp-text': 'rgb(var(--color-text-rgb) / <alpha-value>)',
        'erp-text-muted': 'rgb(var(--color-text-muted-rgb) / <alpha-value>)',
        'erp-danger': 'rgb(var(--color-danger-rgb) / <alpha-value>)',
        'erp-warning': 'rgb(var(--color-warning-rgb) / <alpha-value>)',
        'erp-success':      'rgb(var(--color-success-rgb) / <alpha-value>)',
        'erp-info': 'rgb(var(--color-info-rgb) / <alpha-value>)',
        brand: {
          emerald: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          'emerald-light': 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          navy: 'rgb(var(--color-sidebar-rgb) / <alpha-value>)',
          'navy-card': 'var(--color-surface-secondary)',
          'navy-light': 'var(--color-surface)',
          accent: 'var(--color-info)',
          'accent-soft': 'var(--color-info-light)'
        }
      },
      spacing: {
        'erp-xs': 'var(--spacing-xs)',
        'erp-sm': 'var(--spacing-sm)',
        'erp-md': 'var(--spacing-md)',
        'erp-lg': 'var(--spacing-lg)',
        'erp-xl': 'var(--spacing-xl)',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'erp-card': '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
      },
      borderRadius: {
        'erp': '0.5rem',
        'erp-lg': '0.75rem',
        'erp-xl': '1rem',
      }
    },
  },
  plugins: [],
};
