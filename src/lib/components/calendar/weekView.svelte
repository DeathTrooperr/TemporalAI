<script lang="ts">
	import { calendarStore } from '../../stores/calendarStore.js';
	import {
		getDayName,
		getEventsForDate,
		formatTime,
		getStartOfWeek
	} from '../../utils/dateUtils.js';
	import type { CalendarEvent } from '../../types/calendar.js';

	export let events: CalendarEvent[] = [];

	$: currentDate = $calendarStore.currentDate;
	$: startOfWeek = getStartOfWeek(currentDate);

	// Add these constants at the top of the script
	const MIN_EVENT_WIDTH = 120; // Minimum width in pixels for readable events
	const COLUMN_PADDING = 8; // Padding between events

	function processEvents(events: CalendarEvent[]) {
		// Sort events by start time (earlier first), then by duration (longer first)
		const sortedEvents = [...events].sort((a, b) => {
			const startDiff = a.start.getTime() - b.start.getTime();
			if (startDiff !== 0) return startDiff;

			const durationA = a.end.getTime() - a.start.getTime();
			const durationB = b.end.getTime() - b.start.getTime();
			return durationB - durationA; // Longer events first
		});

		// Track column assignments
		const columns: Map<string, number> = new Map();
		let maxColumn = 0;

		// Group events by their exact start time
		const startTimeGroups = new Map<string, CalendarEvent[]>();

		for (const event of sortedEvents) {
			const startKey = `${event.start.getHours()}:${event.start.getMinutes()}`;
			if (!startTimeGroups.has(startKey)) {
				startTimeGroups.set(startKey, []);
			}
			startTimeGroups.get(startKey)?.push(event);
		}

		// Process each start time group
		for (const [startKey, groupEvents] of startTimeGroups) {
			if (groupEvents.length > 1) {
				// Multiple events at same start time - split horizontally
				groupEvents.forEach((event, index) => {
					columns.set(String(event.id), index);
					maxColumn = Math.max(maxColumn, index);
				});
			} else {
				// Single event at this start time - use full width
				columns.set(String(groupEvents[0].id), 0);
			}
		}

		return sortedEvents.map(event => ({
			event,
			column: columns.get(String(event.id)) || 0,
			maxColumn: startTimeGroups.get(`${event.start.getHours()}:${event.start.getMinutes()}`)?.length || 1
		}));
	}
	function getEventStyle(eventData: {
		event: CalendarEvent;
		column: number;
		maxColumn: number;
	}): string {
		const { event, column, maxColumn } = eventData;
		const startHour = event.start.getHours();
		const startMinute = event.start.getMinutes();
		const endHour = event.end.getHours();
		const endMinute = event.end.getMinutes();

		const top = (startHour + startMinute / 60) * 64;
		const height = Math.max((endHour + endMinute / 60 - (startHour + startMinute / 60)) * 64, 32);

		let width: string;
		let left: string;

		// yo, fuck this alignment

		if (maxColumn === 1) {
			// No overlapping events - use full width
			width = '100%';
			left = '0%';
		} else {
			// Has overlapping events - split into columns
			const columnWidth = 100 / (maxColumn);
			width = `${columnWidth}%`;
			left = `${column * columnWidth}%`;
		}

		return `
			position: absolute;
			top: ${top}px;
			height: ${height}px;
			left: ${left};
			width: ${width};
			background-color: ${event.color || '#3b82f6'};
			opacity: 0.9;
			z-index: 10;
		`;
	}

	// Process events for each day of the week
	$: dayProcessedEvents = Array.from({ length: 7 }, (_, dayOffset) => {
		const dayDate = new Date(startOfWeek.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
		const dayEvents = getEventsForDate(events, dayDate);
		return processEvents(dayEvents);
	});
</script>

<div class="week-view h-full overflow-hidden">
	<div class="grid h-full grid-cols-8">
		<!-- Time column -->
		<div class="h-full border-r border-gray-800 bg-gray-900">
			<div class="h-16"></div>
			<!-- Header spacer -->
			{#each Array.from({ length: 24 }, (_, i) => i) as hour}
				<div class="relative h-16">
					<div class="absolute top-[-9px] right-2 text-xs text-gray-500">
						{hour === 0
							? '12 AM'
							: hour < 12
								? `${hour} AM`
								: hour === 12
									? '12 PM'
									: `${hour - 12} PM`}
					</div>
				</div>
			{/each}
		</div>

		<!-- Days of the week -->
		{#each Array.from({ length: 7 }, (_, i) => i) as dayOffset}
			{@const dayDate = new Date(startOfWeek.getTime() + (dayOffset * 24 * 60 * 60 * 1000))}
			{@const isCurrentDay =
			dayDate.getDate() === new Date().getDate() &&
			dayDate.getMonth() === new Date().getMonth() &&
			dayDate.getFullYear() === new Date().getFullYear()}
			{@const processedDayEvents = dayProcessedEvents[dayOffset]}

			<div class="day-column border-r border-gray-800">
				<!-- Day header -->
				<div
					class="flex h-16 items-center justify-center border-b border-gray-800 bg-gray-900
                    {isCurrentDay
						? 'bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text font-bold text-transparent'
						: 'font-medium text-gray-300'}"
				>
					{getDayName(dayDate.getDay())}
					{dayDate.getDate()}
				</div>

				<!-- Hours -->
				<div class="relative">
					{#each Array.from({ length: 24 }, (_, i) => i) as hour}
						<div class="h-16 border-t border-gray-800"></div>
					{/each}

					<!-- Events for this day -->
					{#each processedDayEvents as eventData}
						{@const event = eventData.event}
						<div
							class="absolute overflow-hidden rounded-md p-1 text-white"
							style={getEventStyle(eventData)}
						>
							<div class="truncate text-xs font-medium">{event.title}</div>
							<div class="truncate text-xs opacity-90">
								{formatTime(event.start)} - {formatTime(event.end)}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
    .week-view {
        min-height: 1536px; /* 24 hours × 64px */
    }

    .day-column {
        min-width: 120px;
    }
</style>
