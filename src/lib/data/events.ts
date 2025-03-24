import type { CalendarEvent } from '$lib/core/types/calendar.js';

// This would typically come from an API
export function getInitialEvents(year: number, month: number): CalendarEvent[] {
	return [
		{
			id: 1,
			title: 'Team Meeting',
			start: new Date(year, month, 5, 10, 0),
			end: new Date(year, month, 5, 11, 30),
			color: 'blue'
		},
		{
			id: 2,
			title: 'Product Demo',
			start: new Date(year, month, 12, 14, 0),
			end: new Date(year, month, 12, 15, 0),
			color: 'purple'
		},
		{
			id: 3,
			title: 'Client Call',
			start: new Date(year, month, 18, 9, 0),
			end: new Date(year, month, 18, 10, 0),
			color: 'green'
		},
		{
			id: 4,
			title: 'Out of office',
			start: new Date(year, month, 18, 7, 0),
			end: new Date(year, month, 18, 12, 0),
			color: 'purple'
		},
		{
			id: 5,
			title: 'Important Meeting',
			start: new Date(year, month, 18, 9, 45),
			end: new Date(year, month, 18, 11, 0),
			color: 'blue'
		},
		{
			id: 6,
			title: 'This is a really long title that will wrap maybe not?',
			start: new Date(year, month, 18, 9, 0),
			end: new Date(year, month, 18, 10, 0),
			color: 'red'
		}
	];
}
