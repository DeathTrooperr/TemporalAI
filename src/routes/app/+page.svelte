<script lang="ts">
	export let data;
	import Calendar from '$lib/components/calendar.svelte';
	import Chatbox from '$lib/components/chatbox.svelte';
	import Banner from '$lib/components/banner.svelte';
	import { goto } from '$app/navigation';

	type User = {
		name: string;
		email: string;
		picture: string;
	};

	const { user } = data as { user: User };

	// State for the mobile tab toggle
	let activeTab: 'calendar' | 'chat' = 'calendar'; // Default to calendar view

	// Function to change the active tab
	function setActiveTab(tab: typeof activeTab): void {
		activeTab = tab;
	}

	// User dropdown menu state
	let userMenuOpen = false;

	// Toggle the user menu
	function toggleUserMenu(): void {
		userMenuOpen = !userMenuOpen;
	}

	// Close the menu if clicked outside
	function closeUserMenu(): void {
		userMenuOpen = false;
	}

	// Handle keydown events for accessibility
	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ' ') {
			closeUserMenu();
		}
	}

	// Create a reference to the Banner component
	let bannerComponent: { show: (message: string) => void };

	// Function to show notifications using the new Banner component
	function showNotification(message: string): void {
		bannerComponent.show(message);
	}

	// Handle menu actions
	function handleSignOut(): void {
		goto('/logout');
		closeUserMenu();
	}

	async function handleRefreshToken(): Promise<void> {
		closeUserMenu();

		showNotification('Refreshing authentication token...');
		try {
			// Make a request to refresh token endpoint
			const response = await fetch('/login/auth/refresh', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});

			if (response.ok) {
				const responseData: { success: boolean; message?: string } = await response.json();
				if (responseData.success) {
					// Success notification
					showNotification('Token refreshed successfully!');
				} else {
					// API returned error in the payload
					showNotification(`Token refresh failed: ${responseData.message || 'Unknown error'}`);
				}
			} else {
				// Handle HTTP error
				showNotification(`Token refresh failed (${response.status})`);
			}
		} catch (error) {
			// Handle network/fetch error
			const err = error as Error;
			showNotification(`Error refreshing token: ${err.message || 'Unknown error'}`);
		}
	}

	function handleOpenGitHub(): void {
		// Open the specific GitHub repository in a new tab
		window.open('https://github.com/DeathTrooperr/TemporalAI', '_blank');
		closeUserMenu();
	}
</script>

<!-- App container with background image and overlay -->
<svelte:window on:click={closeUserMenu} />
<Banner bind:this={bannerComponent} />
<div class="relative flex h-screen w-screen flex-col overflow-hidden bg-cover bg-center text-white">
	<!-- Changed from on:click|self to a proper button for accessibility -->
	<div class="relative z-10 container mx-auto flex h-full flex-col px-3 sm:px-4">
		<!-- App header with mobile optimization -->
		<header class="py-3 md:py-4">
			<div class="flex items-center justify-between">
				<a href="/" class="flex items-center space-x-2 transition-opacity hover:opacity-90">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 md:h-12 md:w-12"
					>
						<span class="text-xl font-bold text-white md:text-2xl">T</span>
					</div>
					<span class="text-xl font-bold text-white md:text-2xl">TemporalAI</span>
				</a>

				<!-- User profile with dropdown - removed the three dots menu -->
				<div class="relative">
					<button
						on:click|stopPropagation={toggleUserMenu}
						class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-cover bg-center transition-opacity hover:opacity-90 focus:ring-2 focus:ring-white/30 focus:outline-none md:h-10 md:w-10"
						style="background-image: url('{user.picture}');"
						aria-expanded={userMenuOpen}
						aria-haspopup="true"
					>
						<!-- Keep empty or add a fallback span that shows only if image fails to load -->
						<span class="sr-only text-xs font-bold text-white capitalize md:text-sm"
							>{user.name[0]}</span
						>
					</button>

					<!-- Dropdown menu -->
					{#if userMenuOpen}
						<div
							class="ring-opacity-5 absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md border border-gray-700 bg-gray-800 py-1 shadow-lg ring-1 ring-black focus:outline-none"
							role="menu"
							aria-orientation="vertical"
							on:click|stopPropagation
							on:keydown={handleKeydown}
							tabindex="0"
						>
							<div class="border-b border-gray-700 px-4 py-3">
								<p class="text-sm">Signed in as</p>
								<p class="truncate text-sm font-medium">{user.email}</p>
							</div>

							<button
								class="flex w-full cursor-pointer items-center space-x-2 px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
								role="menuitem"
								on:click={handleRefreshToken}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
								<span>Refresh Token</span>
							</button>

							<button
								class="flex w-full cursor-pointer items-center space-x-2 px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
								role="menuitem"
								on:click={handleOpenGitHub}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.022.8-.223 1.654-.333 2.504-.337.85.004 1.705.114 2.504.337 1.909-1.291 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"
										clip-rule="evenodd"
									/>
								</svg>
								<span>TemporalAI Repo</span>
							</button>

							<div class="border-t border-gray-700">
								<button
									class="flex w-full cursor-pointer items-center space-x-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
									role="menuitem"
									on:click={handleSignOut}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
										/>
									</svg>
									<span>Sign out</span>
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</header>

		<!-- Main content - takes all available space with the footer removed -->
		<main class="flex flex-grow flex-col overflow-hidden pb-2 md:pb-4">
			<!-- Tab navigation for mobile -->
			<div class="mb-2 flex space-x-2 sm:hidden">
				<button
					class="flex-1 rounded-lg border py-2 text-center font-medium transition-all duration-200 {activeTab ===
					'calendar'
						? 'border-white/10 bg-gray-900/80 text-white'
						: 'border-white/5 bg-gray-900/40 text-gray-300'}"
					on:click={() => setActiveTab('calendar')}
				>
					Calendar
				</button>
				<button
					class="flex-1 rounded-lg border py-2 text-center font-medium transition-all duration-200 {activeTab ===
					'chat'
						? 'border-white/10 bg-gray-900/80 text-white'
						: 'border-white/5 bg-gray-900/40 text-gray-300'}"
					on:click={() => setActiveTab('chat')}
				>
					Chat
				</button>
			</div>

			<!-- Desktop layout: grid -->
			<div class="hidden h-full gap-4 sm:grid sm:grid-cols-3 md:gap-6">
				<!-- Calendar (left side) -->
				<div
					class="col-span-2 h-full overflow-hidden rounded-lg border border-white/10 bg-gray-900/80 shadow-2xl backdrop-blur-md"
				>
					<div class="h-full overflow-auto">
						<Calendar />
					</div>
				</div>

				<!-- AI Chat (right side) -->
				<div
					class="h-full overflow-hidden rounded-lg border border-white/10 bg-gray-900/80 shadow-2xl backdrop-blur-md"
				>
					<Chatbox />
				</div>
			</div>

			<!-- Mobile layout: stacked with tab system -->
			<div class="flex h-full flex-col sm:hidden">
				<!-- Calendar view (conditionally shown based on activeTab) -->
				{#if activeTab === 'calendar'}
					<div
						class="flex-grow overflow-hidden rounded-lg border border-white/10 bg-gray-900/80 shadow-2xl backdrop-blur-md"
					>
						<div class="h-full overflow-auto">
							<Calendar />
						</div>
					</div>
				{/if}

				<!-- Chat view (conditionally shown based on activeTab) -->
				{#if activeTab === 'chat'}
					<div
						class="flex-grow overflow-hidden rounded-lg border border-white/10 bg-gray-900/80 shadow-2xl backdrop-blur-md"
					>
						<Chatbox />
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>
