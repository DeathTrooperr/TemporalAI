// src/routes/api/calendar/+server.ts
import { type Cookies, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import OpenAI from 'openai';
import { DateTime } from 'luxon';
import { env } from '$env/dynamic/private';
import { getUserFromCookies } from '$lib/server/auth.js';

const openai = new OpenAI({
	baseURL: 'https://api.studio.nebius.com/v1/',
	apiKey: env.NEBIUS_API_KEY
});

/**
 * Get Google Calendar service using the user's stored token
 */
async function getCalendarService(token: string) {
	try {
		const oAuth2Client = new OAuth2Client();
		oAuth2Client.setCredentials({ access_token: token });
		return new calendar_v3.Calendar({ auth: oAuth2Client });
	} catch (error) {
		console.error('Failed to get calendar service:', error);
		throw new Error('Authentication error with Google Calendar');
	}
}

/**
 * Get structured calendar instruction from Nebius LLM
 */
async function getNebiusLlmResponse(userInput: string) {
	try {
		// Get current date and time
		const now = DateTime.now();
		const currentDate = now.toFormat('yyyy-MM-dd');
		const currentTime = now.toFormat('h:mm a');

		console.log(`Current date: ${currentDate}, Current time: ${currentTime}`);

		// Create system message with date and time
		let systemMessage = `Today's date is ${currentDate} and the time is ${currentTime}.\n`;

		// In a real application, you would read this from a file
		// For now, using a template literal for the system prompt
		systemMessage += `
You are a calendar assistant that extracts key information from user requests to manage calendar events.
Analyze the user's message and extract the following information in JSON format:

{
  "action": "create|reschedule|cancel", // The action the user wants to perform
  "event_title": "Meeting title", // The title/subject of the event
  "date": "YYYY-MM-DD", // The date of the event
  "event_time": "HH:MM AM/PM", // The start time of the event
  "duration": "X hour(s)" or "Y minute(s)", // Duration of event, defaulting to 1 hour for new events
  "location": "Location of meeting", // Optional location information
  "attendees": ["email1@example.com", "email2@example.com"], // Optional list of attendee emails
  "notes": "Additional notes or description", // Optional notes about the event
  "new_time": "HH:MM AM/PM" // Only for reschedule actions, the new time
}

Infer missing data when possible, and ensure all times are in AM/PM format.
`;

		// Send user input and system message to Nebius LLM
		const response = await openai.chat.completions.create({
			model: "meta-llama/Meta-Llama-3.1-70B-Instruct",
			max_tokens: 512,
			temperature: 0.6,
			top_p: 0.9,
			messages: [
				{ role: "system", content: systemMessage },
				{ role: "user", content: userInput }
			]
		});

		// Parse JSON from the response
		const responseContent = response.choices[0].message.content;
		if (!responseContent) {
			throw new Error('Empty response from LLM');
		}

		console.log(`Nebius LLM raw response: ${responseContent}`);

		try {
			// First attempt: Try to parse the entire response as JSON
			return JSON.parse(responseContent);
		} catch (error) {
			console.log("Direct JSON parsing failed. Trying to extract JSON from triple backticks...");

			// Second attempt: Try to extract JSON from markdown code blocks
			const jsonMatch = responseContent.match(/```(?:json)?\n(.*?)\n```/s);
			if (jsonMatch) {
				try {
					return JSON.parse(jsonMatch[1]);
				} catch (e) {
					console.error(`Failed to parse JSON from extracted content: ${e}`);
				}
			}

			throw new Error("Could not parse JSON from LLM response");
		}
	} catch (error) {
		console.error("Error getting LLM response:", error);
		return { error: "Failed to process request with LLM" };
	}
}

/**
 * Detect user's timezone using their IP address
 */
async function detectUserTimezone() {
	try {
		const response = await fetch("http://worldtimeapi.org/api/ip");
		if (response.ok) {
			const data = await response.json();
			return data.timezone || 'Etc/UTC';
		}
		return 'Etc/UTC';
	} catch (error) {
		console.error("Error detecting timezone:", error);
		return 'Etc/UTC';
	}
}

/**
 * Parse duration string into hours and minutes
 */
function parseDuration(durationStr: string): { hours: number, minutes: number } {
	let hours = 0;
	let minutes = 0;

	if (durationStr.includes('hour')) {
		try {
			hours = parseInt(durationStr.split(' ')[0], 10) || 0;
		} catch (e) {
			// Default to 0 if parsing fails
		}
	} else if (durationStr.includes('minute')) {
		try {
			minutes = parseInt(durationStr.split(' ')[0], 10) || 0;
		} catch (e) {
			// Default to 0 if parsing fails
		}
	}

	return { hours, minutes };
}

/**
 * Create a new event in Google Calendar
 */
async function createEvent(calendarService: any, eventData: any) {
	// Detect user's timezone
	const userTimezone = await detectUserTimezone();

	// Parse start datetime
	let startDateTime;
	try {
		// Handle "3:00 PM" format
		if (eventData.event_time.includes(':')) {
			startDateTime = DateTime.fromFormat(
				`${eventData.date} ${eventData.event_time}`,
				'yyyy-MM-dd h:mm a',
				{ zone: userTimezone }
			);
		} else {
			// Handle "3 PM" format
			startDateTime = DateTime.fromFormat(
				`${eventData.date} ${eventData.event_time}`,
				'yyyy-MM-dd h a',
				{ zone: userTimezone }
			);
		}
	} catch (error) {
		console.error('Error parsing date/time:', error);
		throw new Error(`Invalid time format: ${eventData.event_time}`);
	}

	if (!startDateTime.isValid) {
		throw new Error(`Invalid datetime: ${startDateTime.invalidExplanation}`);
	}

	// Calculate end time based on duration
	const { hours, minutes } = parseDuration(eventData.duration || '1 hour');
	const endDateTime = startDateTime.plus({ hours, minutes });

	// Create the event
	const event: {
		summary: string;
		location: string;
		description: string;
		start: {
			dateTime: string;
			timeZone: string;
		};
		end: {
			dateTime: string;
			timeZone: string;
		};
		attendees?: { email: string }[];
	} = {
		summary: eventData.event_title || 'Untitled Event',
		location: eventData.location || '',
		description: eventData.notes || '',
		start: {
			dateTime: startDateTime.toISO(),
			timeZone: userTimezone,
		},
		end: {
			dateTime: endDateTime.toISO(),
			timeZone: userTimezone,
		}
	};

	// Add attendees if provided
	const attendees = eventData.attendees || [];
	if (attendees.length > 0) {
		event.attendees = attendees
			.filter((email: string) => email.includes('@'))
			.map((email: string) => ({ email }));
	}

	// Insert event into calendar
	const response = await calendarService.events.insert({
		calendarId: 'primary',
		requestBody: event
	});

	return response.data.id;
}

/**
 * Find events in Google Calendar matching criteria
 */
async function findMatchingEvents(calendarService: any, title: string, date: string) {
	try {
		// Create start/end time range for the given date (full day)
		const startOfDay = DateTime.fromFormat(date, 'yyyy-MM-dd').startOf('day').toISO();
		const endOfDay = DateTime.fromFormat(date, 'yyyy-MM-dd').endOf('day').toISO();

		// Search for events with matching title within the date range
		const response = await calendarService.events.list({
			calendarId: 'primary',
			timeMin: startOfDay,
			timeMax: endOfDay,
			q: title,
			singleEvents: true,
			orderBy: 'startTime'
		});

		// Filter events by title more strictly if needed
		const matchingEvents = response.data.items.filter((event: any) =>
			event.summary.toLowerCase().includes(title.toLowerCase())
		);

		return { items: matchingEvents };
	} catch (error) {
		console.error('Error finding events:', error);
		throw new Error(`Failed to find events: ${error}`);
	}
}

/**
 * Calculate duration string from event start/end times
 */
function calculateDurationFromEvent(event: any): string {
	const start = DateTime.fromISO(event.start.dateTime);
	const end = DateTime.fromISO(event.end.dateTime);

	const minutes = end.diff(start, 'minutes').minutes;

	if (minutes % 60 === 0) {
		const hours = minutes / 60;
		return `${hours} hour${hours > 1 ? 's' : ''}`;
	} else {
		return `${minutes} minute${minutes > 1 ? 's' : ''}`;
	}
}

/**
 * Reschedule an existing event in Google Calendar
 */
async function rescheduleEvent(calendarService: any, eventData: any) {
	// Find the event to reschedule
	const eventsResult = await findMatchingEvents(
		calendarService,
		eventData.event_title,
		eventData.date
	);

	const items = eventsResult.items || [];
	if (items.length === 0) {
		return { error: "Event not found" };
	}

	// Get the first matching event
	const event = items[0];
	const eventId = event.id;

	// Set up new datetime values
	const userTimezone = await detectUserTimezone();
	const timeToUse = eventData.new_time || eventData.event_time;

	// Parse new start datetime
	let startDateTime;
	try {
		if (timeToUse.includes(':')) {
			startDateTime = DateTime.fromFormat(
				`${eventData.date} ${timeToUse}`,
				'yyyy-MM-dd h:mm a',
				{ zone: userTimezone }
			);
		} else {
			startDateTime = DateTime.fromFormat(
				`${eventData.date} ${timeToUse}`,
				'yyyy-MM-dd h a',
				{ zone: userTimezone }
			);
		}
	} catch (error) {
		throw new Error(`Invalid time format: ${timeToUse}`);
	}

	// Calculate duration and end time
	const duration = eventData.duration || calculateDurationFromEvent(event);
	const { hours, minutes } = parseDuration(duration);
	const endDateTime = startDateTime.plus({ hours, minutes });

	// Update event object
	const updatedEvent = {
		...event,
		start: {
			dateTime: startDateTime.toISO(),
			timeZone: userTimezone,
		},
		end: {
			dateTime: endDateTime.toISO(),
			timeZone: userTimezone,
		}
	};

	// Update other fields if provided
	if (eventData.location) {
		updatedEvent.location = eventData.location;
	}

	if (eventData.notes) {
		updatedEvent.description = eventData.notes;
	}

	// Update the event in Google Calendar
	await calendarService.events.update({
		calendarId: 'primary',
		eventId: eventId,
		requestBody: updatedEvent
	});

	return eventId;
}

/**
 * Cancel/delete an event from Google Calendar
 */
async function cancelEvent(calendarService: any, eventData: any) {
	// Find the event to cancel
	const eventsResult = await findMatchingEvents(
		calendarService,
		eventData.event_title,
		eventData.date
	);

	const items = eventsResult.items || [];
	if (items.length === 0) {
		return { error: "Event not found" };
	}

	// Delete the first matching event
	const eventId = items[0].id;
	await calendarService.events.delete({
		calendarId: 'primary',
		eventId: eventId
	});

	return eventId;
}

// SvelteKit POST endpoint handler
export const POST: RequestHandler = async ({ request, cookies }: { request: Request; cookies: Cookies }) => {
	try {
		// Get the user's message from request body
		const data = await request.json();
		const userMessage = data.message;

		if (!userMessage) {
			return json({ error: "No message provided" }, { status: 400 });
		}

		console.log(`Received message: ${userMessage}`);

		// Get structured data from Nebius LLM
		const parsedData = await getNebiusLlmResponse(userMessage);
		if (parsedData.error) {
			return json(parsedData, { status: 500 });
		}

		// Get the token from cookies
		const user = getUserFromCookies(cookies);
		const token = user?.token;
		if (!token) {
			return json({ error: "Google authentication token not found" }, { status: 401 });
		}

		// Get Google Calendar service
		const calendarService = await getCalendarService(token);

		// Determine and execute the requested action
		const action = parsedData.action?.toLowerCase();
		console.log(`Action determined: ${action}`);

		let result: any = { status: "success", action };

		switch (action) {
			case 'create':
				const createdEventId = await createEvent(calendarService, parsedData);
				result.event_id = createdEventId;
				result.message = `Created event: ${parsedData.event_title}`;
				break;

			case 'reschedule':
				const rescheduledEventId = await rescheduleEvent(calendarService, parsedData);
				result.event_id = rescheduledEventId;
				result.message = `Rescheduled event: ${parsedData.event_title}`;
				break;

			case 'cancel':
				const cancelledEventId = await cancelEvent(calendarService, parsedData);
				result.event_id = cancelledEventId;
				result.message = `Cancelled event: ${parsedData.event_title}`;
				break;

			default:
				result = {
					status: "error",
					message: "Unclear action. Please specify if you want to create, reschedule, or cancel an event."
				};
		}

		return json(result);
	} catch (error) {
		console.error('Error in calendar endpoint:', error);
		return json({
			status: "error",
			message: `Error processing calendar request: ${error instanceof Error ? error.message : String(error)}`
		}, { status: 500 });
	}
};