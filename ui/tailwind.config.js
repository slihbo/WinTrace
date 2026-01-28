/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                background: '#09090b',
                surface: '#18181b',
                surfaceHighlight: '#27272a',
                primary: '#6366f1',
                secondary: '#ec4899',
                accent: '#8b5cf6',
                textMain: '#fafafa',
                textMuted: '#a1a1aa',
            },
            animation: {
                'blob': 'blob 7s infinite',
                'fade-in': 'fadeIn 0.2s ease-out',
                'scale-reveal': 'scaleReveal 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            },
            keyframes: {
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                fadeIn: {
                    'from': { opacity: '0' },
                    'to': { opacity: '1' },
                },
                scaleReveal: {
                    'from': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
                    'to': { opacity: '1', transform: 'scale(1) translateY(0)' },
                }
            }
        }
    },
    plugins: [],
}
