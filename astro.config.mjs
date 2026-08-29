// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://empyr.studio',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap(), react()],
});
