/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
	content: ['./hugo_stats.json'],
	plugins: [require('@tailwindcss/typography'), require('tailwind-scrollbar-hide')],
	theme: {
		extend: {
			colors: {
				'bernats-blue': '#020060',
			},
			fontFamily: {
				'sans': ['Inter', ...defaultTheme.fontFamily.sans],
			}
		}
	}
};
