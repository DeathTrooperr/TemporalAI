// src/routes/api/calendar/+server.ts
import { json } from '@sveltejs/kit';
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
 * Parse date range expressions like "next week", "this month", etc.
 */
function parseDateRange(rangeExpression: string): { start: string, end: string } {
	const now = DateTime.now();
	let start: DateTime = now;
	let end: DateTime = now;

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
			} else {
				// Default to today if we can't parse
				end = now.endOf('day');
			}
	}

	return {
		start: start.toISO(),
		end: end.toISO()
	};
}

/**
 * Get structured calendar instruction from Nebius LLM
 * Handles both JSON format and plain text responses
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

		systemMessage += `
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

Always include the action field. Calendar operations must always have all required fields for that operation.
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

		// Get response content
		const responseContent = response.choices[0].message.content;
		if (!responseContent) {
			throw new Error('Empty response from LLM');
		}

		console.log(`Nebius LLM raw response: ${responseContent}`);

		// Comprehensive JSON extraction
		let jsonData = null;

		// Try several approaches to extract the JSON
		try {
			// First attempt: direct JSON parsing
			jsonData = JSON.parse(responseContent.trim());
		} catch (error) {
			// Second attempt: Extract JSON from markdown code blocks
			const jsonMatch = responseContent.match(/```(?:json)?\n([\s\S]*?)\n```/);
			if (jsonMatch) {
				try {
					jsonData = JSON.parse(jsonMatch[1].trim());
				} catch (e) {
					console.error(`Failed to parse JSON from code block: ${e}`);
				}
			} else {
				// Third attempt: Find anything that looks like JSON between curly braces
				const jsonBraceMatch = responseContent.match(/\{[\s\S]*\}/);
				if (jsonBraceMatch) {
					try {
						jsonData = JSON.parse(jsonBraceMatch[0]);
					} catch (e) {
						console.error(`Failed to parse JSON from braces: ${e}`);
					}
				}
			}
		}

		// If we successfully parsed JSON
		if (jsonData) {
			return {
				type: 'json',
				data: jsonData
			};
		}

		// Fallback: return as chat response
		return {
			type: 'chat',
			data: {
				action: 'chat',
				response: responseContent.trim()
			}
		};
	} catch (error) {
		console.error(`LLM processing error: ${error}`);
		return {
			type: 'error',
			data: {
				message: `Error processing your request: ${error.message}`
			}
		};
	}
}

/**
 * Handle calendar event creation
 */
async function createCalendarEvent(calendarService, eventData) {
	try {
		const startDateTime = DateTime.fromFormat(`${eventData.date} ${eventData.event_time}`, 'yyyy-MM-dd h:mm a');

		// Parse duration
		let durationInMinutes = 60; // Default 1 hour
		const durationMatch = eventData.duration?.match(/(\d+)\s+(hour|minute|min|hr)/i);
		if (durationMatch) {
			const amount = parseInt(durationMatch[1], 10);
			const unit = durationMatch[2].toLowerCase();
			durationInMinutes = unit.startsWith('hour') || unit.startsWith('hr') ? amount * 60 : amount;
		}

		const endDateTime = startDateTime.plus({ minutes: durationInMinutes });

		const event = {
			summary: eventData.event_title,
			location: eventData.location || '',
			description: eventData.notes || '',
			start: {
				dateTime: startDateTime.toISO(),
				timeZone: startDateTime.zoneName,
			},
			end: {
				dateTime: endDateTime.toISO(),
				timeZone: endDateTime.zoneName,
			},
			attendees: eventData.attendees?.map(email => ({ email })) || [],
		};

		const result = await calendarService.events.insert({
			calendarId: 'primary',
			requestBody: event,
			sendUpdates: eventData.attendees?.length ? 'all' : 'none',
		});

		return {
			success: true,
			eventId: result.data.id,
			eventLink: result.data.htmlLink,
			summary: result.data.summary,
			start: result.data.start,
		};
	} catch (error) {
		console.error('Error creating calendar event:', error);
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Handle calendar event rescheduling
 */
async function rescheduleCalendarEvent(calendarService, eventData) {
	try {
		// If we have an event ID, use it directly
		let eventId = eventData.event_id;

		// Otherwise, search for the event by title and original time
		if (!eventId && eventData.event_title && eventData.date && eventData.original_time) {
			const originalDateTime = DateTime.fromFormat(
				`${eventData.date} ${eventData.original_time}`,
				'yyyy-MM-dd h:mm a'
			);

			const timeMin = originalDateTime.minus({ hours: 1 }).toISO();
			const timeMax = originalDateTime.plus({ hours: 1 }).toISO();

			// Search for events that match the title around the specified time
			const searchResult = await calendarService.events.list({
				calendarId: 'primary',
				timeMin,
				timeMax,
				q: eventData.event_title,
				singleEvents: true,
				orderBy: 'startTime',
			});

			if (searchResult.data.items && searchResult.data.items.length > 0) {
				eventId = searchResult.data.items[0].id;
			} else {
				return {
					success: false,
					error: 'Could not find the event to reschedule',
				};
			}
		}

		if (!eventId) {
			return {
				success: false,
				error: 'Insufficient information to identify the event to reschedule',
			};
		}

		// Get the current event
		const event = await calendarService.events.get({
			calendarId: 'primary',
			eventId,
		});

		// Calculate new start time
		const newStartDateTime = DateTime.fromFormat(
			`${eventData.date} ${eventData.new_time}`,
			'yyyy-MM-dd h:mm a'
		);

		// Calculate duration of original event
		const originalStart = DateTime.fromISO(event.data.start.dateTime);
		const originalEnd = DateTime.fromISO(event.data.end.dateTime);
		const durationMillis = originalEnd.diff(originalStart).milliseconds;

		// Calculate new end time based on the same duration
		const newEndDateTime = newStartDateTime.plus({ milliseconds: durationMillis });

		// Update the event
		const updatedEvent = {
			...event.data,
			start: {
				dateTime: newStartDateTime.toISO(),
				timeZone: newStartDateTime.zoneName,
			},
			end: {
				dateTime: newEndDateTime.toISO(),
				timeZone: newEndDateTime.zoneName,
			},
		};

		const result = await calendarService.events.update({
			calendarId: 'primary',
			eventId,
			requestBody: updatedEvent,
			sendUpdates: 'all',
		});

		return {
			success: true,
			eventId: result.data.id,
			eventLink: result.data.htmlLink,
			summary: result.data.summary,
			newStart: result.data.start,
		};
	} catch (error) {
		console.error('Error rescheduling calendar event:', error);
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Handle calendar event cancellation
 */
async function cancelCalendarEvent(calendarService, eventData) {
	try {
		// If we have an event ID, use it directly
		let eventId = eventData.event_id;

		// Otherwise, search for the event by title and time
		if (!eventId && eventData.event_title && eventData.date && eventData.event_time) {
			const eventDateTime = DateTime.fromFormat(
				`${eventData.date} ${eventData.event_time}`,
				'yyyy-MM-dd h:mm a'
			);

			const timeMin = eventDateTime.minus({ hours: 1 }).toISO();
			const timeMax = eventDateTime.plus({ hours: 1 }).toISO();

			// Search for events that match the title around the specified time
			const searchResult = await calendarService.events.list({
				calendarId: 'primary',
				timeMin,
				timeMax,
				q: eventData.event_title,
				singleEvents: true,
				orderBy: 'startTime',
			});

			if (searchResult.data.items && searchResult.data.items.length > 0) {
				eventId = searchResult.data.items[0].id;
			} else {
				return {
					success: false,
					error: 'Could not find the event to cancel',
				};
			}
		}

		if (!eventId) {
			return {
				success: false,
				error: 'Insufficient information to identify the event to cancel',
			};
		}

		// Delete the event
		await calendarService.events.delete({
			calendarId: 'primary',
			eventId,
			sendUpdates: 'all',
		});

		return {
			success: true,
			message: 'Event successfully cancelled',
		};
	} catch (error) {
		console.error('Error cancelling calendar event:', error);
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Query calendar for events or availability
 */
async function queryCalendar(calendarService, queryData) {
	try {
		// Parse date range from natural language
		const dateRange = parseDateRange(queryData.date_range || 'today');

		switch (queryData.query_type) {
			case 'free_slots': {
				// Get busy times
				const freeBusyRequest = await calendarService.freebusy.query({
					requestBody: {
						timeMin: dateRange.start,
						timeMax: dateRange.end,
						items: [{ id: 'primary' }],
					},
				});

				const busySlots = freeBusyRequest.data.calendars.primary.busy || [];

				// Convert busy slots to free slots
				let startTime = DateTime.fromISO(dateRange.start);
				const endTime = DateTime.fromISO(dateRange.end);
				const freeSlots = [];

				// Start with 9am if the start time is before that
				if (startTime.hour < 9) {
					startTime = startTime.set({ hour: 9, minute: 0 });
				}

				// Process each busy slot to find free time
				busySlots.forEach(busySlot => {
					const busyStart = DateTime.fromISO(busySlot.start);
					const busyEnd = DateTime.fromISO(busySlot.end);

					// If there's free time before this busy slot
					if (startTime < busyStart) {
						freeSlots.push({
							start: startTime.toISO(),
							end: busyStart.toISO(),
							duration: busyStart.diff(startTime).as('minutes'),
						});
					}

					// Move the startTime pointer to after this busy slot
					startTime = busyEnd;
				});

				// Add any free time after the last busy slot until end of day (6pm)
				const dayEndTime = endTime.hour > 18 ? endTime.set({ hour: 18, minute: 0 }) : endTime;
				if (startTime < dayEndTime) {
					freeSlots.push({
						start: startTime.toISO(),
						end: dayEndTime.toISO(),
						duration: dayEndTime.diff(startTime).as('minutes'),
					});
				}

				return {
					success: true,
					freeSlots: freeSlots.filter(slot => slot.duration >= 30),  // Filter for slots at least 30 min
					dateRange,
				};
			}

			case 'busy_times': {
				// Get list of events
				const eventsResult = await calendarService.events.list({
					calendarId: 'primary',
					timeMin: dateRange.start,
					timeMax: dateRange.end,
					singleEvents: true,
					orderBy: 'startTime',
				});

				const events = eventsResult.data.items || [];
				const busyTimes = events.map(event => ({
					summary: event.summary,
					start: event.start.dateTime || event.start.date,
					end: event.end.dateTime || event.end.date,
					id: event.id,
				}));

				return {
					success: true,
					busyTimes,
					dateRange,
				};
			}

			case 'event_details': {
				if (!queryData.event_title) {
					return {
						success: false,
						error: 'Event title is required for detailed event information',
					};
				}

				// Search for the specific event
				const eventsResult = await calendarService.events.list({
					calendarId: 'primary',
					timeMin: dateRange.start,
					timeMax: dateRange.end,
					q: queryData.event_title,
					singleEvents: true,
					orderBy: 'startTime',
				});

				const events = eventsResult.data.items || [];

				if (events.length === 0) {
					return {
						success: false,
						error: 'No matching events found',
					};
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
						htmlLink: event.htmlLink,
					})),
				};
			}

			default:
				return {
					success: false,
					error: 'Unknown query type',
				};
		}
	} catch (error) {
		console.error('Error querying calendar:', error);
		return {
			success: false,
			error: error.message,
		};
	}
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { message } = await request.json();

		if (!message || typeof message !== 'string') {
			return json({ error: 'Invalid request format' }, { status: 400 });
		}

		// Get user from cookies
		const user = await getUserFromCookies(cookies);

		if (!user?.googleToken) {
			return json({ error: 'Google Calendar authentication required' }, { status: 401 });
		}

		// Get calendar service
		const calendarService = await getCalendarService(user.googleToken);

		// Get structured data from LLM
		const llmResponse = await getNebiusLlmResponse(message);

		if (llmResponse.type === 'error') {
			return json({ error: llmResponse.data.message }, { status: 500 });
		}

		if (llmResponse.type === 'chat') {
			return json({
				type: 'chat',
				message: llmResponse.data.response || 'I understand, but I need more details to help with your calendar.'
			});
		}

		// Handle structured calendar operations
		const { action, ...actionData } = llmResponse.data;
		let result;

		switch (action) {
			case 'create':
				result = await createCalendarEvent(calendarService, actionData);
				break;

			case 'reschedule':
				result = await rescheduleCalendarEvent(calendarService, actionData);
				break;

			case 'cancel':
				result = await cancelCalendarEvent(calendarService, actionData);
				break;

			case 'query':
				result = await queryCalendar(calendarService, actionData);
				break;

			case 'chat':
				return json({
					type: 'chat',
					message: actionData.response || 'I understand. What would you like to do with your calendar?'
				});

			default:
				result = {
					success: false,
					error: 'Unknown calendar action requested'
				};
		}

		return json({
			type: action,
			result,
			original_data: actionData
		});

	} catch (error) {
		console.error('Error handling calendar request:', error);
		return json({ error: `Error processing calendar request: ${error.message}` }, { status: 500 });
	}
};