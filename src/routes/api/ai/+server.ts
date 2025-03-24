// src/routes/api/calendar/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import OpenAI from 'openai';
import { DateTime } from 'luxon';
import { env } from '$env/dynamic/private';
import { getUserFromCookies } from '$lib/server/utlis/auth.js';

// Define types for better type safety
type DateRange = { start: string; end: string };
type LLMResponse = {
	type: 'json' | 'chat' | 'error';
	data: Record<string, any>;
};
type CalendarEventData = {
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

// Initialize OpenAI once
const openai = new OpenAI({
	baseURL: 'https://api.studio.nebius.com/v1/',
	apiKey: env.NEBIUS_API_KEY
});

/**
 * Get Google Calendar service using the user's stored token
 */
const getCalendarService = async (token: string) => {
	try {
		const oAuth2Client = new OAuth2Client();
		oAuth2Client.setCredentials({ access_token: token });
		return new calendar_v3.Calendar({ auth: oAuth2Client });
	} catch (error) {
		console.error('Failed to get calendar service:', error);
		throw new Error('Authentication error with Google Calendar');
	}
};

/**
 * Parse date range expressions like "next week", "this month", etc.
 */
const parseDateRange = (rangeExpression: string): DateRange => {
	const now = DateTime.now();
	let start = now;
	let end = now;

	// Normalize the expression
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
		default:
			// Handle expressions like "next 3 days", "next 2 weeks", etc.
			const match = expression.match(/next\s+(\d+)\s+(day|days|week|weeks|month|months)/i);
			if (match) {
				const amount = parseInt(match[1], 10);
				const unit = match[2].toLowerCase().startsWith('day') ? 'days' :
					match[2].toLowerCase().startsWith('week') ? 'weeks' : 'months';
				end = now.plus({ [unit]: amount });
			}
	}

	return {
		start: start.toISO() || '',
		end: end.toISO() || ''
	};
};

/**
 * Get structured calendar instruction from Nebius LLM
 */
const getNebiusLlmResponse = async (userInput: string): Promise<LLMResponse> => {
	try {
		// Get current date and time
		const now = DateTime.now();
		const currentDate = now.toFormat('yyyy-MM-dd');
		const currentTime = now.toFormat('h:mm a');

		// Create system message with date and time
		const systemMessage = `Today's date is ${currentDate} and the time is ${currentTime}.

You are a calendar assistant that helps users manage their calendar events.

For calendar management actions, extract key information and respond with JSON:

{
  "action": "create|reschedule|cancel|query", // The action the user wants to perform
  "event_title": "Meeting title", // The title/subject of the event (for create/reschedule/cancel)
  "date": "YYYY-MM-DD", // The date of the event
  "event_time": "HH:MM AM/PM", // The start time of the event
  "duration": "X hour(s)" or "Y minute(s)", // Duration of event, defaulting to 1 hour for new events
  "location": "Location of meeting", // Optional location information
  "attendees": ["email1@example.com", "email2@example.com"], // Optional list of attendee emails
  "notes": "Additional notes or description", // Optional notes about the event
  "original_time": "HH:MM AM/PM", // Required for reschedule actions, the original time
  "new_time": "HH:MM AM/PM", // Required for reschedule actions, the new time
  "event_id": "", // For reschedule/cancel, the event ID if known
  "date_range": "today|tomorrow|this week|next week|this month|next month|next X days", // For query action
  "query_type": "free_slots|busy_times|event_details" // For query action
}

For general questions or conversations about calendar usage, respond with:
{
  "action": "chat",
  "response": "Your natural language response here"
}

Always include the action field. Calendar operations must always have all required fields for that operation.`;

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

		// Get response content
		const responseContent = response.choices[0].message.content;
		if (!responseContent) {
			throw new Error('Empty response from LLM');
		}

		// Try to extract JSON from the response
		try {
			// Direct JSON parsing
			return { type: 'json', data: JSON.parse(responseContent.trim()) };
		} catch (error) {
			// Extract JSON from markdown code blocks
			const jsonMatch = responseContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
			if (jsonMatch) {
				try {
					return { type: 'json', data: JSON.parse(jsonMatch[1].trim()) };
				} catch (e) {
					// Try to find JSON between curly braces
					const bracesMatch = responseContent.match(/\{[\s\S]*\}/);
					if (bracesMatch) {
						try {
							return { type: 'json', data: JSON.parse(bracesMatch[0]) };
						} catch (e) {
							// Fallback to chat response
							return {
								type: 'chat',
								data: { action: 'chat', response: responseContent.trim() }
							};
						}
					}
				}
			}

			// If all JSON parsing attempts fail
			return {
				type: 'chat',
				data: { action: 'chat', response: responseContent.trim() }
			};
		}
	} catch (error: any) {
		return {
			type: 'error',
			data: { message: `Error processing your request: ${error.message}` }
		};
	}
};

/**
 * Handle calendar event creation
 */
const createCalendarEvent = async (
	calendarService: calendar_v3.Calendar,
	eventData: CalendarEventData
) => {
	try {
		if (!eventData.date || !eventData.event_time || !eventData.event_title) {
			return { success: false, error: 'Missing required event information' };
		}

		const startDateTime = DateTime.fromFormat(
			`${eventData.date} ${eventData.event_time}`,
			'yyyy-MM-dd h:mm a'
		);

		// Parse duration
		let durationInMinutes = 60; // Default 1 hour
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
			start: {
				dateTime: startDateTime.toISO() || '',
				timeZone
			},
			end: {
				dateTime: endDateTime.toISO() || '',
				timeZone
			},
			attendees: eventData.attendees?.map(email => ({ email })) || []
		};

		const result = await calendarService.events.insert({
			calendarId: 'primary',
			requestBody: event,
			sendUpdates: eventData.attendees?.length ? 'all' : 'none'
		});

		return {
			success: true,
			eventId: result.data.id,
			eventLink: result.data.htmlLink,
			summary: result.data.summary,
			start: result.data.start
		};
	} catch (error: any) {
		return { success: false, error: error.message };
	}
};

/**
 * Handle calendar event rescheduling
 */
const rescheduleCalendarEvent = async (
	calendarService: calendar_v3.Calendar,
	eventData: CalendarEventData
) => {
	try {
		// Find event ID either directly or by searching
		let eventId = eventData.event_id;

		if (!eventId && eventData.event_title && eventData.date && eventData.original_time) {
			const originalDateTime = DateTime.fromFormat(
				`${eventData.date} ${eventData.original_time}`,
				'yyyy-MM-dd h:mm a'
			);

			if (!originalDateTime.isValid) {
				return { success: false, error: 'Invalid original date/time format' };
			}

			const timeMin = originalDateTime.minus({ hours: 1 }).toISO();
			const timeMax = originalDateTime.plus({ hours: 1 }).toISO();

			if (!timeMin || !timeMax) {
				return { success: false, error: 'Error calculating time range' };
			}

			// Search for events that match the title around the specified time
			const searchResult = await calendarService.events.list({
				calendarId: 'primary',
				timeMin,
				timeMax,
				q: eventData.event_title,
				singleEvents: true,
				orderBy: 'startTime'
			});

			if (searchResult.data.items?.length) {
				eventId = searchResult.data.items[0].id ?? undefined;
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

		// Get the current event
		const event = await calendarService.events.get({
			calendarId: 'primary',
			eventId
		});

		// Calculate new start time
		const newStartDateTime = DateTime.fromFormat(
			`${eventData.date} ${eventData.new_time}`,
			'yyyy-MM-dd h:mm a'
		);

		if (!newStartDateTime.isValid) {
			return { success: false, error: 'Invalid new date/time format' };
		}

		// Calculate duration of original event
		const originalStart = event.data.start?.dateTime ?
			DateTime.fromISO(event.data.start.dateTime) : undefined;
		const originalEnd = event.data.end?.dateTime ?
			DateTime.fromISO(event.data.end.dateTime) : undefined;

		if (!originalStart || !originalEnd || !originalStart.isValid || !originalEnd.isValid) {
			return { success: false, error: 'Invalid original event times' };
		}

		const durationMillis = originalEnd.diff(originalStart).milliseconds;

		// Calculate new end time based on the same duration
		const newEndDateTime = newStartDateTime.plus({ milliseconds: durationMillis });
		const timeZone = newStartDateTime.zoneName || 'UTC';

		// Update the event
		const updatedEvent = {
			...event.data,
			start: {
				dateTime: newStartDateTime.toISO() || '',
				timeZone
			},
			end: {
				dateTime: newEndDateTime.toISO() || '',
				timeZone
			}
		};

		const result = await calendarService.events.update({
			calendarId: 'primary',
			eventId,
			requestBody: updatedEvent,
			sendUpdates: 'all'
		});

		return {
			success: true,
			eventId: result.data.id,
			eventLink: result.data.htmlLink,
			summary: result.data.summary,
			newStart: result.data.start
		};
	} catch (error: any) {
		return { success: false, error: error.message };
	}
};

/**
 * Handle calendar event cancellation
 */
const cancelCalendarEvent = async (
	calendarService: calendar_v3.Calendar,
	eventData: CalendarEventData
) => {
	try {
		// Find event ID either directly or by searching
		let eventId = eventData.event_id;

		if (!eventId && eventData.event_title && eventData.date && eventData.event_time) {
			const eventDateTime = DateTime.fromFormat(
				`${eventData.date} ${eventData.event_time}`,
				'yyyy-MM-dd h:mm a'
			);

			if (!eventDateTime.isValid) {
				return { success: false, error: 'Invalid date/time format' };
			}

			const timeMin = eventDateTime.minus({ hours: 1 }).toISO();
			const timeMax = eventDateTime.plus({ hours: 1 }).toISO();

			if (!timeMin || !timeMax) {
				return { success: false, error: 'Error calculating time range' };
			}

			// Search for events that match the title around the specified time
			const searchResult = await calendarService.events.list({
				calendarId: 'primary',
				timeMin,
				timeMax,
				q: eventData.event_title,
				singleEvents: true,
				orderBy: 'startTime'
			});

			if (searchResult.data.items?.length && searchResult.data.items[0].id) {
				eventId = searchResult.data.items[0].id;
			} else {
				return { success: false, error: 'Could not find the event to cancel' };
			}
		}

		if (!eventId) {
			return { success: false, error: 'Insufficient information to identify the event' };
		}

		// Delete the event
		await calendarService.events.delete({
			calendarId: 'primary',
			eventId,
			sendUpdates: 'all'
		});

		return { success: true, message: 'Event successfully cancelled' };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
};

/**
 * Query calendar for events or availability
 */
const queryCalendar = async (
	calendarService: calendar_v3.Calendar,
	queryData: CalendarEventData
) => {
	try {
		// Parse date range from natural language
		const dateRange = parseDateRange(queryData.date_range || 'today');

		if (!queryData.query_type) {
			return { success: false, error: 'Query type is required' };
		}

		switch (queryData.query_type) {
			case 'free_slots': {
				// Get busy times
				const freeBusyRequest = await calendarService.freebusy.query({
					requestBody: {
						timeMin: dateRange.start,
						timeMax: dateRange.end,
						items: [{ id: 'primary' }]
					}
				});

				const busySlots = freeBusyRequest.data.calendars?.primary?.busy || [];
				let startTime = DateTime.fromISO(dateRange.start);
				const endTime = DateTime.fromISO(dateRange.end);

				if (!startTime.isValid || !endTime.isValid) {
					return { success: false, error: 'Invalid date range' };
				}

				// Start with 9am if the start time is before that
				startTime = startTime.hour < 9 ? startTime.set({ hour: 9, minute: 0 }) : startTime;

				// End at 6pm if the end time is after that
				const dayEndTime = endTime.hour > 18 ? endTime.set({ hour: 18, minute: 0 }) : endTime;

				// Process busy slots to find free time
				const freeSlots = [];
				for (const busySlot of busySlots) {
					const busyStart = DateTime.fromISO(busySlot.start || '');
					const busyEnd = DateTime.fromISO(busySlot.end || '');

					if (startTime < busyStart) {
						const duration = busyStart.diff(startTime).as('minutes');
						if (duration >= 30) {
							freeSlots.push({
								start: startTime.toISO(),
								end: busyStart.toISO(),
								duration
							});
						}
					}
					startTime = busyEnd;
				}

				// Add any remaining free time after the last busy slot
				if (startTime < dayEndTime) {
					const duration = dayEndTime.diff(startTime).as('minutes');
					if (duration >= 30) {
						freeSlots.push({
							start: startTime.toISO(),
							end: dayEndTime.toISO(),
							duration
						});
					}
				}

				return {
					success: true,
					freeSlots,
					dateRange
				};
			}

			case 'busy_times': {
				const eventsResult = await calendarService.events.list({
					calendarId: 'primary',
					timeMin: dateRange.start,
					timeMax: dateRange.end,
					singleEvents: true,
					orderBy: 'startTime'
				});

				const events = eventsResult.data.items || [];
				const busyTimes = events.map(event => ({
					summary: event.summary,
					start: event.start?.dateTime || event.start?.date,
					end: event.end?.dateTime || event.end?.date,
					id: event.id
				}));

				return {
					success: true,
					busyTimes,
					dateRange
				};
			}

			case 'event_details': {
				if (!queryData.event_title) {
					return { success: false, error: 'Event title is required for event details' };
				}

				// Search for the specific event
				const eventsResult = await calendarService.events.list({
					calendarId: 'primary',
					timeMin: dateRange.start,
					timeMax: dateRange.end,
					q: queryData.event_title,
					singleEvents: true,
					orderBy: 'startTime'
				});

				const events = eventsResult.data.items || [];
				if (!events.length) {
					return { success: false, error: 'No matching events found' };
				}

				return {
					success: true,
					events: events.map(event => ({
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
		return { success: false, error: error.message };
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { message } = await request.json();

		if (!message || typeof message !== 'string') {
			return json({ error: 'Invalid request format' }, { status: 400 });
		}

		// Get user from cookies
		const user = getUserFromCookies(cookies);

		if (!user?.token) {
			return json({ error: 'Google Calendar authentication required' }, { status: 401 });
		}

		// Get calendar service
		const calendarService = await getCalendarService(user.token);

		// Get structured data from LLM
		const llmResponse = await getNebiusLlmResponse(message);

		if (llmResponse.type === 'error') {
			return json({ error: llmResponse.data.message }, { status: 500 });
		}

		if (llmResponse.type === 'chat') {
			return json({
				type: 'chat',
				message: llmResponse.data.response || 'I need more details to help with your calendar.'
			});
		}

		// Handle structured calendar operations
		const { action, ...actionData } = llmResponse.data;

		// Execute the appropriate calendar operation based on action
		const result = action === 'create' ? await createCalendarEvent(calendarService, actionData) :
			action === 'reschedule' ? await rescheduleCalendarEvent(calendarService, actionData) :
				action === 'cancel' ? await cancelCalendarEvent(calendarService, actionData) :
					action === 'query' ? await queryCalendar(calendarService, actionData) :
						action === 'chat' ? { type: 'chat', message: actionData.response || 'What would you like to do with your calendar?' } :
							{ success: false, error: 'Unknown calendar action requested' };

		return json({
			type: action,
			result,
			original_data: actionData
		});

	} catch (error: any) {
		console.error('Error handling calendar request:', error);
		return json({ error: `Error processing calendar request: ${error.message}` }, { status: 500 });
	}
};
