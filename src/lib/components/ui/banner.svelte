<script lang="ts">
	export let message = '';
	export let visible = false;

	let isFading = false;

	export function show(newMessage: string) {
		message = newMessage;
		visible = true;
		isFading = false;

		// Start fadeout after 2 seconds
		setTimeout(() => {
			isFading = true;
			setTimeout(() => {
				visible = false;
				isFading = false;
			}, 2000);
		}, 2000);
	}

	export function close() {
		isFading = true;
		setTimeout(() => {
			visible = false;
			isFading = false;
		}, 2000);
	}
</script>

{#if visible}
	<div class="fixed top-4 right-0 left-0 z-0 flex justify-center">
		<div
			class="z-50 flex max-w-md items-center space-x-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-white shadow-xl backdrop-blur-sm"
			class:banner-visible={!isFading}
			class:banner-fading={isFading}
		>
			<div class="flex-grow text-center">
				<p class="font-medium">{message}</p>
			</div>
			<button
				class="flex-shrink-0 cursor-pointer text-white hover:text-gray-200 focus:outline-none"
				on:click={close}
				aria-label="Close banner"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeOut {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	.banner-visible {
		opacity: 1;
		transition: opacity 2s ease-out;
	}

	.banner-fading {
		opacity: 0;
		transition: opacity 2s ease-out;
	}
</style>
