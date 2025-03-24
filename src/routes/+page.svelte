<script lang="ts">
	export let data;
	import { onMount } from 'svelte';
	import Banner from '$lib/components/ui/banner.svelte';

	const appName = 'TemporalAI';
	const githubRepo = 'https://github.com/DeathTrooperr/TemporalAI';

	let bannerComponent: Banner;

	onMount(() => {
		const logoutSuccess = data.logout;

		if (logoutSuccess === 'true') {
			bannerComponent.show('You have been successfully logged out!');
			const newUrl = window.location.pathname;
			window.history.replaceState({}, document.title, newUrl);
		}
	});
</script>

<Banner bind:this={bannerComponent} />

<!-- Hero Section (Full Page) -->
<header class="relative flex min-h-screen w-screen items-center justify-center bg-cover bg-center">
	<div class="relative z-10 container mx-auto flex flex-col items-center px-4">
		<!-- App Logo -->
		<div class="mb-10 flex items-center space-x-2">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"
			>
				<span class="text-2xl font-bold text-white">T</span>
			</div>
			<span class="text-2xl font-bold text-white">{appName}</span>
		</div>

		<!-- Main Content -->
		<div class="w-full max-w-4xl text-center">
			<h1 class="mb-6 text-5xl font-extrabold text-white md:text-6xl">
				The Future of <span
					class="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent"
					>Time Management</span
				>
			</h1>
			<p class="mx-auto mb-8 max-w-2xl text-xl text-gray-300 md:text-2xl">
				Experience cutting-edge AI technology that transforms how you work, create and innovate.
			</p>

			<!-- Simplified Terminal Section -->
			<div class="mx-auto mb-12 max-w-lg overflow-hidden rounded-lg bg-gray-900 shadow-2xl">
				<!-- Terminal Header -->
				<div class="flex items-center bg-gray-800 px-4 py-2">
					<div class="flex space-x-2">
						<div class="h-3 w-3 rounded-full bg-red-500"></div>
						<div class="h-3 w-3 rounded-full bg-yellow-500"></div>
						<div class="h-3 w-3 rounded-full bg-green-500"></div>
					</div>
				</div>
				<!-- Terminal Content -->
				<div class="p-4 text-left font-mono text-gray-300">
					<div class="flex items-center">
						<span class="mr-2 text-green-400">$</span>
						<span>start_temporal</span>
						<span class="ml-1 animate-pulse">|</span>
					</div>
				</div>
			</div>

			<!-- CTA Buttons -->
			<div class="flex flex-col justify-center space-y-4 md:flex-row md:space-y-0 md:space-x-4">
				<a
					href="/app"
					class="transform rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 font-bold text-white transition hover:scale-105 hover:from-blue-600 hover:to-purple-700"
				>
					Try Demo
				</a>
				<a
					href={githubRepo}
					target="_blank"
					class="flex items-center justify-center rounded-lg bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-md transition hover:bg-white/20"
				>
					<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
							clip-rule="evenodd"
						></path>
					</svg>
					GitHub
				</a>
			</div>
		</div>
	</div>
</header>
