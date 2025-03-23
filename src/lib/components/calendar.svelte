<script lang="ts">
    import { onMount } from 'svelte';
    import { getInitialEvents } from '../data/events.js';
    import type { CalendarEvent } from '../types/calendar.js';

    import CalendarHeader from './calendar/calendarHeader.svelte';
    import MonthView from './calendar/monthView.svelte';
    import WeekView from './calendar/weekView.svelte';
    import DayView from './calendar/dayView.svelte';
    import { calendarStore } from "$lib/stores/calendarStore.js";

    $: view = $calendarStore.currentView;
    $: date = $calendarStore.currentDate;

    // Events
    let events: CalendarEvent[] = [];

    onMount(() => {
        events = getInitialEvents($calendarStore.currentYear, $calendarStore.currentMonth);
    });
</script>

<div class="calendar-container bg-gray-900 rounded-lg shadow-2xl overflow-hidden h-full flex flex-col">
    <CalendarHeader />

    <div class="calendar-body p-4 bg-gray-900 relative flex-grow overflow-auto">
        {#if $calendarStore.currentView === 'month'}
            <MonthView {events} />
        {:else if $calendarStore.currentView === 'week'}
            <WeekView {events} />
        {:else if $calendarStore.currentView === 'day'}
            <DayView {events} />
        {/if}
    </div>
</div>