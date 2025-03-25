<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { GoogleCalendarEvent } from '$lib/core/interfaces/calendarInterfaces.js';

	import CalendarHeader from '$lib/components/app/calendar/calendarHeader.svelte';
	import MonthView from '$lib/components/app/calendar/monthView.svelte';
	import WeekView from '$lib/components/app/calendar/weekView.svelte';
	import DayView from '$lib/components/app/calendar/dayView.svelte';
	import { calendarStore } from '../../stores/calendarStore.js';

	$: view = $calendarStore.currentView;
	$: date = $calendarStore.currentDate;
	$: year = $calendarStore.currentYear;
	$: events = $calendarStore.events;

	let eventInterval: NodeJS.Timeout;

	async function refreshEvents() {
		try {
			const response = await fetch(`/api/calendar/?year:${year}`);
			if (response.ok) {
				events = await response.json();
				console.log(events);
			}
		} catch (error) {
			console.error('Failed to fetch events:', error);
		}
	}

	onMount(() => {
		refreshEvents();
		eventInterval = setInterval(refreshEvents, 1000 * 60);
	});

	onDestroy(() => clearInterval(eventInterval));
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
