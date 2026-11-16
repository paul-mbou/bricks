// @ts-check
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  site: 'https://brick-gestion.vercel.app',
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  env: {
    schema: {
      PUBLIC_APPWRITE_ENDPOINT: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_APPWRITE_PROJECT_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_DISABLE_DEMO: envField.string({ context: 'client', access: 'public', optional: true }),
      APPWRITE_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@domain': '/packages/domain/src',
      },
    },
  },
});
