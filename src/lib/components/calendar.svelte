<script lang="ts">
	import { onMount } from 'svelte';
	import { getInitialEvents } from '../data/events.js';
	import type { CalendarEvent } from '../types/calendar.js';

	import CalendarHeader from './calendar/calendarHeader.svelte';
	import MonthView from './calendar/monthView.svelte';
	import WeekView from './calendar/weekView.svelte';
	import DayView from './calendar/dayView.svelte';
	import { calendarStore } from '../stores/calendarStore.js';

	$: view = $calendarStore.currentView;
	$: date = $calendarStore.currentDate;

	// Events
	let events: CalendarEvent[] = [];

	onMount(() => {
		events = getInitialEvents($calendarStore.currentYear, $calendarStore.currentMonth);
	});
</script>

<div
	class="calendar-container flex h-full flex-col overflow-hidden rounded-lg bg-gray-900 shadow-2xl"
>
	<CalendarHeader />

	<div class="calendar-body relative flex-grow overflow-auto bg-gray-900 p-4">
		{#if $calendarStore.currentView === 'month'}
			<MonthView {events} />
		{:else if $calendarStore.currentView === 'week'}
			<WeekView {events} />
		{:else if $calendarStore.currentView === 'day'}
			<DayView {events} />
		{/if}
	</div>
</div>
