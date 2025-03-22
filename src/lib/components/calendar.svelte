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
            event.start.getFullYear() === date.getFullYear() &&
            event.start.getMonth() === date.getMonth() &&
            event.start.getDate() === date.getDate()
        );
    }

    function isToday(day: number): boolean {
        const today = new Date();
        return day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
    }

    function isSelected(day: number): boolean {
        return day === selectedDate.getDate() &&
            currentMonth === selectedDate.getMonth() &&
            currentYear === selectedDate.getFullYear();
    }

    function formatTime(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
</script>

<div class="calendar-container bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
    <!-- Calendar Header with gradient border bottom -->
    <div class="calendar-header bg-gray-800 p-4 border-b border-gradient-horizontal">
        <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                {getMonthName(currentMonth)} {currentYear}
            </h2>
            <div class="flex space-x-2">
                <!-- View Selection -->
                <div class="bg-gray-900 rounded-lg p-1 flex space-x-1">
                    <button
                            class="px-3 py-1 rounded-md text-sm transition-all {currentView === 'day' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}"
                            on:click={() => changeView('day')}>
                        Day
                    </button>
                    <button
                            class="px-3 py-1 rounded-md text-sm transition-all {currentView === 'week' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}"
                            on:click={() => changeView('week')}>
                        Week
                    </button>
                    <button
                            class="px-3 py-1 rounded-md text-sm transition-all {currentView === 'month' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-300 hover:bg-white/10'}"
                            on:click={() => changeView('month')}>
                        Month
                    </button>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex space-x-2">
                    {#if currentView === 'month'}
                        <button
                                class="p-2 rounded-lg text-gray-300 hover:bg-white/10 transition-all"
                                on:click={getPreviousMonth}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                                class="p-2 rounded-lg text-gray-300 hover:bg-white/10 transition-all"
                                on:click={getNextMonth}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    {:else if currentView === 'week'}
                        <button
                                class="p-2 rounded-lg text-gray-300 hover:bg-white/10 transition-all"
                                on:click={getPreviousWeek}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                                class="p-2 rounded-lg text-gray-300 hover:bg-white/10 transition-all"
                                on:click={getNextWeek}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    {:else if currentView === 'day'}
                        <button
                                class="p-2 rounded-lg text-gray-300 hover:bg-white/10 transition-all"
                                on:click={getPreviousDay}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                                class="p-2 rounded-lg text-gray-300 hover:bg-white/10 transition-all"
                                on:click={getNextDay}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    {/if}
                </div>

                <!-- Today Button -->
                <button
                        class="px-4 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-all text-sm"
                        on:click={() => {
                        currentDate = new Date();
                        currentMonth = currentDate.getMonth();
                        currentYear = currentDate.getFullYear();
                        selectedDate = new Date();
                    }}>
                    Today
                </button>
            </div>
        </div>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-body p-4 bg-gray-900 relative">
        <!-- Animated gradient elements in background -->
        <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-5 animate-pulse"></div>
        <div class="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl opacity-5 animate-pulse" style="animation-delay: 1s;"></div>

        {#if currentView === 'month'}
            <!-- Month View -->
            <div class="month-view">
                <!-- Day Names -->
                <div class="grid grid-cols-7 mb-2">
                    {#each Array(7) as _, i}
                        <div class="text-center py-2 text-sm font-medium text-gray-400">
                            {getDayName(i)}
                        </div>
                    {/each}
                </div>

                <!-- Calendar Days -->
                <div class="grid grid-cols-7 gap-1">
                    <!-- Empty spaces for days before the 1st of the month -->
                    {#each Array(getFirstDayOfMonth(currentYear, currentMonth)) as _}
                        <div class="h-24 p-1 rounded-lg"></div>
                    {/each}

                    <!-- Actual days -->
                    {#each Array(getDaysInMonth(currentYear, currentMonth)) as _, i}
                        {@const day = i + 1}
                        {@const dateEvents = getEventsForDate(new Date(currentYear, currentMonth, day))}
                        <div
                                class="day-cell h-24 p-1 rounded-lg relative border border-gray-800 hover:border-blue-500/30 transition-all {isToday(day) ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20' : ''} {isSelected(day) ? 'border-blue-500/50' : ''}"
                                on:click={() => selectDate(day)}
                        >
                            <!-- Day number -->
                            <div class="flex justify-between items-center mb-1">
                                <span class="{isToday(day) ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-300'} text-sm">
                                    {day}
                                </span>
                            </div>

                            <!-- Events for this day -->
                            <div class="event-list space-y-1 overflow-hidden">
                                {#each dateEvents as event}
                                    <div
                                            class="event text-xs p-1 rounded truncate bg-opacity-20"
                                            style="background-color: {event.color === 'blue' ? '#3b82f6' : event.color === 'purple' ? '#8b5cf6' : '#10b981'}; opacity: 0.8;"
                                    >
                                        <span class="font-medium text-white">{event.title}</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

        {:else if currentView === 'week'}
            <!-- Week View -->
            <div class="week-view">
                <div class="grid grid-cols-8 gap-2">
                    <!-- Time column -->
                    <div class="time-column">
                        <div class="h-10"></div> <!-- Header spacer -->
                        {#each Array(24) as _, hour}
                            <div class="h-12 text-gray-500 text-xs flex items-center justify-end pr-2">
                                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                            </div>
                        {/each}
                    </div>

                    <!-- Days of the week -->
                    {#each Array(7) as _, dayOffset}
                        {@const currentDayDate = new Date(currentDate)}
                        {@const startOfWeek = new Date(currentDayDate.setDate(currentDayDate.getDate() - currentDayDate.getDay()))}
                        {@const dayDate = new Date(startOfWeek)}
                        {dayDate.setDate(startOfWeek.getDate() + dayOffset)}
                        {@const isCurrentDay = dayDate.getDate() === new Date().getDate() &&
                        dayDate.getMonth() === new Date().getMonth() &&
                        dayDate.getFullYear() === new Date().getFullYear()}

                        <div class="day-column">
                            <!-- Day header -->
                            <div class="h-10 text-center {isCurrentDay ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 font-bold' : 'text-gray-300'}">
                                {getDayName(dayDate.getDay())} {dayDate.getDate()}
                            </div>

                            <!-- Hours -->
                            <div class="hours-container relative">
                                {#each Array(24) as _, hour}
                                    <div class="h-12 border-t border-gray-800"></div>
                                {/each}

                                <!-- Events for this day -->
                                {#each getEventsForDate(dayDate) as event}
                                    {@const startHour = event.start.getHours()}
                                    {@const startMinute = event.start.getMinutes()}
                                    {@const endHour = event.end.getHours()}
                                    {@const endMinute = event.end.getMinutes()}
                                    {@const top = (startHour + startMinute / 60) * 3}
                                    {@const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 3}

                                    <div
                                            class="absolute w-full rounded-md p-1 overflow-hidden"
                                            style="
                                            top: {top}rem;
                                            height: {height}rem;
                                            background-color: {event.color === 'blue' ? '#3b82f6' : event.color === 'purple' ? '#8b5cf6' : '#10b981'};
                                            opacity: 0.8;
                                        "
                                    >
                                        <div class="text-white text-xs font-medium">{event.title}</div>
                                        <div class="text-white text-xs opacity-80">
                                            {formatTime(event.start)} - {formatTime(event.end)}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

        {:else if currentView === 'day'}
            <!-- Day View -->
            <div class="day-view">
                <h3 class="text-center mb-4 text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                    {getDayName(currentDate.getDay())}, {getMonthName(currentDate.getMonth())} {currentDate.getDate()}
                </h3>

                <div class="grid grid-cols-[80px_1fr] gap-4">
                    <!-- Time column -->
                    <div class="time-column">
                        {#each Array(24) as _, hour}
                            <div class="h-16 text-gray-500 text-xs flex items-center justify-end pr-2">
                                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                            </div>
                        {/each}
                    </div>

                    <!-- Schedule column -->
                    <div class="schedule-column relative">
                        {#each Array(24) as _, hour}
                            <div class="h-16 border-t border-gray-800"></div>
                        {/each}

                        <!-- Events for this day -->
                        {#each getEventsForDate(currentDate) as event}
                            {@const startHour = event.start.getHours()}
                            {@const startMinute = event.start.getMinutes()}
                            {@const endHour = event.end.getHours()}
                            {@const endMinute = event.end.getMinutes()}
                            {@const top = (startHour + startMinute / 60) * 4}
                            {@const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 4}

                            <div
                                    class="absolute w-full rounded-lg p-2 overflow-hidden"
                                    style="
                                    top: {top}rem;
                                    height: {height}rem;
                                    background-color: {event.color === 'blue' ? '#3b82f6' : event.color === 'purple' ? '#8b5cf6' : '#10b981'};
                                    opacity: 0.8;
                                "
                            >
                                <div class="text-white font-medium">{event.title}</div>
                                <div class="text-white text-sm opacity-80">
                                    {formatTime(event.start)} - {formatTime(event.end)}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .border-gradient-horizontal {
        border-image: linear-gradient(to right, #3b82f6, #8b5cf6) 1;
    }

    /* Make day cells taller on smaller screens */
    @media (max-width: 768px) {
        .day-cell {
            height: 5rem;
        }
    }
</style>