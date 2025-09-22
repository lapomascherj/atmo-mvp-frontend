import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1600px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				atmo: {
					orange: 'hsl(var(--atmo-orange))',
					pink: 'hsl(var(--atmo-pink))',
					gold: 'hsl(var(--atmo-gold))',
					burgundy: 'hsl(var(--atmo-burgundy))',
					'deep-purple': 'hsl(var(--atmo-deep-purple))',
					light: 'hsl(var(--atmo-light))',
					gradient: {
						start: '#FF5F1F',
						end: '#FF00A8'
					},
				}
			},
			fontFamily: {
				'work-sans': ['Work Sans', 'sans-serif'],
				'sanchez': ['Work Sans', 'sans-serif'],  // Replaced with Work Sans
				'montserrat': ['Work Sans', 'sans-serif'], // Replaced with Work Sans
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					"0%": {
						opacity: "0",
						transform: "translateY(10px)"
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0)"
					}
				},
				'fade-out': {
					"0%": {
						opacity: "1",
						transform: "translateY(0)"
					},
					"100%": {
						opacity: "0",
						transform: "translateY(10px)"
					}
				},
				'slide-in': {
					"0%": { transform: "translateX(-100%)" },
					"100%": { transform: "translateX(0)" }
				},
				'slide-out': {
					"0%": { transform: "translateX(0)" },
					"100%": { transform: "translateX(-100%)" }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' },
				},
				'pulse-soft': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' },
				},
				'task-complete': {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'50%': { transform: 'scale(1.05)', opacity: '1' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'pulse': {
					'0%': { opacity: '1', transform: 'scale(1)' },
					'50%': { opacity: '0.9', transform: 'scale(1.05)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'glow': {
					'0%, 100%': { boxShadow: '0 0 3px rgba(255, 95, 31, 0.3)' },
					'50%': { boxShadow: '0 0 15px rgba(255, 95, 31, 0.5)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'typing': {
					'from': { width: '0' },
					'to': { width: '100%' }
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '0.8' },
					'50%': { opacity: '0.2' },
				},
				'gradient': {
					'0%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
					'100%': { backgroundPosition: '0% 50%' },
				},
				'card-glow': {
					'0%, 100%': { boxShadow: '0 0 10px rgba(255, 95, 31, 0.2)' },
					'50%': { boxShadow: '0 0 20px rgba(255, 95, 31, 0.5)' },
				},
				'orange-glow': {
					'0%, 100%': { boxShadow: '0 0 10px rgba(255, 95, 31, 0.2)' },
					'50%': { boxShadow: '0 0 20px rgba(255, 95, 31, 0.5)' },
				},
				'purple-glow': {
					'0%, 100%': { boxShadow: '0 0 10px rgba(110, 89, 165, 0.2)' },
					'50%': { boxShadow: '0 0 20px rgba(110, 89, 165, 0.5)' },
				},
				'gold-glow': {
					'0%, 100%': { boxShadow: '0 0 10px rgba(253, 161, 54, 0.2)' },
					'50%': { boxShadow: '0 0 20px rgba(253, 161, 54, 0.5)' },
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'slide-in': 'slide-in 0.3s ease-out',
				'slide-out': 'slide-out 0.3s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
				'task-complete': 'task-complete 0.4s ease-in-out',
				'glow': 'glow 1.5s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'typing': 'typing 2s steps(40, end)',
				'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
				'gradient': 'gradient 15s ease infinite',
				'card-glow': 'card-glow 2s ease-in-out infinite',
				'orange-glow': 'orange-glow 2s ease-in-out infinite',
				'purple-glow': 'purple-glow 2s ease-in-out infinite',
				'gold-glow': 'gold-glow 2s ease-in-out infinite',
				'spin-slow': 'spin-slow 12s linear infinite',
			},
			boxShadow: {
				'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
				'card': '0 4px 24px 0 rgba(0, 0, 0, 0.2)',
				'elevated': '0 8px 30px rgba(0, 0, 0, 0.3)',
				'neon': '0 0 5px rgba(255, 95, 31, 0.7), 0 0 10px rgba(255, 95, 31, 0.5)',
				'inner-glow': 'inset 0 0 8px rgba(255, 95, 31, 0.4)'
			},
			backdropBlur: {
				'xs': '2px',
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, #FF5F1F, #FF00A8)',
				'gradient-subtle': 'linear-gradient(135deg, rgba(255, 95, 31, 0.15), rgba(255, 0, 168, 0.15))',
				'tech-gradient': 'linear-gradient(to right, #0a0212, #1f0a12, #0a0212)',
				'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],
} satisfies Config;
