import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Add preprocess configuration
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter()
	}
};

export default config;