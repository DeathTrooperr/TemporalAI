import os
import json
import logging
from datetime import datetime, timedelta
import requests
from flask import Flask, request, jsonify
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from openai import OpenAI
from dotenv import load_dotenv
import re
import pytz


# Load environment variables from .env file
load_dotenv()

# Set up Flask app and logging
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Define scope for GCal API access
SCOPES = ['https://www.googleapis.com/auth/calendar']


def get_calendar_service():
    """Authenticate and get Google Calendar service with OAuth callback on port 8080."""
    creds = None

    # Load stored credentials from token.json if they exist
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)

    # If credentials are missing or invalid, run OAuth on port 8080
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                os.getenv('CLIENT_SECRETS'),
                SCOPES
            )
            # Request offline access to get a refresh token
            creds = flow.run_local_server(port=8080, access_type='offline', prompt='consent')

        # Save the new credentials to token.json, including the refresh token
        with open('token.json', 'w') as token_file:
            token_file.write(creds.to_json())

    # Return authenticated Google Calendar service
    return build('calendar', 'v3', credentials=creds)


def get_nebius_llm_response(user_input):
    """Get structured calendar instruction from Nebius LLM."""
    client = OpenAI(
        base_url="https://api.studio.nebius.com/v1/",
        api_key=os.environ.get("NEBIUS_API_KEY")
    )

    # Get current date and time
    now = datetime.now()
    current_date = now.strftime('%Y-%m-%d')
    current_time = now.strftime('%I:%M %p')

    logging.info(f"Current date: {current_date}, Current time: {current_time}")

    # Read the system message from llm_prompt.txt and format it with the current date and time
    with open('src/routes/api/calendar/llm_prompt.txt', 'r') as file:
        system_message = system_message = f"Today's date is {current_date} and the time is {current_time}.\n"
        system_message += file.read()


    # Send user input and system message to Nebius LLM
    response = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3.1-70B-Instruct",
        max_tokens=512,
        temperature=0.6,
        top_p=0.9,
        extra_body={"top_k": 50},
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": [{"type": "text", "text": user_input}]}
        ]
    )

    # Parse JSON from the Nebius LLM response
    response_content = response.choices[0].message.content
    try:
        logging.info(f"Nebius LLM raw response: {response_content}")
        json_data = json.loads(response_content)  # Attempt to parse directly
        logging.info(f"Nebius LLM parsed JSON: {json_data}")
        return json_data
    except json.JSONDecodeError:
        logging.warning("Direct JSON parsing failed. Trying to extract JSON from triple backticks...")

        # Fallback: Attempt to extract JSON from triple backticks
        json_match = re.search(r'```(?:json)?\n(.*?)\n```', response_content, re.DOTALL)
        if json_match:
            try:
                extracted_json = json.loads(json_match.group(1))  # Parse the extracted JSON content
                logging.info(f"Parsed JSON from triple backticks: {extracted_json}")
                return extracted_json
            except json.JSONDecodeError as e:
                logging.error(f"Failed to parse JSON from extracted content: {e}")

    logging.error(f"Failed to parse JSON from LLM response: {response_content}")
    return {"error": "Could not parse response from LLM"}


def detect_user_timezone():
    """Detect user's timezone using their IP address via worldtimeapi.org."""
    response = requests.get("http://worldtimeapi.org/api/ip")
    if response.status_code == 200:
        data = response.json()
        logging.info(f"Detected timezone: {data.get('timezone', 'Etc/UTC')}\n") #DEBUG
        return data.get('timezone', 'Etc/UTC')  # Returns timezone, e.g., "America/New_York"
    logging.info(f"no timezone detected\n") #DEBUG
    return 'Etc/UTC'


def parse_duration(duration_str):
    """Parse duration string into hours and minutes."""
    hours, minutes = 0, 0
    if 'hour' in duration_str:
        try:
            hours = int(duration_str.split()[0])
        except (ValueError, IndexError):
            pass
    elif 'minute' in duration_str:
        try:
            minutes = int(duration_str.split()[0])
        except (ValueError, IndexError):
            pass
    return hours, minutes


def create_event(calendar_service, event_data):
    """Create a new event in Google Calendar, adjusting for the user's timezone."""
    
    # Detect user's timezone
    user_timezone = detect_user_timezone()
    
    # Localize start and end datetime
    local_tz = pytz.timezone(user_timezone)
    try:
        # Handles both "3 PM" and "3:00 PM" correctly
        start_datetime = datetime.strptime(f"{event_data['date']} {event_data['event_time']}", "%Y-%m-%d %I:%M %p")
    except ValueError:
        # Fallback to handle times without minutes (like "3 PM")
        if ' ' in event_data['event_time']:
            start_datetime = datetime.strptime(f"{event_data['date']} {event_data['event_time']}", "%Y-%m-%d %I %p")
        else:
            raise ValueError(f"Invalid time format: {event_data['event_time']}")

    start_datetime = local_tz.localize(start_datetime)

    # Calculate end time
    duration_hours, duration_minutes = parse_duration(event_data.get('duration', '1 hour'))
    end_datetime = start_datetime + timedelta(hours=duration_hours, minutes=duration_minutes)

    # Create the event dictionary
    event = {
        'summary': event_data.get('event_title', 'Untitled Event'),
        'location': event_data.get('location', ''),
        'description': event_data.get('notes', ''),
        'start': {
            'dateTime': start_datetime.isoformat(),  # ISO format, timezone aware
            'timeZone': user_timezone,
        },
        'end': {
            'dateTime': end_datetime.isoformat(),
            'timeZone': user_timezone,
        }
    }

    # Add attendees if they have valid emails
    attendees = event_data.get('attendees', [])
    if attendees:
        event['attendees'] = [{'email': attendee} for attendee in attendees if '@' in attendee]

    # Insert the event into Google Calendar
    event = calendar_service.events().insert(calendarId='primary', body=event).execute()
    return event.get('id')


def reschedule_event(calendar_service, event_data):
    """Reschedule an existing event in Google Calendar."""
    # Find event to reschedule
    events_result = find_matching_events(
        calendar_service, 
        event_data.get('event_title', ''), 
        event_data.get('date'), 
        event_data.get('event_time')
    )
    
    items = events_result.get('items', [])
    if not items:
        return {"error": "Event not found"}
    
    # Update first matching event
    event = items[0]
    event_id = event['id']
    
    # Update event times
    event['start']['dateTime'] = format_datetime(
        event_data.get('date'), 
        event_data.get('new_time') or event_data.get('event_time')
    )
    
    # Calculate new end time
    duration = event_data.get('duration', '') or calculate_duration_from_event(event)
    event['end']['dateTime'] = calculate_end_time(
        event_data.get('date'),
        event_data.get('new_time') or event_data.get('event_time'),
        duration
    )
    
    # Update other fields if given
    if event_data.get('location'):
        event['location'] = event_data.get('location')
    if event_data.get('notes'):
        event['description'] = event_data.get('notes')
    
    # Update event
    updated_event = calendar_service.events().update(
        calendarId='primary', 
        eventId=event_id, 
        body=event
    ).execute()
    
    return event_id


def cancel_event(calendar_service, event_data):
    """Cancel/delete an event from GCal."""
    # Find the event to cancel
    events_result = find_matching_events(
        calendar_service, 
        event_data.get('event_title', ''), 
        event_data.get('date'), 
        event_data.get('event_time')
    )
    
    items = events_result.get('items', [])
    if not items:
        return {"error": "Event not found"}
    
    # Delete first matching event
    event_id = items[0]['id']
    calendar_service.events().delete(calendarId='primary', eventId=event_id).execute()
    
    return event_id


def find_matching_events(calendar_service, title, date, time):
    """Search for events in GCal, matching by title, date, and time."""

    # Format start and end time to search in a 24-hour window around the specified date
    start_time = format_datetime(date, "12:00 AM")
    end_time = format_datetime(date, "11:59 PM")

    # Search for events with the specified title within the time range
    try:
        events_result = calendar_service.events().list(
            calendarId='primary',
            timeMin=start_time,
            timeMax=end_time,
            q=title,  # Search for events containing the title string
            singleEvents=True,
            orderBy='startTime'
        ).execute()

        items = events_result.get('items', [])
        if items:
            # Optionally filter the events more rigorously by time if needed
            matching_events = [
                event for event in items if title.lower() in event.get('summary', '').lower()
            ]
            return {'items': matching_events}
        else:
            logging.info("No matching events found.")
            return {'items': []}

    except Exception as e:
        logging.error(f"Failed to find events: {e}")
        return {"error": f"Failed to find events: {str(e)}"}


def format_datetime(date_str, time_str):
    """Format date and time strings into ISO format for Google Calendar API."""
    if not date_str or not time_str:
        return datetime.now().isoformat() + 'Z'
    
    # Parse the date
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        # If date_str is not in the expected format, use current date
        date_obj = datetime.now()
    
    # Parse the time
    try:
        # Try 12-hour format (e.g. "3 PM", "11:30 AM")
        if 'AM' in time_str or 'PM' in time_str:
            if ':' in time_str:
                time_obj = datetime.strptime(time_str, '%I:%M %p')
            else:
                time_obj = datetime.strptime(time_str, '%I %p')
        else:
            # Try 24-hour format
            if ':' in time_str:
                time_obj = datetime.strptime(time_str, '%H:%M')
            else:
                time_obj = datetime.strptime(time_str, '%H')
    except ValueError:
        # If time_str is not in the expected format, use current time
        time_obj = datetime.now()
    
    # Combine date and time
    combined = datetime(
        date_obj.year, 
        date_obj.month, 
        date_obj.day,
        time_obj.hour,
        time_obj.minute
    )
    
    return combined.isoformat() + 'Z'


def calculate_end_time(date_str, time_str, duration='1 hour'):
    """Calculate the end time based on start time and duration."""
    start_time = format_datetime(date_str, time_str)
    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    
    # Parse the duration
    hours = 1  # Default to 1 hr
    minutes = 0
    
    if 'hour' in duration:
        try:
            hours = int(duration.split()[0])
        except (ValueError, IndexError):
            pass
    elif 'minute' in duration:
        try:
            minutes = int(duration.split()[0])
            hours = 0
        except (ValueError, IndexError):
            pass
    
    # Calculate end time
    end_dt = start_dt + timedelta(hours=hours, minutes=minutes)
    return end_dt.isoformat().replace('+00:00', 'Z')


def calculate_duration_from_event(event):
    """Calculate duration of an existing event."""
    start_time = event['start']['dateTime']
    end_time = event['end']['dateTime']
    
    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
    
    delta = end_dt - start_dt
    total_minutes = delta.total_seconds() / 60
    
    if total_minutes % 60 == 0:
        return f"{int(total_minutes / 60)} hour{'s' if total_minutes / 60 > 1 else ''}"
    else:
        return f"{int(total_minutes)} minute{'s' if total_minutes > 1 else ''}"
    

@app.route('/api/calendar', methods=['POST', 'GET'])
def handle_calendar_request():
    """API endpoint to handle calendar requests from the chat using Nebius LLM."""
    if request.method == 'GET':
        return jsonify({"message": "Calendar API is running"}), 200

    data = request.json
    user_message = data.get('message', '')

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    logging.info(f"Received message: {user_message}")

    # Get structured data from Nebius LLM
    parsed_data = get_nebius_llm_response(user_message)
    if 'error' in parsed_data:
        return jsonify(parsed_data), 500

    try:
        calendar_service = get_calendar_service()
    except Exception as e:
        return jsonify({"error": f"Failed to authenticate with Google Calendar: {str(e)}"}), 500

    action = parsed_data.get('action', '').lower()
    logging.info(f"Action determined: {action}")

    result = {"status": "success", "action": action}
    try:
        if action == 'create':
            event_id = create_event(calendar_service, parsed_data)
            result["event_id"] = event_id
            result["message"] = f"Created event: {parsed_data.get('event_title')}"
        elif action == 'reschedule':
            event_id = reschedule_event(calendar_service, parsed_data)
            result["event_id"] = event_id
            result["message"] = f"Rescheduled event: {parsed_data.get('event_title')}"
        elif action == 'cancel':
            event_id = cancel_event(calendar_service, parsed_data)
            result["event_id"] = event_id
            result["message"] = f"Cancelled event: {parsed_data.get('event_title')}"
        else:
            result = {
                "status": "error",
                "message": "Unclear action. Please specify if you want to create, reschedule, or cancel an event."
            }
    except Exception as e:
        result = {"status": "error", "message": f"Error processing calendar request: {str(e)}"}

    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Flask app runs on port 5000
