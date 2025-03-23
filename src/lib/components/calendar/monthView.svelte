<script lang="ts">
    import { calendarStore } from '../../stores/calendarStore.js';
    import { 
        getDaysInMonth, 
        getFirstDayOfMonth, 
        getDayName, 
        getEventsForDate, 
        isToday, 
        isSelected 
    } from '../../utils/dateUtils.js';
    import { getEventColor } from '../../utils/styleUtils.js';
    import type { CalendarEvent } from '../../types/calendar.js';
    
    export let events: CalendarEvent[] = [];
    
    $: currentDate = $calendarStore.currentDate;
    $: currentMonth = $calendarStore.currentMonth;
    $: currentYear = $calendarStore.currentYear;
    $: selectedDate = $calendarStore.selectedDate;
</script>

<div class="month-view h-full flex flex-col">
    <!-- Day Names -->
    <div class="grid grid-cols-7 mb-2 flex-shrink-0">
        {#each Array.from({ length: 7 }, (_, i) => i) as i}
            <div class="text-center py-2 text-sm font-medium text-gray-400">
                {getDayName(i)}
            </div>
        {/each}
    </div>

    <!-- Calendar Days -->
    <div class="grid grid-cols-7 gap-1 flex-grow">
        <!-- Empty spaces for days before the 1st of the month -->
        {#each Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }, (_, i) => i) as i}
            <div class="p-1 rounded-lg"></div>
        {/each}

        <!-- Actual days -->
        {#each Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => i) as i}
            {@const day = i + 1}
            {@const dateEvents = getEventsForDate(events, new Date(currentYear, currentMonth, day))}
            <div
                    class="day-cell p-1 rounded-lg relative border border-gray-800 hover:border-blue-500/30 transition-all
                    {isToday(day, currentMonth, currentYear) ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20' : ''}
                    {isSelected(day, currentMonth, currentYear, selectedDate) ? 'border-blue-500/50' : ''}"
                    on:click={() => calendarStore.selectDate(day)}
            >
                <!-- Day number -->
                <div class="flex justify-between items-center mb-1">
                    <span class="{isToday(day, currentMonth, currentYear) ?
                        'bg-gradient-to-r from-blue-500 to-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 
                        'text-gray-300'} text-sm">
                        {day}
                    </span>
                </div>

                <!-- Events for this day -->
                <div class="event-list space-y-1 overflow-hidden">
                    {#each dateEvents as event (event.id)}
                        <div
                                class="event text-xs p-1 rounded truncate bg-opacity-20"
                                style={`background-color: ${getEventColor(event.color)}; opacity: 0.8;`}
                        >
                            <span class="font-medium text-white">{event.title}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .day-cell {
        height: 100%;
        min-height: 6rem;
    }

    /* Make day cells taller on smaller screens */
    @media (max-width: 768px) {
        .day-cell {
            min-height: 5rem;
        }
    }
</style>