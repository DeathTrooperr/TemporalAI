import { writable, derived, get } from 'svelte/store';
import type { CalendarViewType } from '../types/calendar.js';
import type { Writable, Readable } from 'svelte/store';

// Calendar state
const createCalendarStore = () => {
    const today = new Date();
    const currentDate = writable<Date>(today);
    const currentView = writable<CalendarViewType>('month');
    const selectedDate = writable<Date>(today);

    // Derived stores
    const currentMonth = derived(currentDate, $date => $date.getMonth());
    const currentYear = derived(currentDate, $date => $date.getFullYear());

    // Create a combined store to track all state
    const { subscribe } = derived(
        [currentDate, currentView, selectedDate, currentMonth, currentYear],
        ([$currentDate, $currentView, $selectedDate, $currentMonth, $currentYear]) => {
            return {
                currentDate: $currentDate,
                currentView: $currentView,
                selectedDate: $selectedDate,
                currentMonth: $currentMonth,
                currentYear: $currentYear
            };
        }
    );

    // Navigation functions
    function getPreviousMonth(): void {
        currentDate.update(date => {
            const newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    }

    function getNextMonth(): void {
        currentDate.update(date => {
            const newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    }

    function getPreviousWeek(): void {
        currentDate.update(date => {
            const newDate = new Date(date);
            newDate.setDate(newDate.getDate() - 7);
            return newDate;
        });
    }

    function getNextWeek(): void {
        currentDate.update(date => {
            const newDate = new Date(date);
            newDate.setDate(newDate.getDate() + 7);
            return newDate;
        });
    }

    function getPreviousDay(): void {
        currentDate.update(date => {
            const newDate = new Date(date);
            newDate.setDate(newDate.getDate() - 1);
            return newDate;
        });
    }

    function getNextDay(): void {
        currentDate.update(date => {
            const newDate = new Date(date);
            newDate.setDate(newDate.getDate() + 1);
            return newDate;
        });
    }

    function goToToday(): void {
        currentDate.set(new Date());
        selectedDate.set(new Date());
    }

    function changeView(view: CalendarViewType): void {
        currentView.set(view);
    }

    function selectDate(day: number): void {
        currentDate.update(date => {
            const newDate = new Date(date);
            newDate.setDate(day);
            selectedDate.set(newDate);
            return date;
        });
    }

    // Return a store object with subscribe method and methods
    return {
        subscribe,
        getPreviousMonth,
        getNextMonth,
        getPreviousWeek,
        getNextWeek,
        getPreviousDay,
        getNextDay,
        goToToday,
        changeView,
        selectDate
    };
};

export const calendarStore = createCalendarStore();