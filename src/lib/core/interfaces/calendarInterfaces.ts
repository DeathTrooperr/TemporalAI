export interface GoogleCalendarEvent {
	id: string;
	summary: string;
	description?: string;
	location?: string;
	start: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	end: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	status: string;
	htmlLink: string;
	created: string;
	updated: string;
	creator: {
		email: string;
		displayName?: string;
	};
	organizer: {
		email: string;
		displayName?: string;
	};
	attendees?: Array<{
		email: string;
		displayName?: string;
		responseStatus?: string;
	}>;
}

export interface GoogleCalendarResponse {
	kind: string;
	etag: string;
	summary: string;
	description: string;
	updated: string;
	timeZone: string;
	accessRole: string;
	items: GoogleCalendarEvent[];
}
