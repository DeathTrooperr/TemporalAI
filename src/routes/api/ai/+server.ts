// src/routes/api/calendar/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import OpenAI from 'openai';
import { DateTime } from 'luxon';
import { env } from '$env/dynamic/private';
import { getUserFromCookies } from '$lib/server/utlis/auth.js';

/* ---------------------------------------------------------------------------
   OpenAI Client Instance
--------------------------------------------------------------------------- */
const openaiClient = new OpenAI({
	baseURL: 'https://api.studio.nebius.com/v1/',
	apiKey: env.NEBIUS_API_KEY
});

/* ---------------------------------------------------------------------------
   Type Definitions
--------------------------------------------------------------------------- */

// For Nebius LLM response. May be a single object or an array of commands.
type LLMResponse = {
	type: 'json' | 'chat' | 'error';
	data: Record<string, any> | Record<string, any>[];
};

export type CalendarEventData = {
	event_title?: string;
	date?: string;
	event_time?: string;
	new_time?: string;
	original_time?: string;
	duration?: string;
	location?: string;
	notes?: string;
	attendees?: string[];
	event_id?: string;
	date_range?: string;
	query_type?: 'free_slots' | 'busy_times' | 'event_details';
};

type DateRange = { start: string; end: string };

interface CalendarOperationResult {
	success: boolean;
	error?: string;
	eventId?: string;
	eventLink?: string;
	summary?: string;
	start?: any;
	newStart?: any;
	freeSlots?: { start: string; end: string; duration: number }[];
	busyTimes?: { summary: string; start: string; end: string; id: string }[];
	dateRange?: DateRange;
	message?: string;
	events?: any[];
}

// Support for both timed and all-day events.
interface GoogleCalendarEventTime {
	dateTime?: string;
	timeZone?: string;
	date?: string;
}

interface GoogleCalendarEvent {
	id: string;
	htmlLink: string;
	summary: string;
	start: GoogleCalendarEventTime;
	end: GoogleCalendarEventTime;
	[key: string]: any;
}

interface GoogleEventsListResponse {
	items: GoogleCalendarEvent[];
}

interface GoogleFreeBusyResponse {
	calendars: {
		[calendarId: string]: {
			busy: { start: string; end: string }[];
		};
	};
}

interface GoogleDeleteResponse {}

/* ---------------------------------------------------------------------------
   Helper: googleFetch
--------------------------------------------------------------------------- */
const googleFetch = async <T>(
	token: string,
	path: string,
	method: string = 'GET',
	body?: any,
	queryParams?: Record<string, string>
): Promise<T> => {
	let url = `https://www.googleapis.com/calendar/v3${path}`;
	if (queryParams) {
		const qs = Object.entries(queryParams)
			.filter(([_, v]) => v !== undefined)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
			.join('&');
		if (qs) {
			url += `?${qs}`;
		}
	}
	const options: RequestInit = {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json'
		},
		body: body ? JSON.stringify(body) : undefined
	};
	const res = await fetch(url, options);
	if (!res.ok) {
		// Cast the error response to a known type
		const errorData = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
		throw new Error(errorData.error?.message || res.statusText);
	}
	try {
		return (await res.json()) as T;
	} catch {
		return {} as T;
	}
};

/* ---------------------------------------------------------------------------
   Function: parseDateRange
--------------------------------------------------------------------------- */
const parseDateRange = (rangeExpression: string): DateRange => {
	const now = DateTime.now();
	let start = now;
	let end = now;
	const expression = rangeExpression.toLowerCase().trim();

	switch (expression) {
		case 'today':
			end = now.endOf('day');
			break;
		case 'tomorrow':
			start = now.plus({ days: 1 }).startOf('day');
			end = start.endOf('day');
			break;
		case 'this week':
			start = now.startOf('week');
			end = now.endOf('week');
			break;
		case 'next week':
			start = now.plus({ weeks: 1 }).startOf('week');
			end = start.endOf('week');
			break;
		case 'this month':
			start = now.startOf('month');
			end = now.endOf('month');
			break;
		case 'next month':
			start = now.plus({ months: 1 }).startOf('month');
			end = start.endOf('month');
			break;
		default: {
			const match = expression.match(/next\s+(\d+)\s+(day|days|week|weeks|month|months)/i);
			if (match) {
				const amount = parseInt(match[1], 10);
				const unit = match[2].toLowerCase().startsWith('day')
					? 'days'
					: match[2].toLowerCase().startsWith('week')
						? 'weeks'
						: 'months';
				end = now.plus({ [unit]: amount });
			}
		}
	}
	return { start: start.toISO() || '', end: end.toISO() || '' };
};

/* ---------------------------------------------------------------------------
   Function: getNebiusLlmResponse
--------------------------------------------------------------------------- */
const getNebiusLlmResponse = async (userInput: string): Promise<LLMResponse> => {
	try {
		const now = DateTime.now();
		const currentDate = now.toFormat('yyyy-MM-dd');
		const currentTime = now.toFormat('h:mm a');

		const systemMessage = `Today's date is ${currentDate} and the time is ${currentTime}.

You are a calendar assistant that helps users manage their calendar events.

For calendar management actions, extract key information and respond with JSON.
You may include multiple actions in an array if needed. For each action use:
{
  "action": "create|reschedule|cancel|query|chat",
  "event_title": "Meeting title", // For create/reschedule/cancel; optional for query to list events in a date range.
  "date": "YYYY-MM-DD", // Date of the event or date to query.
  "event_time": "HH:MM AM/PM", // Start time for events.
  "duration": "X hour(s)" or "Y minute(s)", // Duration of event.
  "location": "Location of meeting", // Optional.
  "attendees": ["email1@example.com", "email2@example.com"], // Optional.
  "notes": "Additional notes", // Optional.
  "original_time": "HH:MM AM/PM", // For reschedule.
  "new_time": "HH:MM AM/PM", // For reschedule.
  "event_id": "", // For reschedule/cancel.
  "date_range": "today|tomorrow|this week|next week|this month|next month|next X days", // For query.
  "query_type": "free_slots|busy_times|event_details" // For query.
}

For general chat, use:
{
  "action": "chat",
  "response": "Your natural language response here"
}

Always include the action field.`;

		const response = await openaiClient.chat.completions.create({
			model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
			max_tokens: 512,
			temperature: 0.6,
			top_p: 0.9,
			messages: [
				{ role: 'system', content: systemMessage },
				{ role: 'user', content: userInput }
			]
		});

		const responseContent = response.choices[0].message.content;
		if (!responseContent) {
			throw new Error('Empty response from LLM');
		}
		try {
			return { type: 'json', data: JSON.parse(responseContent.trim()) };
		} catch (error) {
			const jsonMatch = responseContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
			if (jsonMatch) {
				try {
					return { type: 'json', data: JSON.parse(jsonMatch[1].trim()) };
				} catch (e) {
					const bracesMatch = responseContent.match(/\{[\s\S]*\}/);
					if (bracesMatch) {
						try {
							return { type: 'json', data: JSON.parse(bracesMatch[0]) };
						} catch (e) {
							return { type: 'chat', data: { action: 'chat', response: responseContent.trim() } };
						}
					}
				}
			}
			return { type: 'chat', data: { action: 'chat', response: responseContent.trim() } };
		}
	} catch (error: any) {
		return { type: 'error', data: { message: (error as Error).message } };
	}
};

/* ---------------------------------------------------------------------------
   Calendar Operations using fetch requests
--------------------------------------------------------------------------- */

/**
 * Create a new calendar event.
 */
const createCalendarEvent = async (
	token: string,
	eventData: CalendarEventData
): Promise<CalendarOperationResult> => {
	try {
		if (!eventData.date || !eventData.event_time || !eventData.event_title) {
			return { success: false, error: 'Missing required event information' };
		}

		const startDateTime = DateTime.fromFormat(
			`${eventData.date} ${eventData.event_time}`,
			'yyyy-MM-dd h:mm a'
		);
		let durationInMinutes = 60;
		if (eventData.duration) {
			const durationMatch = eventData.duration.match(/(\d+)\s+(hour|minute|min|hr)/i);
			if (durationMatch) {
				const amount = parseInt(durationMatch[1], 10);
				const unit = durationMatch[2].toLowerCase();
				durationInMinutes = unit.startsWith('hour') || unit.startsWith('hr') ? amount * 60 : amount;
			}
		}
		const endDateTime = startDateTime.plus({ minutes: durationInMinutes });
		const timeZone = startDateTime.zoneName || 'UTC';

		const event = {
			summary: eventData.event_title,
			location: eventData.location || '',
			description: eventData.notes || '',
			start: { dateTime: startDateTime.toISO()!, timeZone },
			end: { dateTime: endDateTime.toISO()!, timeZone },
			attendees: eventData.attendees?.map((email) => ({ email })) || []
		};

		const sendUpdates = eventData.attendees && eventData.attendees.length ? 'all' : 'none';
		const result = await googleFetch<GoogleCalendarEvent>(
			token,
			'/calendars/primary/events',
			'POST',
			event,
			{ sendUpdates }
		);
		return {
			success: true,
			eventId: result.id,
			eventLink: result.htmlLink,
			summary: result.summary,
			start: result.start
		};
	} catch (error: any) {
		return { success: false, error: (error as Error).message };
	}
};

/**
 * Reschedule an existing calendar event.
 */
const rescheduleCalendarEvent = async (
	token: string,
	eventData: CalendarEventData
): Promise<CalendarOperationResult> => {
	try {
		let eventId = eventData.event_id;
		if (!eventId && eventData.event_title && eventData.date && eventData.original_time) {
			const originalDateTime = DateTime.fromFormat(
				`${eventData.date} ${eventData.original_time}`,
				'yyyy-MM-dd h:mm a'
			);
			if (!originalDateTime.isValid) {
				return { success: false, error: 'Invalid original date/time format' };
			}
			const timeMin = originalDateTime.minus({ hours: 1 }).toISO()!;
			const timeMax = originalDateTime.plus({ hours: 1 }).toISO()!;
			const listResult = await googleFetch<GoogleEventsListResponse>(
				token,
				'/calendars/primary/events',
				'GET',
				undefined,
				{
					timeMin,
					timeMax,
					q: eventData.event_title,
					singleEvents: 'true',
					orderBy: 'startTime'
				}
			);
			if (listResult.items && listResult.items.length > 0) {
				eventId = listResult.items[0].id;
			} else {
				return { success: false, error: 'Could not find the event to reschedule' };
			}
		}
		if (!eventId) {
			return { success: false, error: 'Insufficient information to identify the event' };
		}
		if (!eventData.new_time || !eventData.date) {
			return { success: false, error: 'New time is required for rescheduling' };
		}
		const eventDetails = await googleFetch<GoogleCalendarEvent>(
			token,
			`/calendars/primary/events/${eventId}`
		);
		const newStartDateTime = DateTime.fromFormat(
			`${eventData.date} ${eventData.new_time}`,
			'yyyy-MM-dd h:mm a'
		);
		if (!newStartDateTime.isValid) {
			return { success: false, error: 'Invalid new date/time format' };
		}
		const originalStart = eventDetails.start.dateTime
			? DateTime.fromISO(eventDetails.start.dateTime)
			: eventDetails.start.date
				? DateTime.fromISO(eventDetails.start.date)
				: undefined;
		const originalEnd = eventDetails.end.dateTime
			? DateTime.fromISO(eventDetails.end.dateTime)
			: eventDetails.end.date
				? DateTime.fromISO(eventDetails.end.date)
				: undefined;
		if (!originalStart || !originalEnd || !originalStart.isValid || !originalEnd.isValid) {
			return { success: false, error: 'Invalid original event times' };
		}
		const durationMillis = originalEnd.diff(originalStart).milliseconds;
		const newEndDateTime = newStartDateTime.plus({ milliseconds: durationMillis });
		const timeZone = newStartDateTime.zoneName || 'UTC';

		const updatedEvent = {
			...eventDetails,
			start: { dateTime: newStartDateTime.toISO()!, timeZone },
			end: { dateTime: newEndDateTime.toISO()!, timeZone }
		};

		const updateResult = await googleFetch<GoogleCalendarEvent>(
			token,
			`/calendars/primary/events/${eventId}`,
			'PUT',
			updatedEvent,
			{ sendUpdates: 'all' }
		);
		return {
			success: true,
			eventId: updateResult.id,
			eventLink: updateResult.htmlLink,
			summary: updateResult.summary,
			newStart: updateResult.start
		};
	} catch (error: any) {
		return { success: false, error: (error as Error).message };
	}
};

/**
 * Cancel a calendar event.
 */
const cancelCalendarEvent = async (
	token: string,
	eventData: CalendarEventData
): Promise<CalendarOperationResult> => {
	try {
		let eventId = eventData.event_id;
		if (!eventId && eventData.event_title && eventData.date && eventData.event_time) {
			const eventDateTime = DateTime.fromFormat(
				`${eventData.date} ${eventData.event_time}`,
				'yyyy-MM-dd h:mm a'
			);
			if (!eventDateTime.isValid) {
				return { success: false, error: 'Invalid date/time format' };
			}
			const timeMin = eventDateTime.minus({ hours: 1 }).toISO()!;
			const timeMax = eventDateTime.plus({ hours: 1 }).toISO()!;
			const listResult = await googleFetch<GoogleEventsListResponse>(
				token,
				'/calendars/primary/events',
				'GET',
				undefined,
				{
					timeMin,
					timeMax,
					q: eventData.event_title,
					singleEvents: 'true',
					orderBy: 'startTime'
				}
			);
			if (listResult.items && listResult.items.length > 0) {
				eventId = listResult.items[0].id;
			} else {
				return { success: false, error: 'Could not find the event to cancel' };
			}
		}
		if (!eventId) {
			return { success: false, error: 'Insufficient information to identify the event' };
		}
		await googleFetch<GoogleDeleteResponse>(
			token,
			`/calendars/primary/events/${eventId}`,
			'DELETE',
			undefined,
			{ sendUpdates: 'all' }
		);
		return { success: true, message: 'Event successfully cancelled' };
	} catch (error: any) {
		return { success: false, error: (error as Error).message };
	}
};

/**
 * Query calendar for events or availability.
 * For "event_details", if no event_title is provided, return all events in the specified date range.
 */
const queryCalendar = async (
	token: string,
	queryData: CalendarEventData
): Promise<CalendarOperationResult> => {
	try {
		const dateRange = parseDateRange(queryData.date_range || 'today');
		if (!queryData.query_type) {
			return { success: false, error: 'Query type is required' };
		}

		switch (queryData.query_type) {
			case 'free_slots': {
				const freeBusyBody = {
					timeMin: dateRange.start,
					timeMax: dateRange.end,
					items: [{ id: 'primary' }]
				};
				const freeBusyResult = await googleFetch<GoogleFreeBusyResponse>(
					token,
					'/freeBusy',
					'POST',
					freeBusyBody
				);
				const busySlots = freeBusyResult.calendars?.primary?.busy || [];
				let startTime = DateTime.fromISO(dateRange.start);
				const endTime = DateTime.fromISO(dateRange.end);
				if (!startTime.isValid || !endTime.isValid) {
					return { success: false, error: 'Invalid date range' };
				}
				startTime = startTime.hour < 9 ? startTime.set({ hour: 9, minute: 0 }) : startTime;
				const dayEndTime = endTime.hour > 18 ? endTime.set({ hour: 18, minute: 0 }) : endTime;
				const freeSlots: { start: string; end: string; duration: number }[] = [];
				for (const busySlot of busySlots) {
					const busyStart = DateTime.fromISO(busySlot.start);
					const busyEnd = DateTime.fromISO(busySlot.end);
					if (startTime < busyStart) {
						const duration = busyStart.diff(startTime).as('minutes');
						if (duration >= 30) {
							freeSlots.push({
								start: startTime.toISO()!,
								end: busyStart.toISO()!,
								duration
							});
						}
					}
					startTime = busyEnd;
				}
				if (startTime < dayEndTime) {
					const duration = dayEndTime.diff(startTime).as('minutes');
					if (duration >= 30) {
						freeSlots.push({
							start: startTime.toISO()!,
							end: dayEndTime.toISO()!,
							duration
						});
					}
				}
				return { success: true, freeSlots, dateRange };
			}
			case 'busy_times': {
				const eventsList = await googleFetch<GoogleEventsListResponse>(
					token,
					'/calendars/primary/events',
					'GET',
					undefined,
					{
						timeMin: dateRange.start,
						timeMax: dateRange.end,
						singleEvents: 'true',
						orderBy: 'startTime'
					}
				);
				const busyTimes = eventsList.items.map((event) => ({
					summary: event.summary,
					start: event.start.dateTime || event.start.date,
					end: event.end.dateTime || event.end.date,
					id: event.id
				}));
				return { success: true, busyTimes, dateRange };
			}
			case 'event_details': {
				let eventsList: GoogleEventsListResponse;
				// If event_title is provided, search using the title.
				if (queryData.event_title) {
					eventsList = await googleFetch<GoogleEventsListResponse>(
						token,
						'/calendars/primary/events',
						'GET',
						undefined,
						{
							timeMin: dateRange.start,
							timeMax: dateRange.end,
							q: queryData.event_title,
							singleEvents: 'true',
							orderBy: 'startTime'
						}
					);
				} else {
					// If no title provided, return all events in the date range.
					eventsList = await googleFetch<GoogleEventsListResponse>(
						token,
						'/calendars/primary/events',
						'GET',
						undefined,
						{
							timeMin: dateRange.start,
							timeMax: dateRange.end,
							singleEvents: 'true',
							orderBy: 'startTime'
						}
					);
				}
				if (!eventsList.items || eventsList.items.length === 0) {
					return { success: false, error: 'No events were found in the specified date range.' };
				}
				return {
					success: true,
					events: eventsList.items.map((event) => ({
						id: event.id,
						summary: event.summary,
						description: event.description,
						location: event.location,
						start: event.start,
						end: event.end,
						attendees: event.attendees,
						organizer: event.organizer,
						htmlLink: event.htmlLink
					}))
				};
			}
			default:
				return { success: false, error: 'Unknown query type' };
		}
	} catch (error: any) {
		return { success: false, error: (error as Error).message };
	}
};

/* ---------------------------------------------------------------------------
   Request Handler
--------------------------------------------------------------------------- */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { message } = await request.json();
		if (!message || typeof message !== 'string') {
			return json({ error: 'Invalid request format' }, { status: 400 });
		}
		const user = getUserFromCookies(cookies);
		if (!user?.token) {
			return json({ error: 'Google Calendar authentication required' }, { status: 401 });
		}

		// Get the structured instructions from the LLM.
		const llmResponse = await getNebiusLlmResponse(message);
		if (llmResponse.type === 'error') {
			// If data is an array, pick a default error message.
			const errorMessage = Array.isArray(llmResponse.data)
				? 'Error processing your request'
				: llmResponse.data.message;
			return json({ error: errorMessage }, { status: 500 });
		}

		// Support multiple actions: if data is an array, process each; otherwise, wrap it in an array.
		const commands: any[] = Array.isArray(llmResponse.data) ? llmResponse.data : [llmResponse.data];
		const results: { action: string; result: CalendarOperationResult }[] = [];
		const nlResponses: string[] = [];

		// Process each command sequentially.
		for (const command of commands) {
			const { action, ...actionData } = command;
			let result: CalendarOperationResult;
			switch (action) {
				case 'create':
					result = await createCalendarEvent(user.token, actionData);
					if (result.success) {
						nlResponses.push(`Your event "${result.summary}" was successfully created.`);
					} else {
						nlResponses.push(
							`Your request to create the event "${actionData.event_title || ''}" failed: ${result.error}.`
						);
					}
					break;
				case 'reschedule':
					result = await rescheduleCalendarEvent(user.token, actionData);
					if (result.success) {
						nlResponses.push(`Your event "${result.summary}" was successfully rescheduled.`);
					} else {
						nlResponses.push(
							`Your request to reschedule the event "${actionData.event_title || ''}" failed: ${result.error}.`
						);
					}
					break;
				case 'cancel':
					result = await cancelCalendarEvent(user.token, actionData);
					if (result.success) {
						nlResponses.push(`Your event was successfully cancelled.`);
					} else {
						nlResponses.push(
							`Your request to cancel the event "${actionData.event_title || ''}" failed: ${result.error}.`
						);
					}
					break;
				case 'query':
					result = await queryCalendar(user.token, actionData);
					if (result.success) {
						if (result.events && result.events.length > 0) {
							nlResponses.push(
								`I found ${result.events.length} event(s) in the specified date range.`
							);
						} else {
							nlResponses.push(`I did not find any events in the specified date range.`);
						}
					} else {
						nlResponses.push(`Your query failed: ${result.error}.`);
					}
					break;
				case 'chat':
					result = {
						success: true,
						message: actionData.response || 'How can I assist you with your calendar?'
					};
					nlResponses.push(result.message || '');
					break;
				default:
					result = { success: false, error: 'Unknown calendar action requested' };
					nlResponses.push(`Unknown action: ${action}.`);
			}
			results.push({ action, result });
		}

		// Combine all natural language responses into one reply.
		const nlResponse = nlResponses.join(' ');

		return json({
			type: 'multi',
			results,
			nlResponse,
			original_data: commands
		});
	} catch (error: any) {
		console.error('Error handling calendar request:', error);
		return json(
			{ error: `Error processing calendar request: ${(error as Error).message}` },
			{ status: 500 }
		);
	}
};
