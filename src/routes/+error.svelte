<script lang="ts">
    import { page } from '$app/state';

    const appName = "TemporalAI";
    const githubIssues = "https://github.com/DeathTrooperr/TemporalAI/issues";
</script>

<!-- Error Section -->
<header class="min-h-screen w-screen flex justify-center items-center bg-cover bg-center relative">
    <!-- Dark overlay -->
    <div class="absolute inset-0 bg-black/70"></div>

    <!-- Animated gradient elements -->
    <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
    <div class="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style="animation-delay: 1s;"></div>

    <div class="container relative z-10 px-4 mx-auto flex flex-col items-center">
        <!-- App Logo -->
        <div class="flex items-center space-x-2 mb-10">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-2xl">T</span>
            </div>
            <span class="text-white text-2xl font-bold">{appName}</span>
        </div>

        <!-- Error Content -->
        <div class="w-full max-w-4xl text-center">
            <p class="text-xl font-semibold text-blue-400 mb-2">Error {page.status}</p>
            <h1 class="text-5xl md:text-6xl font-extrabold mb-6 text-white">
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                    {#if page.status === 404}
                        Page Not Found
                    {:else if page.status === 403}
                        Access Denied
                    {:else if page.status === 500}
                        Server Error
                    {:else}
                        Something Went Wrong
                    {/if}
                </span>
            </h1>
            <p class="text-xl md:text-2xl mb-10 text-gray-300 max-w-2xl mx-auto">
                {#if page.status === 404}
                    The page you're looking for doesn't exist or has been moved.
                {:else if page.status === 403}
                    You don't have permission to access this resource.
                {:else if page.status === 500}
                    Our servers encountered an error. Please try again later.
                {:else}
                    {page.error?.message || "An unexpected error occurred. Our team has been notified."}
                {/if}
            </p>

            <!-- Simplified Terminal Section -->
            <div class="bg-gray-900 rounded-lg overflow-hidden mb-12 max-w-lg mx-auto shadow-2xl">
                <!-- Terminal Header -->
                <div class="bg-gray-800 px-4 py-2 flex items-center">
                    <div class="flex space-x-2">
                        <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                </div>
                <!-- Terminal Content -->
                <div class="p-4 font-mono text-gray-300 text-left">
                    <div class="flex items-center">
                        <span class="text-red-400 mr-2">$</span>
                        <span>process_aborted</span>
                        <span class="animate-pulse ml-1">|</span>
                    </div>
                </div>
            </div>

            <!-- CTA Buttons -->
            <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center">
                <a href="/" class="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-lg transition transform hover:scale-105">
                    Return to Home
                </a>
                <a href={githubIssues} target="_blank" class="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold rounded-lg transition flex items-center justify-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path>
                    </svg>
                    Report Issue
                </a>
            </div>
        </div>
    </div>
</header>