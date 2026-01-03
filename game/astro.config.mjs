// @ts-check
import { fileURLToPath } from 'node:url';
import solid from '@astrojs/solid-js';
import { defineConfig } from 'astro/config';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));
const gamePath = fileURLToPath(new URL('./src/game', import.meta.url));
const dataPath = fileURLToPath(new URL('./src/data', import.meta.url));

export default defineConfig({
	integrations: [solid()],
	site: 'https://jbdevprimary.github.io/otterblade-odyssey',
	base: '/otterblade-odyssey',
	server: {
		host: true,
		port: 4321,
	},
	build: {
		outDir: '../dist',
	},
	vite: {
		resolve: {
			alias: {
				'@': srcPath,
				'@game': gamePath,
				'@data': dataPath,
			},
		},
	},
});
