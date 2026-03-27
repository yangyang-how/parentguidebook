import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import preact from '@astrojs/preact';
import rehypeSourceCitations from './src/plugins/rehype-source-citations.ts';

export default defineConfig({
  site: 'https://parentguidebook.org',
  outDir: 'dist', // build output; Cloudflare deploy command uploads this folder
  integrations: [tailwind(), preact()],
  markdown: {
    rehypePlugins: [rehypeSourceCitations],
  },
});

