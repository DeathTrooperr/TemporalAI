import { json, type RequestEvent } from '@sveltejs/kit';
import { getUserFromCookies } from '$lib/server/utlis/auth.js';
import type { UserSession } from '$lib/core/interfaces/userSession.js';

// Define types for the Google Calendar API response
interface GoogleCalendarEvent {
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

interface GoogleCalendarResponse {
	kind: string;
	etag: string;
	summary: string;
	description: string;
	updated: string;
	timeZone: string;
	accessRole: string;
	items: GoogleCalendarEvent[];
}

interface ErrorResponse {
	error: {
		code: number;
		message: string;
		status: string;
	};
}

// Define user type
interface User {
	token: string;
}

export async function GET({ url, cookies }): Promise<Response> {
	const user: UserSession | null = await getUserFromCookies(cookies);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Get the year from the query parameters, default to current year if not specified
	const year = url.searchParams.get('year') || new Date().getFullYear().toString();
	const yearNum = parseInt(year, 10);

	// Create date ranges for the entire year
	const startDate = new Date(yearNum, 0, 1); // January 1st of the specified year
	const endDate = new Date(yearNum, 11, 31, 23, 59, 59); // December 31st of the specified year

	// Format dates as required by Google Calendar API (ISO string)
	const timeMin = encodeURIComponent(startDate.toISOString());
	const timeMax = encodeURIComponent(endDate.toISOString());

	try {
		// Direct fetch to Google Calendar API
		const response = await fetch(
			`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
			{
				headers: {
					Authorization: `Bearer ${user.token}`,
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.ok) {
			const errorData = (await response.json()) as ErrorResponse;
			throw new Error(errorData.error?.message || 'Failed to fetch calendar events');
		}

		const data = (await response.json()) as GoogleCalendarResponse;
		return json(data.items || []);
	} catch (error) {
		console.error('Error fetching calendar events:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch events' },
			{ status: 500 }
		);
	}
}
