// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: process.env.NODE_ENV === 'production' 
    ? 'https://codevs.kroko.cl' 
    : 'http://localhost:4321',
  env: {
    schema: {
      WP_API_URL: {
        context: 'client',
        access: 'public',
        type: 'string'
      },
      WP_DOMAIN: {
        context: 'client', 
        access: 'public',
        type: 'string'
      }
    }
  },
  integrations: [mdx(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Cache busting automático para assets
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js'
        }
      }
    }
  },
  
  // Configuración de build para mejor cache control
  build: {
    assets: '_astro'
  }
});