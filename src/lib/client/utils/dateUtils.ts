import type { GoogleCalendarEvent } from '$lib/core/interfaces/calendarInterfaces.js';
import { DateTime } from 'luxon';

export function getDaysInMonth(year: number, month: number): number {
	return DateTime.local(year, month + 1).daysInMonth || 30;
}

export function getFirstDayOfMonth(year: number, month: number): number {
	return DateTime.local(year, month + 1, 1).weekday % 7;
}

export function getMonthName(month: number): string {
	return <string>DateTime.local(2000, month + 1).monthLong;
}

export function getDayName(dayIndex: number): string {
	return <string>DateTime.local(2000, 1, 2 + dayIndex).weekdayShort;
}

export function getEventsForDate(events: GoogleCalendarEvent[], date: Date): GoogleCalendarEvent[] {
	const dt = DateTime.fromJSDate(date);
	const dateStr = dt.toISODate();

	return events.filter(
		(event) =>
			event.start.date === dateStr ||
			(event.start.dateTime && DateTime.fromISO(event.start.dateTime).hasSame(dt, 'day'))
	);
}

export function isToday(day: number, month: number, year: number): boolean {
	const now = DateTime.now();
	return day === now.day && month === now.month - 1 && year === now.year;
}

export function isSelected(day: number, month: number, year: number, selectedDate: Date): boolean {
	const dt = DateTime.fromJSDate(selectedDate);
	return day === dt.day && month === dt.month - 1 && year === dt.year;
}

export function formatTime(date: Date): string {
	return DateTime.fromJSDate(date).toFormat('hh:mm a');
}

export function getHeaderText(currentView: string, currentDate: Date): string {
	const dt = DateTime.fromJSDate(currentDate);

	if (currentView === 'month') {
		return `${dt.monthLong} ${dt.year}`;
	} else if (currentView === 'week') {
		const start = DateTime.fromJSDate(getStartOfWeek(currentDate));
		const end = start.plus({ days: 6 });

		if (start.hasSame(end, 'month'))
			return `${start.monthLong} ${start.day} - ${end.day}, ${start.year}`;
		else if (start.hasSame(end, 'year'))
			return `${start.monthLong} ${start.day} - ${end.monthLong} ${end.day}, ${start.year}`;
		else
			return `${start.monthLong} ${start.day}, ${start.year} - ${end.monthLong} ${end.day}, ${end.year}`;
	} else {
		return dt.toFormat('cccc, LLLL d, yyyy');
	}
}

export function getStartOfWeek(date: Date): Date {
	return DateTime.fromJSDate(date).startOf('week').toJSDate();
}
