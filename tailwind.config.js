/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        couple: {
          50: '#fff5f6',
          100: '#ffebeb',
          200: '#ffd1d7',
          300: '#ffa8b3',
          400: '#ff7082',
          500: '#ff3d59', // core pink
          600: '#ed1c3e',
          700: '#c7102e',
          800: '#a5102a',
          900: '#891127',
        },
        pastel: {
          pink: '#FFE4E1',     // Misty Rose
          pinkLight: '#FFF0F5',// Lavender Blush
          cream: '#FFFDD0',    // Cream
          beige: '#FAF0E6',    // Linen
          beigeDark: '#E5D3C0',// Flax/Warm Beige
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
