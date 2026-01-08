/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
    	extend: {
    		height: {
    			'screen-dynamic': 'var(--real-vh)'
    		},
    		screens: {
    			s: '0px',
    			xs: '375px',
    			sm: '480px',
    			md: '768px',
    			lg: '1024px',
    			xl: '1280px'
    		},
    		colors: {
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		fontFamily: {
    			sans: [
    				'Roboto',
    				'ui-sans-serif',
    				'system-ui'
    			]
    		},
    		borderRadius: {
    			xl: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		animation: {
    			'caret-blink': 'caret-blink 1.25s ease-out infinite',
    			'fade-in': 'fade-in 0.5s ease-out',
    			'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    			'dropdown-slide': 'dropdown-slide 0.3s ease-out',
    			zoom: 'zoom 3s ease-out',
    			'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
    			'bounce-x': 'bounceX 1s infinite',
    			'scale-in': 'scaleIn 0.3s ease-out',
    			'fade-out': 'fadeOut 0.3s ease-out forwards',
    			'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    			wave: 'wave 2s linear infinite',
    			'border-glow': 'borderGlow 2s ease-in-out infinite',
    			'gradient-x': 'gradientX 3s ease infinite',
    			'text-float': 'textFloat 3s ease-in-out infinite',
    			'card-hover': 'cardHover 0.5s ease forwards',
    			'rotate-close': 'rotateClose 0.5s ease',
    			'staggered-fade': 'staggeredFade 0.5s ease forwards',
    			'button-bounce': 'buttonBounce 0.4s ease',
    			'card-pop': 'cardPop 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    			'pulse-once': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) 1',
    			'slide-in-right': 'slideInRight 0.5s ease-out',
    			scaleUp: 'scaleUp 0.2s ease-in-out',
    			heartbeat: 'heartbeat 1.5s ease-in-out infinite',
    			spinSlow: 'spinSlow 3s linear infinite',
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		},
    		keyframes: {
    			'caret-blink': {
    				'0%,70%,100%': {
    					opacity: '1'
    				},
    				'20%,50%': {
    					opacity: '0'
    				}
    			},
    			'fade-in': {
    				from: {
    					opacity: 0
    				},
    				to: {
    					opacity: 1
    				}
    			},
    			'slide-up': {
    				from: {
    					transform: 'translateY(20px)',
    					opacity: 0
    				},
    				to: {
    					transform: 'translateY(0)',
    					opacity: 1
    				}
    			},
    			'dropdown-slide': {
    				from: {
    					transform: 'translateY(-10px)',
    					opacity: 0
    				},
    				to: {
    					transform: 'translateY(0)',
    					opacity: 1
    				}
    			},
    			zoom: {
    				from: {
    					transform: 'scale(1.05)'
    				},
    				to: {
    					transform: 'scale(1)'
    				}
    			},
    			'fade-in-up': {
    				from: {
    					transform: 'translateY(10px)',
    					opacity: 0
    				},
    				to: {
    					transform: 'translateY(0)',
    					opacity: 1
    				}
    			},
    			bounceX: {
    				'0%, 100%': {
    					transform: 'translateX(-5%)'
    				},
    				'50%': {
    					transform: 'translateX(5%)'
    				}
    			},
    			scaleIn: {
    				'0%': {
    					transform: 'scale(0.95)',
    					opacity: '0'
    				},
    				'100%': {
    					transform: 'scale(1)',
    					opacity: '1'
    				}
    			},
    			fadeOut: {
    				'0%': {
    					opacity: '1'
    				},
    				'100%': {
    					opacity: '0'
    				}
    			},
    			wave: {
    				'0%': {
    					transform: 'rotate(0deg)'
    				},
    				'10%': {
    					transform: 'rotate(14deg)'
    				},
    				'20%': {
    					transform: 'rotate(-8deg)'
    				},
    				'30%': {
    					transform: 'rotate(14deg)'
    				},
    				'40%': {
    					transform: 'rotate(-4deg)'
    				},
    				'50%': {
    					transform: 'rotate(10deg)'
    				},
    				'60%': {
    					transform: 'rotate(0deg)'
    				},
    				'100%': {
    					transform: 'rotate(0deg)'
    				}
    			},
    			borderGlow: {
    				'0%, 100%': {
    					'border-color': 'transparent'
    				},
    				'50%': {
    					'border-color': 'rgb(34 197 94)'
    				}
    			},
    			gradientX: {
    				'0%, 100%': {
    					'background-position': '0% 50%'
    				},
    				'50%': {
    					'background-position': '100% 50%'
    				}
    			},
    			textFloat: {
    				'0%, 100%': {
    					transform: 'translateY(0)'
    				},
    				'50%': {
    					transform: 'translateY(-5px)'
    				}
    			},
    			cardHover: {
    				'0%': {
    					transform: 'translateY(0)',
    					boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    				},
    				'100%': {
    					transform: 'translateY(-4px)',
    					boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    				}
    			},
    			rotateClose: {
    				'0%': {
    					transform: 'rotate(0deg)'
    				},
    				'100%': {
    					transform: 'rotate(90deg)'
    				}
    			},
    			staggeredFade: {
    				'0%': {
    					opacity: '0',
    					transform: 'translateX(-10px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateX(0)'
    				}
    			},
    			buttonBounce: {
    				'0%, 100%': {
    					transform: 'translateY(0)'
    				},
    				'50%': {
    					transform: 'translateY(-3px)'
    				}
    			},
    			cardPop: {
    				'0%': {
    					opacity: '0',
    					transform: 'scale(0.8) translateY(20px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'scale(1) translateY(0)'
    				}
    			},
    			slideInRight: {
    				'0%': {
    					opacity: '0',
    					transform: 'translateX(50px)'
    				},
    				'100%': {
    					opacity: '1',
    					transform: 'translateX(0)'
    				}
    			},
    			scaleUp: {
    				'0%': {
    					transform: 'scale(0.9)'
    				},
    				'100%': {
    					transform: 'scale(1)'
    				}
    			},
    			heartbeat: {
    				'0%, 100%': {
    					transform: 'scale(1)'
    				},
    				'50%': {
    					transform: 'scale(1.1)'
    				}
    			},
    			spinSlow: {
    				'0%': {
    					transform: 'rotate(0deg)'
    				},
    				'100%': {
    					transform: 'rotate(360deg)'
    				}
    			},
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
    			}
    		}
    	}
    },
    plugins: [
        require("tailwindcss-animate"),
        require('tailwind-scrollbar'),
    ],
    // corePlugins: {
    // 	ringWidth: false,
    // },
};
