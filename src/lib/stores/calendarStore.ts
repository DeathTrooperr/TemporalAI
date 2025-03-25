import { writable, derived, get } from 'svelte/store';
import type { CalendarViewType } from '$lib/core/types/calendar.js';
import type { GoogleCalendarEvent } from '$lib/core/interfaces/calendarInterfaces.js';
import { DateTime } from 'luxon';

// Calendar state
const createCalendarStore = () => {
	const today = new Date();
	const currentDate = writable<Date>(today);
	const currentView = writable<CalendarViewType>('month');
	const selectedDate = writable<Date>(today);
	const isLoading = writable<boolean>(false);
	const error = writable<string | null>(null);
	const events = writable<GoogleCalendarEvent[]>([]);

	// Derived stores
	const currentMonth = derived(currentDate, ($date) => $date.getMonth());
	const currentYear = derived(currentDate, ($date) => $date.getFullYear());

	// Format the selected date using luxon
	const formattedSelectedDate = derived(selectedDate, ($date) => {
		const luxonDate = DateTime.fromJSDate($date);
		return {
			full: luxonDate.toFormat('EEEE, MMMM d, yyyy'),
			short: luxonDate.toFormat('MMM d, yyyy'),
			day: luxonDate.toFormat('d'),
			weekday: luxonDate.toFormat('EEEE'),
			month: luxonDate.toFormat('MMMM'),
			year: luxonDate.toFormat('yyyy')
		};
	});

	// Create a combined store to track all state
	const { subscribe } = derived(
		[
			currentDate,
			currentView,
			selectedDate,
			currentMonth,
			currentYear,
			isLoading,
			error,
			formattedSelectedDate,
			events
		],
		([
			$currentDate,
			$currentView,
			$selectedDate,
			$currentMonth,
			$currentYear,
			$isLoading,
			$error,
			$formattedSelectedDate,
			$events
		]) => {
			return {
				currentDate: $currentDate,
				currentView: $currentView,
				selectedDate: $selectedDate,
				currentMonth: $currentMonth,
				currentYear: $currentYear,
				isLoading: $isLoading,
				error: $error,
				formattedDate: $formattedSelectedDate,
				isToday: DateTime.fromJSDate($selectedDate).hasSame(DateTime.now(), 'day'),
				events: $events
			};
		}
	);

	// Navigation functions
	function getPreviousMonth(): void {
		currentDate.update((date) => {
			const newDate = new Date(date);
			newDate.setMonth(newDate.getMonth() - 1);
			return newDate;
		});
	}

	function getNextMonth(): void {
		currentDate.update((date) => {
			const newDate = new Date(date);
			newDate.setMonth(newDate.getMonth() + 1);
			return newDate;
		});
	}

	function getPreviousWeek(): void {
		currentDate.update((date) => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() - 7);
			return newDate;
		});
	}

	function getNextWeek(): void {
		currentDate.update((date) => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + 7);
			return newDate;
		});
	}

	function getPreviousDay(): void {
		currentDate.update((date) => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() - 1);
			return newDate;
		});
	}

	function getNextDay(): void {
		currentDate.update((date) => {
			const newDate = new Date(date);
			newDate.setDate(newDate.getDate() + 1);
			return newDate;
		});
	}

	function goToToday(): void {
		const today = new Date();
		currentDate.set(today);
		selectedDate.set(today);
	}

	function changeView(view: CalendarViewType): void {
		currentView.set(view);
	}

	function selectDate(day: number): void {
		currentDate.update((date) => {
			const newDate = new Date(date);
			newDate.setDate(day);
			selectedDate.set(newDate);
			return date;
		});
	}

	// Select a specific date
	function setSelectedDate(date: Date): void {
		selectedDate.set(date);
		currentDate.set(date);
	}

	// Go to a specific year and month
	function navigateToYearMonth(year: number, month: number): void {
		currentDate.update((date) => {
			const newDate = new Date(date);
			newDate.setFullYear(year);
			newDate.setMonth(month);
			return newDate;
		});
	}

	// Set loading state
	function setLoading(state: boolean): void {
		isLoading.set(state);
	}

	// Set error state
	function setError(message: string | null): void {
		error.set(message);
	}

	// Set new events
	function updateEvents(newEvents: GoogleCalendarEvent[]) {
		events.set(newEvents);
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
		selectDate,
		setSelectedDate,
		navigateToYearMonth,
		setLoading,
		setError,
		updateEvents,
		getCurrentState: () => get({ subscribe })
	};
};

export const calendarStore = createCalendarStore();
