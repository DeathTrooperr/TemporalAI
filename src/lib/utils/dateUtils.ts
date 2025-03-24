import type { CalendarEvent } from '../types/calendar.js';

export function getDaysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
	return new Date(year, month, 1).getDay();
}

export function getMonthName(month: number): string {
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	return monthNames[month];
}

export function getDayName(dayIndex: number): string {
	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return dayNames[dayIndex];
}

export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
	return events.filter(
		(event) =>
			event.start.getFullYear() === date.getFullYear() &&
			event.start.getMonth() === date.getMonth() &&
			event.start.getDate() === date.getDate()
	);
}

export function isToday(day: number, month: number, year: number): boolean {
	const today = new Date();
	return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
}

export function isSelected(day: number, month: number, year: number, selectedDate: Date): boolean {
	return (
		day === selectedDate.getDate() &&
		month === selectedDate.getMonth() &&
		year === selectedDate.getFullYear()
	);
}

export function formatTime(date: Date): string {
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getHeaderText(currentView: string, currentDate: Date): string {
	if (currentView === 'month') {
		return `${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
	} else if (currentView === 'week') {
		const startOfWeek = getStartOfWeek(currentDate);
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(endOfWeek.getDate() + 6);

		if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
			return `${getMonthName(startOfWeek.getMonth())} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
		} else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
			return `${getMonthName(startOfWeek.getMonth())} ${startOfWeek.getDate()} - ${getMonthName(endOfWeek.getMonth())} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
		} else {
			return `${getMonthName(startOfWeek.getMonth())} ${startOfWeek.getDate()}, ${startOfWeek.getFullYear()} - ${getMonthName(endOfWeek.getMonth())} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
		}
	} else {
		return `${getDayName(currentDate.getDay())}, ${getMonthName(currentDate.getMonth())} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
	}
}

export function getStartOfWeek(date: Date): Date {
	const startOfWeek = new Date(date);
	startOfWeek.setDate(date.getDate() - date.getDay());
	return startOfWeek;
}
