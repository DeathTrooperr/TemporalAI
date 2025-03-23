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
        const height = Math.max(((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 64, 16);

        // Container events take full width, others share the available space
        let width, left;

        if (isContainer) {
            width = '100%';
            left = '0%';
        } else {
            // Regular events divide the space
            const totalColumns = maxColumn;
            width = `${95 / totalColumns}%`;
            left = `${(column - 1) * (95 / totalColumns) + 2.5}%`;
        }

        return `top: ${top}px; height: ${height}px; left: ${left}; width: ${width}; background-color: ${event.color || '#3b82f6'};`;
    }

    // Process events for each day of the week
    $: dayProcessedEvents = Array.from({ length: 7 }, (_, dayOffset) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + dayOffset);
        const dayEvents = getEventsForDate(events, dayDate);
        return processEvents(dayEvents);
    });
</script>

<div class="week-view overflow-hidden h-full">
    <div class="grid grid-cols-8 h-full">
        <!-- Time column -->
        <div class="bg-gray-900 border-r border-gray-800 h-full">
            <div class="h-16"></div> <!-- Header spacer -->
            {#each Array.from({ length: 24 }, (_, i) => i) as hour}
                <div class="h-16 relative">
                    <div class="absolute top-[-9px] right-2 text-xs text-gray-500">
                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>
                </div>
            {/each}
        </div>

        <!-- Days of the week -->
        {#each Array.from({ length: 7 }, (_, i) => i) as dayOffset}
            {@const dayDate = new Date(startOfWeek)}
            {@const _ = dayDate.setDate(startOfWeek.getDate() + dayOffset)}
            {@const isCurrentDay = dayDate.getDate() === new Date().getDate() &&
            dayDate.getMonth() === new Date().getMonth() &&
            dayDate.getFullYear() === new Date().getFullYear()}
            {@const processedDayEvents = dayProcessedEvents[dayOffset]}

            <div class="day-column border-r border-gray-800">
                <!-- Day header -->
                <div class="h-16 flex items-center justify-center bg-gray-900 border-b border-gray-800
                    {isCurrentDay ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 font-bold' : 'text-gray-300 font-medium'}">
                    {getDayName(dayDate.getDay())} {dayDate.getDate()}
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
                                class="absolute rounded-md p-1 overflow-hidden text-white {eventData.isContainer ? 'opacity-80' : ''}"
                                style={getEventStyle(eventData)}
                        >
                            <div class="text-xs font-medium truncate">{event.title}</div>
                            <div class="text-xs opacity-90 truncate">
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