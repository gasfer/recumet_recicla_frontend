/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}'
  ],
  corePlugins: {
    // Desactivado para no romper Bootstrap 5 / Skote template
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        'erp-primary':      'rgb(var(--color-primary-rgb) / <alpha-value>)',
        'erp-primary-hover':'rgb(var(--color-primary-hover-rgb) / <alpha-value>)',
        'erp-surface':      '#ffffff',
        'erp-bg':           '#F1F5F9',
        'erp-border':       '#E2E8F0',
        'erp-sidebar':      '#0F172A',
        'erp-text':         '#1E293B',
        'erp-text-muted':   '#64748B',
        'erp-danger':       '#EF4444',
        'erp-warning':      '#F59E0B',
        'erp-success':      'rgb(var(--color-primary-rgb) / <alpha-value>)',
        'erp-info':         '#2563EB',
        brand: {
          emerald: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          'emerald-light': 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          navy: '#0b1324',
          'navy-card': '#111c35',
          'navy-light': '#1e293b',
          accent: '#3b82f6',
          'accent-soft': '#eff6ff'
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
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
