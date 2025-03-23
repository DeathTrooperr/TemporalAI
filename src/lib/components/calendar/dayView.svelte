<script lang="ts">
    import { calendarStore } from '../../stores/calendarStore.js';
    import {
        getEventsForDate,
        formatTime
    } from '../../utils/dateUtils.js';
    import { createStyleString } from '../../utils/styleUtils.js';
    import type { CalendarEvent } from '../../types/calendar.js';

    export let events: CalendarEvent[] = [];

    $: currentDate = $calendarStore.currentDate;
    $: dayEvents = getEventsForDate(events, currentDate);
    $: processedEvents = processEvents(dayEvents);

    function processEvents(events: CalendarEvent[]) {
        // Sort events by duration (longest first), then by start time
        const sortedEvents = [...events].sort((a, b) => {
            const durationA = a.end.getTime() - a.start.getTime();
            const durationB = b.end.getTime() - b.start.getTime();
            if (durationB !== durationA) {
                return durationB - durationA; // Longest events first
            }
            return a.start.getTime() - b.start.getTime(); // Earlier events first
        });

        // Track column assignments and processed events
        const columns: Map<CalendarEvent, number> = new Map();
        const columnCount: Map<number, number> = new Map();

        // Process each event to determine its column
        for (const event of sortedEvents) {
            const overlappingEvents = sortedEvents.filter(e =>
                e !== event &&
                event.start < e.end &&
                event.end > e.start
            );

            // Check if this is a "container" event that fully contains other events
            const isContainerEvent = overlappingEvents.some(e =>
                event.start <= e.start && event.end >= e.end
            );

            if (isContainerEvent) {
                // Container events go to column 0 (background)
                columns.set(event, 0);
                columnCount.set(0, (columnCount.get(0) || 0) + 1);
            } else {
                // For partially overlapping events, find first available column
                let column = 1; // Start from column 1 (column 0 is for container events)

                // Find the first available column
                const usedColumns = new Set<number>();
                for (const e of overlappingEvents) {
                    if (columns.has(e)) {
                        usedColumns.add(columns.get(e)!);
                    }
                }

                while (usedColumns.has(column)) {
                    column++;
                }

                columns.set(event, column);
                columnCount.set(column, (columnCount.get(column) || 0) + 1);
            }
        }

        // Calculate max column for positioning
        const maxColumn = Math.max(...Array.from(columns.values()), 0);

        return sortedEvents.map(event => {
            const column = columns.get(event) || 0;
            const isContainer = column === 0;

            return {
                event,
                column,
                isContainer,
                maxColumn
            };
        });
    }

    function getEventStyle(eventData: { event: CalendarEvent, column: number, isContainer: boolean, maxColumn: number }): string {
        const { event, column, isContainer, maxColumn } = eventData;
        const startHour = event.start.getHours();
        const startMinute = event.start.getMinutes();
        const endHour = event.end.getHours();
        const endMinute = event.end.getMinutes();

        const top = (startHour + startMinute / 60) * 64;
        const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 64;

        // Container events take full width, others share the available space
        let width, left;

        if (isContainer) {
            width = '100%';
            left = '0%';
        } else {
            // Regular events divide the space
            const totalColumns = maxColumn;
            width = `${100 / totalColumns}%`;
            left = `${(column - 1) * (100 / totalColumns)}%`;
        }

        return `top: ${top}px; height: ${height}px; background-color: ${event.color}; width: ${width}; left: ${left}; z-index: ${isContainer ? 1 : 2};`;
    }
</script>

<div class="day-view overflow-auto pt-4">
    <div class="grid grid-cols-[60px_1fr] gap-2">
        <!-- Time column -->
        <div class="time-column sticky left-0 bg-gray-900 z-10">
            {#each Array.from({ length: 24 }, (_, i) => i) as hour}
                <div class="h-16 text-gray-500 text-xs flex justify-end pr-2">
                    <div class="relative" style="top: -6px;">
                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
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
                        class="absolute rounded-lg p-2 overflow-hidden"
                        class:opacity-80={eventData.isContainer}
                        style={getEventStyle(eventData)}
                >
                    <div class="text-white font-medium truncate">{eventData.event.title}</div>
                    <div class="text-white text-xs opacity-80 truncate">
                        {formatTime(eventData.event.start)} - {formatTime(eventData.event.end)}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>