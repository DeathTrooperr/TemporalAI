<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const appName = 'TemporalAI';
	const backToHomeUrl = '/';

	let isLoading = false;
	let errorMessage = '';

	// Check for error parameters when component mounts
	onMount(() => {
		// Get error type from URL if present
		const errorType = page.url.searchParams.get('error');

		if (errorType) {
			switch (errorType) {
				case 'auth_failed':
					errorMessage = 'Authentication failed. Please try again.';
					break;
				case 'access_denied':
					errorMessage = "Access denied. You don't have permission to access this application.";
					break;
				case 'session_expired':
					errorMessage = 'Your session has expired. Please sign in again.';
					break;
				case 'google_error':
					errorMessage = 'Google authentication failed. Please try again.';
					break;
				default:
					errorMessage = 'An error occurred during login. Please try again.';
			}
		}
	});

	const handleGoogleLogin = async () => {
		try {
			isLoading = true;
			await goto('/login/auth/google');
		} catch (error) {
			errorMessage = 'Google authentication failed. Please try again.';
		} finally {
			isLoading = false;
		}
	};

	// Function to dismiss error message
	const dismissError = () => {
		errorMessage = '';
		// Clear URL parameters
		const url = new URL(window.location.href);
		url.searchParams.delete('error');
		history.replaceState({}, '', url);
	};
</script>

<div class="relative flex min-h-screen w-screen items-center justify-center bg-cover bg-center">
	<!-- Back to Home button -->
	<a href={backToHomeUrl} class="group absolute top-8 left-8 z-10 flex items-center text-white">
		<svg
			class="mr-2 h-5 w-5 transform transition group-hover:-translate-x-1"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M10 19l-7-7m0 0l7-7m-7 7h18"
			></path>
		</svg>
		Back to Home
	</a>

	<!-- Login Container -->
	<div class="relative z-10 container mx-auto px-4">
		<div class="mx-auto w-full max-w-md">
			<!-- Logo -->
			<div class="mb-6 flex items-center justify-center space-x-2">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"
				>
					<span class="text-2xl font-bold text-white">T</span>
				</div>
				<span class="text-2xl font-bold text-white">{appName}</span>
			</div>

			<!-- Auth Card -->
			<div class="rounded-2xl bg-white/10 p-1 shadow-2xl backdrop-blur-md">
				<div class="rounded-xl bg-gray-900 p-8">
					<h2 class="mb-4 text-center text-2xl font-bold text-white">Sign in to continue</h2>
					<p class="mb-6 text-center text-gray-400">This application requires a Google account</p>

					<!-- Error message -->
					{#if errorMessage}
						<div class="relative mb-6 rounded-lg bg-red-900/70 p-3 text-sm text-white">
							<button
								on:click={dismissError}
								class="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-white/80 hover:text-white"
								aria-label="Dismiss error"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
							{errorMessage}
						</div>
					{/if}

					<!-- Google Sign In Button -->
					<button
						type="button"
						on:click={handleGoogleLogin}
						disabled={isLoading}
						class="flex w-full cursor-pointer items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
					>
						{#if isLoading}
							<svg
								class="mr-3 -ml-1 h-5 w-5 animate-spin text-gray-600"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Processing...
						{:else}
							<!-- Google Logo -->
							<svg class="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Sign in with Google
						{/if}
					</button>

					<!-- Added info and license links -->
					<div class="mt-6 border-t border-gray-800 pt-4 text-center text-xs text-gray-500">
						<p>
							By continuing, you agree to our
							<a href="/terms" class="text-blue-400 hover:text-blue-300">Terms of Service</a>
						</p>
						<p class="mt-2">
							<a href="/license" class="text-blue-400 hover:text-blue-300">License Information</a> •
							<a href="/privacy" class="text-blue-400 hover:text-blue-300">Privacy Policy</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
