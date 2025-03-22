<script>
    import { fade, scale } from 'svelte/transition';

    // Dynamic user data and menu options.
    export let userName = "Tom Cook";
    export let userEmail = "tom@example.com";
    export let userPhoto =
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

    export let profileMenuOptions = [
        { text: "Your Profile", link: "#" },
        { text: "Settings", link: "#" },
        { text: "Sign out", link: "#" }
    ];

    // Reactive state for mobile menu, profile dropdown, and dark mode.
    let mobileMenuOpen = false;
    let profileDropdownOpen = false;
    let darkMode = false;

    function toggleDarkMode() {
        darkMode = !darkMode;
        if (typeof document !== 'undefined') {
            if (darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }
</script>

<header class="bg-indigo-600 pb-24">
    <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <div class="relative flex items-center justify-between py-5">
            <!-- Logo -->
            <div class="shrink-0">
                <a href="#">
                    <span class="sr-only">TemporalAI</span>
                    <img
                            class="h-8 w-auto"
                            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=300"
                            alt="Your Company" />
                </a>
            </div>

            <!-- Desktop controls -->
            <div class="hidden lg:flex lg:items-center">
                <!-- Dark mode toggle -->
                <button
                        on:click={toggleDarkMode}
                        type="button"
                        class="mr-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition">
                    {#if darkMode}
                        <!-- Sun icon: shown in dark mode -->
                        <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <path d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z" fill="#e5de44" data-darkreader-inline-fill="" style="--darkreader-inline-fill: var(--darkreader-background-1c274c, #161f3d);"></path>
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.25C12.4142 1.25 12.75 1.58579 12.75 2V4C12.75 4.41421 12.4142 4.75 12 4.75C11.5858 4.75 11.25 4.41421 11.25 4V2C11.25 1.58579 11.5858 1.25 12 1.25ZM3.66865 3.71609C3.94815 3.41039 4.42255 3.38915 4.72825 3.66865L6.95026 5.70024C7.25596 5.97974 7.2772 6.45413 6.9977 6.75983C6.7182 7.06553 6.2438 7.08677 5.9381 6.80727L3.71609 4.77569C3.41039 4.49619 3.38915 4.02179 3.66865 3.71609ZM20.3314 3.71609C20.6109 4.02179 20.5896 4.49619 20.2839 4.77569L18.0619 6.80727C17.7562 7.08677 17.2818 7.06553 17.0023 6.75983C16.7228 6.45413 16.744 5.97974 17.0497 5.70024L19.2718 3.66865C19.5775 3.38915 20.0518 3.41039 20.3314 3.71609ZM1.25 12C1.25 11.5858 1.58579 11.25 2 11.25H4C4.41421 11.25 4.75 11.5858 4.75 12C4.75 12.4142 4.41421 12.75 4 12.75H2C1.58579 12.75 1.25 12.4142 1.25 12ZM19.25 12C19.25 11.5858 19.5858 11.25 20 11.25H22C22.4142 11.25 22.75 11.5858 22.75 12C22.75 12.4142 22.4142 12.75 22 12.75H20C19.5858 12.75 19.25 12.4142 19.25 12ZM17.0255 17.0252C17.3184 16.7323 17.7933 16.7323 18.0862 17.0252L20.3082 19.2475C20.6011 19.5404 20.601 20.0153 20.3081 20.3082C20.0152 20.6011 19.5403 20.601 19.2475 20.3081L17.0255 18.0858C16.7326 17.7929 16.7326 17.3181 17.0255 17.0252ZM6.97467 17.0253C7.26756 17.3182 7.26756 17.7931 6.97467 18.086L4.75244 20.3082C4.45955 20.6011 3.98468 20.6011 3.69178 20.3082C3.39889 20.0153 3.39889 19.5404 3.69178 19.2476L5.91401 17.0253C6.2069 16.7324 6.68177 16.7324 6.97467 17.0253ZM12 19.25C12.4142 19.25 12.75 19.5858 12.75 20V22C12.75 22.4142 12.4142 22.75 12 22.75C11.5858 22.75 11.25 22.4142 11.25 22V20C11.25 19.5858 11.5858 19.25 12 19.25Z" fill="#e5de44" data-darkreader-inline-fill="" style="--darkreader-inline-fill: var(--darkreader-background-1c274c, #161f3d);"></path>
                            </g>
                        </svg>
                    {:else}
                        <!-- Moon icon: shown in light mode -->
                        <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 11.5373 21.3065 11.4608 21.0672 11.8568C19.9289 13.7406 17.8615 15 15.5 15C11.9101 15 9 12.0899 9 8.5C9 6.13845 10.2594 4.07105 12.1432 2.93276C12.5392 2.69347 12.4627 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#1c375c"></path>
                            </g>
                        </svg>
                    {/if}
                </button>

                <!-- Profile dropdown -->
                <div class="relative">
                    <button
                            type="button"
                            on:click={() => profileDropdownOpen = !profileDropdownOpen}
                            class="relative flex rounded-full bg-white text-sm ring-2 ring-white/20 focus:outline-none focus:ring-white"
                            id="user-menu-button"
                            aria-expanded={profileDropdownOpen}
                            aria-haspopup="true">
                        <span class="sr-only">Open user menu</span>
                        <img class="h-8 w-8 rounded-full" src={userPhoto} alt={userName} />
                    </button>
                    {#if profileDropdownOpen}
                        <div
                                transition:scale={{ duration: 75, start: 0.95 }}
                                class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="user-menu-button">
                            {#each profileMenuOptions as option}
                                <a href={option.link} class="block px-4 py-2 text-sm text-gray-700" role="menuitem">
                                    {option.text}
                                </a>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Mobile menu button -->
            <div class="lg:hidden">
                <button
                        type="button"
                        on:click={() => mobileMenuOpen = !mobileMenuOpen}
                        class="inline-flex items-center justify-center rounded-md bg-transparent p-2 text-indigo-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                        aria-expanded={mobileMenuOpen}>
                    <span class="sr-only">Open main menu</span>
                    {#if !mobileMenuOpen}
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    {:else}
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    {/if}
                </button>
            </div>
        </div>
    </div>

    <!-- Mobile menu panel with user options only -->
    {#if mobileMenuOpen}
        <div transition:fade={{ duration: 150 }} class="lg:hidden">
            <div class="fixed inset-0 z-20 bg-black/25" aria-hidden="true"></div>
        </div>
        <div transition:fade={{ duration: 150 }} class="absolute inset-x-0 top-0 z-30 mx-auto w-full max-w-3xl origin-top transform p-2 transition lg:hidden">
            <div transition:scale={{ duration: 150, start: 0.95 }} class="divide-y divide-gray-200 rounded-lg bg-white shadow-lg ring-1 ring-black/5">
                <div class="pb-4 pt-3">
                    <div class="flex items-center px-5">
                        <div class="shrink-0">
                            <img class="h-10 w-10 rounded-full" src={userPhoto} alt={userName} />
                        </div>
                        <div class="ml-3">
                            <div class="text-base font-medium text-gray-800">{userName}</div>
                            <div class="text-sm font-medium text-gray-500">{userEmail}</div>
                        </div>
                    </div>
                </div>
                <!-- Mobile dark mode toggle -->
                <div class="px-5 py-3">
                    <button
                            on:click={toggleDarkMode}
                            type="button"
                            class="w-full flex items-center justify-center p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition">
                        {#if darkMode}
                            <!-- Sun icon -->
                            <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                <g id="SVGRepo_iconCarrier">
                                    <path d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z" fill="#e5de44" data-darkreader-inline-fill="" style="--darkreader-inline-fill: var(--darkreader-background-1c274c, #161f3d);"></path>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.25C12.4142 1.25 12.75 1.58579 12.75 2V4C12.75 4.41421 12.4142 4.75 12 4.75C11.5858 4.75 11.25 4.41421 11.25 4V2C11.25 1.58579 11.5858 1.25 12 1.25ZM3.66865 3.71609C3.94815 3.41039 4.42255 3.38915 4.72825 3.66865L6.95026 5.70024C7.25596 5.97974 7.2772 6.45413 6.9977 6.75983C6.7182 7.06553 6.2438 7.08677 5.9381 6.80727L3.71609 4.77569C3.41039 4.49619 3.38915 4.02179 3.66865 3.71609ZM20.3314 3.71609C20.6109 4.02179 20.5896 4.49619 20.2839 4.77569L18.0619 6.80727C17.7562 7.08677 17.2818 7.06553 17.0023 6.75983C16.7228 6.45413 16.744 5.97974 17.0497 5.70024L19.2718 3.66865C19.5775 3.38915 20.0518 3.41039 20.3314 3.71609ZM1.25 12C1.25 11.5858 1.58579 11.25 2 11.25H4C4.41421 11.25 4.75 11.5858 4.75 12C4.75 12.4142 4.41421 12.75 4 12.75H2C1.58579 12.75 1.25 12.4142 1.25 12ZM19.25 12C19.25 11.5858 19.5858 11.25 20 11.25H22C22.4142 11.25 22.75 11.5858 22.75 12C22.75 12.4142 22.4142 12.75 22 12.75H20C19.5858 12.75 19.25 12.4142 19.25 12ZM17.0255 17.0252C17.3184 16.7323 17.7933 16.7323 18.0862 17.0252L20.3082 19.2475C20.6011 19.5404 20.601 20.0153 20.3081 20.3082C20.0152 20.6011 19.5403 20.601 19.2475 20.3081L17.0255 18.0858C16.7326 17.7929 16.7326 17.3181 17.0255 17.0252ZM6.97467 17.0253C7.26756 17.3182 7.26756 17.7931 6.97467 18.086L4.75244 20.3082C4.45955 20.6011 3.98468 20.6011 3.69178 20.3082C3.39889 20.0153 3.39889 19.5404 3.69178 19.2476L5.91401 17.0253C6.2069 16.7324 6.68177 16.7324 6.97467 17.0253ZM12 19.25C12.4142 19.25 12.75 19.5858 12.75 20V22C12.75 22.4142 12.4142 22.75 12 22.75C11.5858 22.75 11.25 22.4142 11.25 22V20C11.25 19.5858 11.5858 19.25 12 19.25Z" fill="#e5de44" data-darkreader-inline-fill="" style="--darkreader-inline-fill: var(--darkreader-background-1c274c, #161f3d);"></path>
                                </g>
                            </svg>
                        {/if}
                        <span class="ml-2 text-base font-medium text-gray-900">Toggle Dark Mode</span>
                    </button>
                </div>
                <div class="py-4">
                    {#each profileMenuOptions as option}
                        <a href={option.link} class="block px-5 py-3 text-base font-medium text-gray-900 hover:bg-gray-100">
                            {option.text}
                        </a>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</header>