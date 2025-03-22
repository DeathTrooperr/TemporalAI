<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { onMount } from "svelte";

    // State variables
    let currentDate: Date = new Date();
    let monthDropdownOpen = false;
    let mobileMenuOpen = false;

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    // Define a simple event type (now with a unique id) and some dummy events
    type Event = {
        id: number;
        title: string;
        date: string; // in YYYY-MM-DD format
        time?: string;
    };

    let events: Event[] = [
        { id: 1, title: "Design review", date: "2022-01-03", time: "10:00" },
        { id: 2, title: "Sales meeting", date: "2022-01-03", time: "14:00" },
        { id: 3, title: "Date night", date: "2022-01-07", time: "18:00" },
        { id: 4, title: "Sam's birthday party", date: "2022-01-12", time: "14:00" },
        { id: 5, title: "Maple syrup museum", date: "2022-01-22", time: "15:00" },
        { id: 6, title: "Hockey game", date: "2022-01-22", time: "19:00" },
        { id: 7, title: "Cinema with friends", date: "2022-02-04", time: "21:00" }
    ];

    // Define a type for each calendar cell
    type Day = {
        date: Date;
        isCurrentMonth: boolean;
        events: Event[];
    };

    let calendar: Day[] = [];

    // Generate a 6-week grid of days (42 days) for the current month view.
    function generateCalendar(date: Date) {
        calendar = [];
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        // Using the JS getDay() value (0 = Sunday, 6 = Saturday)
        const startDay = firstDayOfMonth.getDay();
        // Calculate the starting date for the grid (may be from the previous month)
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(firstDayOfMonth.getDate() - startDay);

        // Fill 42 days (6 rows * 7 days)
        for (let i = 0; i < 42; i++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + i);
            // Match events by comparing the date string in ISO format (YYYY-MM-DD)
            const dayStr = dayDate.toISOString().split("T")[0];
            const dayEvents = events.filter((e) => e.date === dayStr);
            calendar.push({
                date: dayDate,
                isCurrentMonth: dayDate.getMonth() === month,
                events: dayEvents
            });
        }
    }

    // Regenerate the calendar whenever currentDate changes.
    $: generateCalendar(currentDate);

    function previousMonth() {
        currentDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 1,
            1
        );
    }

    function nextMonth() {
        currentDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            1
        );
    }

    function goToToday() {
        currentDate = new Date();
    }
</script>

<!-- Calendar header and navigation -->
<div class="lg:flex lg:h-full lg:flex-col">
    <div class="flex items-center justify-between border-b border-gray-200 px-0 py-4 pt-0 lg:flex-none">
        <h1 class="text-base font-semibold text-gray-900">
            <time datetime={currentDate.toISOString()}>
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </time>
        </h1>
        <div class="flex items-center">
            <div class="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
                <button
                        on:click={previousMonth}
                        type="button"
                        class="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
                >
                    <span class="sr-only">Previous month</span>
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                                fill-rule="evenodd"
                                d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                                clip-rule="evenodd"
                        />
                    </svg>
                </button>
                <button
                        on:click={goToToday}
                        type="button"
                        class="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"
                >
                    Today
                </button>
                <span class="relative -mx-px h-5 w-px bg-gray-300 md:hidden"></span>
                <button
                        on:click={nextMonth}
                        type="button"
                        class="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
                >
                    <span class="sr-only">Next month</span>
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                                fill-rule="evenodd"
                                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                                clip-rule="evenodd"
                        />
                    </svg>
                </button>
            </div>
            <!-- Desktop dropdown for view mode -->
            <div class="hidden md:ml-4 md:flex md:items-center">
                <div class="relative">
                    <button
                            on:click={() => (monthDropdownOpen = !monthDropdownOpen)}
                            type="button"
                            class="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            id="menu-button"
                            aria-expanded={monthDropdownOpen}
                            aria-haspopup="true"
                    >
                        Month view
                        <svg class="-mr-1 w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path
                                    fill-rule="evenodd"
                                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                                    clip-rule="evenodd"
                            />
                        </svg>
                    </button>
                    {#if monthDropdownOpen}
                        <div
                                in:scale={{ duration: 100 }}
                                out:scale={{ duration: 75 }}
                                class="absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="menu-button"
                        >
                            <div class="py-1" role="none">
                                <a href="/" class="block px-4 py-2 text-sm text-gray-700" role="menuitem">Day view</a>
                                <a href="/" class="block px-4 py-2 text-sm text-gray-700" role="menuitem">Week view</a>
                                <a href="/" class="block px-4 py-2 text-sm text-gray-700" role="menuitem">Month view</a>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
            <!-- Mobile dropdown menu -->
            <div class="relative ml-6 md:hidden">
                <button
                        on:click={() => (mobileMenuOpen = !mobileMenuOpen)}
                        type="button"
                        class="-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500"
                        id="menu-0-button"
                        aria-expanded={mobileMenuOpen}
                        aria-haspopup="true"
                >
                    <span class="sr-only">Open menu</span>
                    <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                                d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
                        />
                    </svg>
                </button>
                {#if mobileMenuOpen}
                    <div
                            in:scale={{ duration: 100 }}
                            out:scale={{ duration: 75 }}
                            class="absolute right-0 z-10 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="menu-0-button"
                    >
                        <div class="py-1" role="none">
                            <a href="/" class="block px-4 py-2 text-sm text-gray-700" role="menuitem">Create event</a>
                        </div>
                        <div class="py-1" role="none">
                            <a href="/" class="block px-4 py-2 text-sm text-gray-700" role="menuitem">Go to today</a>
                        </div>
                        <div class="py-1" role="none">
                            <a href="/" class="block px-4 py-2 text-sm text-gray-700" role="menuitem">Day view</a>
                            <a href="/" class="block px-4 py-2 text-sm text-gray-700" role="menuitem">Week view</a>
                            <a href="/" class="block px-4 py-2 text-sm text-gray-700" role="menuitem">Month view</a>
                            <a href="/" class="block px-4 py-2 text-sm text-gray-700" role="menuitem">Year view</a>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Calendar grid -->
    <div class="shadow ring-1 ring-black/5 lg:flex lg:flex-auto lg:flex-col">
        <!-- Weekday headers -->
        <div class="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs font-semibold text-gray-700 lg:flex-none">
            <div class="flex justify-center bg-white py-2"><span>S</span></div>
            <div class="flex justify-center bg-white py-2"><span>M</span></div>
            <div class="flex justify-center bg-white py-2"><span>T</span></div>
            <div class="flex justify-center bg-white py-2"><span>W</span></div>
            <div class="flex justify-center bg-white py-2"><span>T</span></div>
            <div class="flex justify-center bg-white py-2"><span>F</span></div>
            <div class="flex justify-center bg-white py-2"><span>S</span></div>
        </div>
        <div class="flex bg-gray-200 text-xs text-gray-700 lg:flex-auto">
            <!-- Desktop view: Grid of days -->
            <div class="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-6 lg:gap-px">
                {#each calendar as day}
                    <div class="relative py-2 px-3 {day.isCurrentMonth ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-500'}">
                        <time datetime={day.date.toISOString()}>{day.date.getDate()}</time>
                        {#if day.events.length > 0}
                            <ol class="mt-2">
                                {#each day.events as event}
                                    <li>
                                        <a href="/" class="group flex">
                                            <p class="flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600">
                                                {event.title}
                                            </p>
                                            {#if event.time}
                                                <time
                                                        datetime={`${day.date.toISOString().split("T")[0]}T${event.time}`}
                                                        class="ml-3 hidden flex-none text-gray-500 group-hover:text-indigo-600 xl:block"
                                                >
                                                    {event.time}
                                                </time>
                                            {/if}
                                        </a>
                                    </li>
                                {/each}
                            </ol>
                        {/if}
                    </div>
                {/each}
            </div>
            <!-- Mobile view: Simplified day buttons -->
            <div class="isolate grid w-full grid-cols-7 grid-rows-6 gap-px lg:hidden">
                {#each calendar as day}
                    <button
                            type="button"
                            class="flex h-14 flex-col py-2 px-3 hover:bg-gray-100 focus:z-10 {day.isCurrentMonth ? 'text-gray-900' : 'text-gray-500'}"
                    >
                        <time datetime={day.date.toISOString()} class="ml-auto">
                            {day.date.getDate()}
                        </time>
                        {#if day.events.length > 0}
                            <span class="sr-only">{day.events.length} events</span>
                            <span class="-mx-0.5 mt-auto flex flex-wrap-reverse">
                {#each day.events as _}
                  <span class="mx-0.5 mb-1 w-3 h-3 rounded-full bg-gray-400"></span>
                {/each}
              </span>
                        {:else}
                            <span class="sr-only">0 events</span>
                        {/if}
                    </button>
                {/each}
            </div>
        </div>
    </div>

    <!-- Mobile events list -->
    <div class="px-4 py-10 sm:px-6 lg:hidden">
        <ol class="divide-y divide-gray-100 overflow-hidden rounded-lg bg-white text-sm shadow ring-1 ring-black/5">
            {#each events as event (event.id)}
                <li class="group flex p-4 pr-6 focus-within:bg-gray-50 hover:bg-gray-50">
                    <div class="flex-auto">
                        <p class="font-semibold text-gray-900">{event.title}</p>
                        <time
                                datetime={`${event.date}T${event.time}`}
                                class="mt-2 flex items-center text-gray-700"
                        >
                            <svg class="mr-2 w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path
                                        fill-rule="evenodd"
                                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                                        clip-rule="evenodd"
                                />
                            </svg>
                            {event.time}
                        </time>
                    </div>
                    <a
                            href="/"
                            class="ml-6 flex-none self-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 opacity-0 shadow-sm ring-1 ring-inset ring-gray-300 hover:ring-gray-400 focus:opacity-100 group-hover:opacity-100"
                    >
                        Edit<span class="sr-only">, {event.title}</span>
                    </a>
                </li>
            {/each}
        </ol>
    </div>
</div>