<script lang="ts">
    import { calendarStore } from '../../stores/calendarStore.js';
    import { getHeaderText } from '../../utils/dateUtils.js';
    
    $: currentView = $calendarStore.currentView;
    $: currentDate = $calendarStore.currentDate;
    $: headerText = getHeaderText(currentView, currentDate);
</script>

<!-- Calendar Header with gradient border bottom -->
<div class="calendar-header bg-gray-800 p-4 border-b border-gradient-horizontal flex-shrink-0">
    <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            {headerText}
        </h1>
        <div class="flex space-x-2">
            <!-- View Selection -->
            <div class="bg-gray-900 rounded-lg p-1 flex space-x-1">
                <button
                        class="cursor-pointer px-3 py-1 rounded-md text-sm transition-all {currentView === 'day' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}"
                        on:click={() => calendarStore.changeView('day')}>
                    Day
                </button>
                <button
                        class="cursor-pointer px-3 py-1 rounded-md text-sm transition-all {currentView === 'week' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}"
                        on:click={() => calendarStore.changeView('week')}>
                    Week
                </button>
                <button
                        class="cursor-pointer px-3 py-1 rounded-md text-sm transition-all {currentView === 'month' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}"
                        on:click={() => calendarStore.changeView('month')}>
                    Month
                </button>
            </div>

            <!-- Navigation Buttons with Today in between -->
            <div class="flex space-x-2">
                <!-- Left Arrow -->
                <button
                        class="cursor-pointer p-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-all"
                        on:click={() => currentView === 'month' ?
                            calendarStore.getPreviousMonth() : 
                            currentView === 'week' ?
                            calendarStore.getPreviousWeek() : 
                            calendarStore.getPreviousDay()}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <!-- Today Button -->
                <button
                        class="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-all text-sm"
                        on:click={() => calendarStore.goToToday()}>
                    Today
                </button>

                <!-- Right Arrow -->
                <button
                        class="cursor-pointer p-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-all"
                        on:click={() => currentView === 'month' ?
                            calendarStore.getNextMonth() : 
                            currentView === 'week' ?
                            calendarStore.getNextWeek() : 
                            calendarStore.getNextDay()}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .border-gradient-horizontal {
        border-image: linear-gradient(to right, #3b82f6, #8b5cf6) 1;
    }
</style>