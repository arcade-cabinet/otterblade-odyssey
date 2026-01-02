import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';

export default defineConfig({
  integrations: [solidJs()],
  site: 'https://arcade-cabinet.github.io',
  base: '/otterblade-odyssey',
  output: 'static',
  vite: {
    resolve: {
      alias: {
        '@game': '/src/game',
        '@components': '/src/components',
        '@stores': '/src/stores',
      }
    }
  }
});
