<script>
    import Calendar from "$lib/components/calendar.svelte";
    import Chatbox from "$lib/components/chatbox.svelte";
</script>

<!-- App container with gradient background -->
<div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
    <div class="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <!-- App header -->
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center space-x-2">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span class="text-white font-bold text-xl">T</span>
                </div>
                <span class="text-white text-xl font-bold">TemporalAI</span>
            </div>

            <div class="flex items-center space-x-4">
                <button class="text-white/70 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                    <span class="text-white font-bold text-sm">JD</span>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <!-- Calendar (left side) -->
            <div class="lg:col-span-2 bg-white rounded-xl shadow-xl overflow-hidden">
                <div class="p-6">
                    <Calendar />
                </div>
            </div>

            <!-- AI Chat (right side) -->
            <div class="bg-white rounded-xl shadow-xl overflow-hidden h-[700px]">
                <Chatbox />
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center text-gray-400 text-sm mt-10">
            <p>© 2023 TemporalAI. All rights reserved.</p>
        </div>
    </div>
</div>