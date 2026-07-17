// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://empyr-portfolio.com',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
});
