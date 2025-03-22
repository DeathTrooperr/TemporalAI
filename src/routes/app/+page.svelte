<script>
    import Calendar from "$lib/components/calendar.svelte";
    import Chatbox from "$lib/components/chatbox.svelte";

    // State for the mobile tab toggle
    let activeTab = 'calendar'; // Default to calendar view

    // Function to change the active tab
    function setActiveTab(tab) {
        activeTab = tab;
    }

    // User dropdown menu state
    let userMenuOpen = false;

    // Toggle the user menu
    function toggleUserMenu() {
        userMenuOpen = !userMenuOpen;
    }

    // Close the menu if clicked outside
    function closeUserMenu() {
        userMenuOpen = false;
    }

    // Handle menu actions
    function handleSignOut() {
        // Sign out logic would go here
        alert('Signing out...');
        closeUserMenu();
    }

    function handleRefreshToken() {
        // Token refresh logic would go here
        alert('Refreshing token...');
        closeUserMenu();
    }

    function handleOpenGitHub() {
        // Open the specific GitHub repository in a new tab
        window.open('https://github.com/DeathTrooperr/TemporalAI', '_blank');
        closeUserMenu();
    }
</script>

<!-- App container with background image and overlay -->
<div class="h-screen w-screen bg-cover bg-center relative text-white overflow-hidden flex flex-col"
     style="background-image: url('https://images.unsplash.com/photo-1557264337-e8a93017fe92?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3');"
     on:click|self={closeUserMenu}>
    <!-- Dark overlay -->
    <div class="absolute inset-0 bg-black/70"></div>

    <!-- Animated gradient elements - adjusted for better mobile visibility -->
    <div class="absolute top-1/4 left-1/4 w-32 md:w-64 h-32 md:h-64 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
    <div class="absolute bottom-1/3 right-1/4 w-40 md:w-72 h-40 md:h-72 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style="animation-delay: 1s;"></div>

    <div class="container mx-auto px-3 sm:px-4 relative z-10 flex flex-col h-full" on:click|self={closeUserMenu}>
        <!-- App header with mobile optimization -->
        <header class="py-3 md:py-4">
            <div class="flex justify-between items-center">
                <a href="/" class="flex items-center space-x-2 hover:opacity-90 transition-opacity">
                    <div class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span class="text-white font-bold text-xl md:text-2xl">T</span>
                    </div>
                    <span class="text-white text-xl md:text-2xl font-bold">TemporalAI</span>
                </a>

                <!-- User profile with dropdown - removed the three dots menu -->
                <div class="relative">
                    <button
                            on:click|stopPropagation={toggleUserMenu}
                            class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center hover:opacity-90 transition-opacity focus:ring-2 focus:ring-white/30 focus:outline-none"
                            aria-expanded={userMenuOpen}
                            aria-haspopup="true"
                    >
                        <span class="text-white font-bold text-xs md:text-sm">JD</span>
                    </button>

                    <!-- Dropdown menu -->
                    {#if userMenuOpen}
                        <div
                                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 border border-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                                role="menu"
                                aria-orientation="vertical"
                                on:click|stopPropagation
                        >
                            <div class="px-4 py-3 border-b border-gray-700">
                                <p class="text-sm">Signed in as</p>
                                <p class="text-sm font-medium truncate">user@example.com</p>
                            </div>

                            <button
                                    class="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
                                    role="menuitem"
                                    on:click={handleRefreshToken}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Refresh Token</span>
                            </button>

                            <button
                                    class="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center space-x-2"
                                    role="menuitem"
                                    on:click={handleOpenGitHub}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.022.8-.223 1.654-.333 2.504-.337.85.004 1.705.114 2.504.337 1.909-1.291 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" clip-rule="evenodd" />
                                </svg>
                                <span>TemporalAI Repo</span>
                            </button>

                            <div class="border-t border-gray-700">
                                <button
                                        class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                                        role="menuitem"
                                        on:click={handleSignOut}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
        <main class="flex-grow py-2 md:py-4 overflow-hidden flex flex-col">
            <!-- Tab navigation for mobile -->
            <div class="md:hidden flex mb-2 space-x-2">
                <button
                        class="flex-1 py-2 text-center font-medium rounded-lg border transition-all duration-200 {activeTab === 'calendar'
                        ? 'bg-gray-900/80 border-white/10 text-white'
                        : 'bg-gray-900/40 border-white/5 text-gray-300'}"
                        on:click={() => setActiveTab('calendar')}
                >
                    Calendar
                </button>
                <button
                        class="flex-1 py-2 text-center font-medium rounded-lg border transition-all duration-200 {activeTab === 'chat'
                        ? 'bg-gray-900/80 border-white/10 text-white'
                        : 'bg-gray-900/40 border-white/5 text-gray-300'}"
                        on:click={() => setActiveTab('chat')}
                >
                    Chat
                </button>
            </div>

            <!-- Desktop layout: grid -->
            <div class="hidden md:grid md:grid-cols-3 gap-4 md:gap-6 h-full">
                <!-- Calendar (left side) -->
                <div class="col-span-2 bg-gray-900/80 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border border-white/10 h-full">
                    <div class="p-3 md:p-4 h-full overflow-auto">
                        <Calendar />
                    </div>
                </div>

                <!-- AI Chat (right side) -->
                <div class="bg-gray-900/80 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border border-white/10 h-full">
                    <Chatbox />
                </div>
            </div>

            <!-- Mobile layout: stacked with tab system -->
            <div class="md:hidden flex flex-col h-full">
                <!-- Calendar view (conditionally shown based on activeTab) -->
                {#if activeTab === 'calendar'}
                    <div class="flex-grow bg-gray-900/80 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border border-white/10">
                        <div class="p-3 h-full overflow-auto">
                            <Calendar />
                        </div>
                    </div>
                {/if}

                <!-- Chat view (conditionally shown based on activeTab) -->
                {#if activeTab === 'chat'}
                    <div class="flex-grow bg-gray-900/80 backdrop-blur-md rounded-lg shadow-2xl overflow-hidden border border-white/10">
                        <Chatbox />
                    </div>
                {/if}
            </div>
        </main>
    </div>
</div>