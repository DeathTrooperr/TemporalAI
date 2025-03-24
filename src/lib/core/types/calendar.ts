export type CalendarViewType = 'month' | 'week' | 'day';

export interface CalendarEvent {
	id: number;
	title: string;
	start: Date;
	end: Date;
	color: string;
}
