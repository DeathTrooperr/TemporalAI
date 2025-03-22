<script lang="ts">

    // Type definitions
    type CalendarViewType = 'month' | 'week' | 'day';

    interface CalendarEvent {
        id: number;
        title: string;
        start: Date;
        end: Date;
        color: string;
    }

    // Calendar state
    let currentView: CalendarViewType = 'month';
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = new Date();

    // Example events - in a real app, these would come from an API or store
    let events: CalendarEvent[] = [
        {
            id: 1,
            title: 'Team Meeting',
            start: new Date(currentYear, currentMonth, 5, 10, 0),
            end: new Date(currentYear, currentMonth, 5, 11, 30),
            color: 'blue'
        },
        {
            id: 2,
            title: 'Product Demo',
            start: new Date(currentYear, currentMonth, 12, 14, 0),
            end: new Date(currentYear, currentMonth, 12, 15, 0),
            color: 'purple'
        },
        {
            id: 3,
            title: 'Client Call',
            start: new Date(currentYear, currentMonth, 18, 9, 0),
            end: new Date(currentYear, currentMonth, 18, 10, 0),
            color: 'green'
        }
    ];

    // Calendar functions
    function getDaysInMonth(year: number, month: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(year: number, month: number): number {
        return new Date(year, month, 1).getDay();
    }

    function getPreviousMonth(): void {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        currentDate = new Date(currentYear, currentMonth, 1);
    }

    function getNextMonth(): void {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        currentDate = new Date(currentYear, currentMonth, 1);
    }

    function getPreviousWeek(): void {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        currentDate = newDate;
        currentMonth = currentDate.getMonth();
        currentYear = currentDate.getFullYear();
    }

    function getNextWeek(): void {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        currentDate = newDate;
        currentMonth = currentDate.getMonth();
        currentYear = currentDate.getFullYear();
    }

    function getPreviousDay(): void {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        currentDate = newDate;
        currentMonth = currentDate.getMonth();
        currentYear = currentDate.getFullYear();
    }

    function getNextDay(): void {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        currentDate = newDate;
        currentMonth = currentDate.getMonth();
        currentYear = currentDate.getFullYear();
    }

    function changeView(view: CalendarViewType): void {
        currentView = view;
    }

    function selectDate(day: number): void {
        selectedDate = new Date(currentYear, currentMonth, day);
        // In a real app, you might want to switch to day view when selecting a date
        // currentView = 'day';
    }

    function getMonthName(month: number): string {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return monthNames[month];
    }

    function getDayName(dayIndex: number): string {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames[dayIndex];
    }

    function getEventsForDate(date: Date): CalendarEvent[] {
        return events.filter(event =>
            event.start.getDate() === date.getDate() &&
            event.start.getMonth() === date.getMonth() &&
            event.start.getFullYear() === date.getFullYear()
        );
    }

    function formatTime(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function getHoursArray(): number[] {
        const hours: number[] = [];
        for (let i = 0; i < 24; i++) {
            hours.push(i);
        }
        return hours;
    }

    function getWeekDays(date: Date): Date[] {
        const days: Date[] = [];
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }

        return days;
    }
</script>

<div class="calendar-container">
    <!-- Calendar Header -->
    <div class="flex justify-between items-center mb-4">
        <div class="flex items-center space-x-2">
            <h2 class="text-2xl font-bold text-gray-900">
                {#if currentView === 'month'}
                    {getMonthName(currentMonth)} {currentYear}
                {:else if currentView === 'week'}
                    Week of {getWeekDays(currentDate)[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {getWeekDays(currentDate)[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {:else}
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {/if}
            </h2>
        </div>

        <div class="flex items-center space-x-2">
            <button
                    class="p-2 rounded-full hover:bg-gray-100 transition"
                    on:click={() => currentView = 'month'}
                    class:text-blue-600={currentView === 'month'}
                    class:font-medium={currentView === 'month'}>
                Month
            </button>
            <button
                    class="p-2 rounded-full hover:bg-gray-100 transition"
                    on:click={() => currentView = 'week'}
                    class:text-blue-600={currentView === 'week'}
                    class:font-medium={currentView === 'week'}>
                Week
            </button>
            <button
                    class="p-2 rounded-full hover:bg-gray-100 transition"
                    on:click={() => currentView = 'day'}
                    class:text-blue-600={currentView === 'day'}
                    class:font-medium={currentView === 'day'}>
                Day
            </button>
            <div class="border-l h-6 mx-2 border-gray-300"></div>
            <div class="flex items-center space-x-1">
                <button
                        class="p-2 rounded-full hover:bg-gray-100 transition"
                        on:click={() => {
            if (currentView === 'month') getPreviousMonth();
            else if (currentView === 'week') getPreviousWeek();
            else getPreviousDay();
          }}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                        class="p-2 rounded-full hover:bg-gray-100 transition"
                        on:click={() => {
            currentDate = new Date();
            currentMonth = currentDate.getMonth();
            currentYear = currentDate.getFullYear();
          }}>
                    Today
                </button>
                <button
                        class="p-2 rounded-full hover:bg-gray-100 transition"
                        on:click={() => {
            if (currentView === 'month') getNextMonth();
            else if (currentView === 'week') getNextWeek();
            else getNextDay();
          }}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Month View -->
    {#if currentView === 'month'}
        <div class="grid grid-cols-7 text-center text-sm font-semibold text-gray-700 mb-1">
            <div class="py-2">Sun</div>
            <div class="py-2">Mon</div>
            <div class="py-2">Tue</div>
            <div class="py-2">Wed</div>
            <div class="py-2">Thu</div>
            <div class="py-2">Fri</div>
            <div class="py-2">Sat</div>
        </div>

        <div class="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {#each Array(getFirstDayOfMonth(currentYear, currentMonth)) as _, i}
                <div class="bg-gray-50 h-32 p-1"></div>
            {/each}

            {#each Array(getDaysInMonth(currentYear, currentMonth)) as _, i}
                {@const day = i + 1}
                {@const dateObj = new Date(currentYear, currentMonth, day)}
                {@const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear()}
                {@const isSelected = day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear()}
                {@const dayEvents = getEventsForDate(dateObj)}

                <div
                        class="bg-white h-32 p-1 hover:bg-gray-50 transition cursor-pointer"
                        class:border-2={isSelected}
                        class:border-blue-500={isSelected}
                        on:click={() => selectDate(day)}
                >
                    <div class="flex justify-between items-start">
            <span
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm {isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}"
            >
              {day}
            </span>
                    </div>

                    <div class="mt-1 max-h-24 overflow-y-auto">
                        {#each dayEvents as event}
                            <div
                                    class="text-xs px-1 py-0.5 mb-1 rounded truncate bg-{event.color}-100 text-{event.color}-800 border-l-2 border-{event.color}-400"
                            >
                                {formatTime(event.start)} {event.title}
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}

            {#each Array(42 - getDaysInMonth(currentYear, currentMonth) - getFirstDayOfMonth(currentYear, currentMonth)) as _, i}
                {#if i < (6 * 7 - getDaysInMonth(currentYear, currentMonth) - getFirstDayOfMonth(currentYear, currentMonth))}
                    <div class="bg-gray-50 h-32 p-1"></div>
                {/if}
            {/each}
        </div>
    {/if}

    <!-- Week View -->
    {#if currentView === 'week'}
        <div class="grid grid-cols-8 h-600 border border-gray-200 rounded-lg overflow-hidden">
            <!-- Time column -->
            <div class="border-r border-gray-200">
                <div class="h-12 border-b border-gray-200"></div>
                {#each getHoursArray() as hour}
                    <div class="h-14 border-b border-gray-200 text-xs text-gray-500 text-right pr-2">
                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>
                {/each}
            </div>

            <!-- Days -->
            {#each getWeekDays(currentDate) as day, dayIndex}
                {@const isToday = day.toDateString() === new Date().toDateString()}
                <div class="relative">
                    <div class="h-12 border-b border-gray-200 text-center py-3 sticky top-0 bg-white {isToday ? 'bg-blue-50' : ''}">
                        <div class="text-sm font-medium">{getDayName(day.getDay())}</div>
                        <div class="text-xs {isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : 'text-gray-500'}">
                            {day.getDate()}
                        </div>
                    </div>

                    {#each getHoursArray() as hour}
                        <div class="h-14 border-b border-r border-gray-200 {isToday ? 'bg-blue-50' : ''}">
                            {#each events.filter(event => event.start.getDate() === day.getDate() &&
                                event.start.getMonth() === day.getMonth() &&
                                event.start.getFullYear() === day.getFullYear() &&
                                event.start.getHours() === hour) as event}
                                <div
                                        class="absolute ml-1 mr-2 rounded px-1 py-0.5 text-xs bg-{event.color}-100 text-{event.color}-800 border-l-2 border-{event.color}-400 truncate"
                                        style="top: {12 + hour * 14 + (event.start.getMinutes() / 60) * 14}px;
                         left: {(dayIndex + 1) * 12.5}%;
                         width: calc(12.5% - 6px);
                         height: {((event.end - event.start) / 3600000) * 14}px;"
                                >
                                    {formatTime(event.start)} - {event.title}
                                </div>
                            {/each}
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
    {/if}

    <!-- Day View -->
    {#if currentView === 'day'}
        <div class="grid grid-cols-1 h-600 border border-gray-200 rounded-lg overflow-hidden">
            <div class="grid grid-cols-12">
                <!-- Time column -->
                <div class="col-span-1 border-r border-gray-200">
                    {#each getHoursArray() as hour}
                        <div class="h-14 border-b border-gray-200 text-xs text-gray-500 text-right pr-2">
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                    {/each}
                </div>

                <!-- Day column -->
                <div class="col-span-11 relative">
                    {#each getHoursArray() as hour}
                        <div class="h-14 border-b border-gray-200">
                            {#each events.filter(event => event.start.getDate() === currentDate.getDate() &&
                                event.start.getMonth() === currentDate.getMonth() &&
                                event.start.getFullYear() === currentDate.getFullYear() &&
                                event.start.getHours() === hour) as event}
                                <div
                                        class="absolute ml-2 mr-4 rounded px-2 py-1 text-sm bg-{event.color}-100 text-{event.color}-800 border-l-2 border-{event.color}-400"
                                        style="top: {hour * 14 + (event.start.getMinutes() / 60) * 14}px;
                         left: 8.33%;
                         width: calc(91.67% - 8px);
                         height: {((event.end - event.start) / 3600000) * 14}px;"
                                >
                                    <div class="font-medium">{event.title}</div>
                                    <div class="text-xs opacity-75">{formatTime(event.start)} - {formatTime(event.end)}</div>
                                </div>
                            {/each}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .h-600 {
        height: 600px;
        overflow-y: auto;
    }

    /* Hide scrollbar for Chrome, Safari and Opera */
    .h-600::-webkit-scrollbar {
        display: none;
    }

    /* Hide scrollbar for IE, Edge and Firefox */
    .h-600 {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
</style>