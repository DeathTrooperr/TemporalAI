<script lang="ts">
	import { calendarStore } from '../../../stores/calendarStore.js';
	import { getEventsForDate, formatTime } from '$lib/client/utils/dateUtils.js';
	import { createStyleString } from '$lib/client/utils/styleUtils.js';
	import { DateTime } from 'luxon';
	import type { CalendarEvent } from '$lib/core/types/calendar.js';

	export let events: CalendarEvent[] = [];

	// Default height for an event with title and time
	const DEFAULT_EVENT_MIN_HEIGHT = 84; // 64px + 20px extra
	// Hour height in pixels (matches the grid)
	const HOUR_HEIGHT = 64; // px
	// Default width for shifted events (percentage of container)
	const SHIFTED_EVENT_WIDTH = 85; // %
	// Amount to shift each overlapping event (percentage of container)
	const EVENT_SHIFT_OFFSET = 15; // %
	// Minimum time overlap (in minutes) required to cause a shift
	const MIN_OVERLAP_FOR_SHIFT = 20; // minutes
	// Minimum required content height (title + time) to avoid shifting
	const MIN_CONTENT_HEIGHT = 48; // px
	// Padding inside event cards (px)
	const EVENT_PADDING = 10; // px

	$: currentDate = $calendarStore.currentDate;
	$: dayEvents = getEventsForDate(events, currentDate);
	$: processedEvents = processEvents(dayEvents);

	interface ProcessedEvent {
		event: CalendarEvent;
		normalizedStart: Date;
		normalizedEnd: Date;
		shiftLevel: number;
	}

	function processEvents(events: CalendarEvent[]): ProcessedEvent[] {
		// Convert CalendarEvent to normalized format with JS Date objects
		const normalizedEvents = events.map((event) => {
			const startDateTime = event.start.dateTime
				? DateTime.fromISO(event.start.dateTime).toJSDate()
				: new Date(event.start.date || '');

			const endDateTime = event.end.dateTime
				? DateTime.fromISO(event.end.dateTime).toJSDate()
				: new Date(event.end.date || '');

			return {
				event,
				normalizedStart: startDateTime,
				normalizedEnd: endDateTime,
				shiftLevel: 0
			};
		});

		// Sort events by start time (earlier first)
		normalizedEvents.sort((a, b) => a.normalizedStart.getTime() - b.normalizedStart.getTime());

		// Create an array to track events that significantly overlap and need shifting
		const eventShifts = new Map<string, number>();
		const eventHeights = new Map<string, number>();

		// Initialize all events with no shifting and calculate heights
		for (const eventData of normalizedEvents) {
			eventShifts.set(String(eventData.event.id), 0);

			// Calculate natural height based on event duration
			const durationInHours =
				(eventData.normalizedEnd.getTime() - eventData.normalizedStart.getTime()) /
				(1000 * 60 * 60);
			const naturalHeight = durationInHours * HOUR_HEIGHT;
			eventHeights.set(
				String(eventData.event.id),
				Math.max(naturalHeight, DEFAULT_EVENT_MIN_HEIGHT)
			);
		}

		// Track overlapping groups to manage shift levels
		let currentGroup: ProcessedEvent[] = [];
		let maxShiftInCurrentGroup = 0;

		// Analyze each event's overlap with prior events
		for (let i = 0; i < normalizedEvents.length; i++) {
			const currentEvent = normalizedEvents[i];

			// Remove events from current group that don't overlap with current event
			currentGroup = currentGroup.filter((groupEvent) => {
				const overlaps =
					groupEvent.normalizedEnd.getTime() > currentEvent.normalizedStart.getTime();
				if (!overlaps) {
					maxShiftInCurrentGroup = Math.max(...[...eventShifts.values()]);
				}
				return overlaps;
			});

			// If current event overlaps with any event in current group, increment shift
			if (currentGroup.length > 0) {
				eventShifts.set(String(currentEvent.event.id), currentGroup.length);
			} else {
				// Start new group with no shift
				eventShifts.set(String(currentEvent.event.id), 0);
				maxShiftInCurrentGroup = 0;
			}

			currentGroup.push(currentEvent);
		}

		// Apply shift levels to normalized events
		normalizedEvents.forEach((eventData) => {
			eventData.shiftLevel = eventShifts.get(String(eventData.event.id)) || 0;
		});

		return normalizedEvents;
	}

	function getEventStyle(eventData: ProcessedEvent): string {
		const { event, normalizedStart, normalizedEnd, shiftLevel } = eventData;
		const startHour = normalizedStart.getHours();
		const startMinute = normalizedStart.getMinutes();
		const endHour = normalizedEnd.getHours();
		const endMinute = normalizedEnd.getMinutes();

		// Calculate top position based on time
		const top = (startHour + startMinute / 60) * HOUR_HEIGHT;

		// Calculate height based on event duration
		const durationInHours = (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60;
		const baseHeight = durationInHours * HOUR_HEIGHT;

		// Apply minimum height
		const height = Math.max(baseHeight, DEFAULT_EVENT_MIN_HEIGHT);

		// Calculate width and left position based on shift level
		let width: string;
		let left: string;

		if (shiftLevel === 0) {
			// No shift needed, use full width
			width = '100%';
			left = '0%';
		} else {
			// Needs shifting, use slightly reduced width
			width = `${SHIFTED_EVENT_WIDTH}%`;
			left = `${shiftLevel * EVENT_SHIFT_OFFSET}%`;
		}

		const zIndex = shiftLevel + 2; // Ensure overlapping events have increasing z-index

		return `
			top: ${top}px;
			height: ${height}px;
			background-color: ${event.color};
			width: ${width};
			left: ${left};
			z-index: ${zIndex};
			padding: ${EVENT_PADDING}px;
		`;
	}
</script>

<div class="day-view overflow-auto pt-4">
	<div class="grid grid-cols-[60px_1fr] gap-2">
		<!-- Time column -->
		<div class="time-column sticky left-0 z-10 bg-gray-900">
			{#each Array.from({ length: 24 }, (_, i) => i) as hour}
				<div class="flex h-16 justify-end pr-2 text-xs text-gray-500">
					<div class="relative" style="top: -6px;">
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

		<!-- Schedule column -->
		<div class="schedule-column relative">
			{#each Array.from({ length: 24 }, (_, i) => i) as hour}
				<div class="h-16 border-t border-gray-800"></div>
			{/each}

			<!-- Events handling -->
			{#each processedEvents as eventData (eventData.event.id)}
				<div
					class="absolute overflow-hidden rounded-lg transition-all"
					class:event-card={true}
					style={getEventStyle(eventData)}
				>
					<div class="truncate font-medium text-white">{eventData.event.summary}</div>
					<div class="mt-1 truncate text-xs text-white opacity-80">
						{formatTime(eventData.normalizedStart)} - {formatTime(eventData.normalizedEnd)}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.event-card {
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 1px 2px rgba(0, 0, 0, 0.24);
		box-sizing: border-box;
	}

	.event-card > div {
		line-height: 1.4;
	}
</style>
