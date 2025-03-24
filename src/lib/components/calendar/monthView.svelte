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

<div class="month-view flex h-full flex-col">
	<!-- Day Names -->
	<div class="mb-2 grid flex-shrink-0 grid-cols-7">
		{#each Array.from({ length: 7 }, (_, i) => i) as i}
			<div class="py-2 text-center text-sm font-medium text-gray-400">
				{getDayName(i)}
			</div>
		{/each}
	</div>

	<!-- Calendar Days -->
	<div class="grid flex-grow grid-cols-7 gap-1">
		<!-- Empty spaces for days before the 1st of the month -->
		{#each Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }, (_, i) => i) as i}
			<div class="rounded-lg p-1"></div>
		{/each}

		<!-- Actual days -->
		{#each Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => i) as i}
			{@const day = i + 1}
			{@const dateEvents = getEventsForDate(events, new Date(currentYear, currentMonth, day))}
			<div
				class="day-cell relative rounded-lg border border-gray-800 p-1 transition-all hover:border-blue-500/30
                    {isToday(day, currentMonth, currentYear)
					? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20'
					: ''}
                    {isSelected(day, currentMonth, currentYear, selectedDate)
					? 'border-blue-500/50'
					: ''}"
				on:click={() => calendarStore.selectDate(day)}
			>
				<!-- Day number -->
				<div class="mb-1 flex items-center justify-between">
					<span
						class="{isToday(day, currentMonth, currentYear)
							? 'flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white'
							: 'text-gray-300'} text-sm"
					>
						{day}
					</span>
				</div>

				<!-- Events for this day -->
				<div class="event-list space-y-1 overflow-hidden">
					{#each dateEvents as event (event.id)}
						<div
							class="event bg-opacity-20 truncate rounded p-1 text-xs"
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
