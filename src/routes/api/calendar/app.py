import os
import json
from datetime import datetime, timedelta
import requests
from flask import Flask, request, jsonify
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Define scope for GCal API access
SCOPES = ['https://www.googleapis.com/auth/calendar']


def get_calendar_service():
    """Authenticate with GCal."""
    creds = None
    # Check if token.json file exists and get stored user credentials
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # If credentials are not valid, refresh or prompt user to log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Use OAuth flow to get new credentials
            flow = InstalledAppFlow.from_client_secrets_file(
                os.getenv('CREDENTIALS_FILE'), SCOPES)
            flow.redirect_uri = 'http://localhost:8080/'  # TEST: Change this from 5000 to 8080
            creds = flow.run_local_server(port=8080)  # Change port
        # Save the new credentials to token.json
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return build('calendar', 'v3', credentials=creds)


def get_nebius_llm_response(user_input):
    """Get structured calendar instruction from Nebius LLM."""
    client = OpenAI(
        base_url="https://api.studio.nebius.com/v1/",
        api_key=os.environ.get("NEBIUS_API_KEY")
    )
    
    # Get current date and time
    now = datetime.now()
    current_time_str = now.strftime("%Y-%m-%dT%H:%M:%S")
    day_of_week = now.strftime("%A")
    
    system_message = """Today's date is {0} and the time is {1}.
You are an intelligent assistant that parses user commands related to Google Calendar and returns structured information in JSON format. Your task is to extract relevant details from the user's input, handle vague or implied actions when necessary, and convert relative dates to specific calendar dates. Ignore any extra information not needed for JSON output, including timezones or reminders.
    """.format(now.strftime("%Y-%m-%d"), now.strftime("%I:%M %p"))
    
    # Send the user input and system message to Nebius LLM to process
    response = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3.1-70B-Instruct",
        max_tokens=512,
        temperature=0.6,
        top_p=0.9,
        extra_body={
            "top_k": 50
        },
        messages=[
            {
                "role": "system",
                "content": system_message
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": user_input
                    }
                ]
            }
        ]
    )
    
    # Get JSON output from Nebius LLM
    response_content = response.choices[0].message.content
    
    # Try to parse the JSON from the output
    try:
        json_data = json.loads(response_content)
        return json_data
    except json.JSONDecodeError:
        import re
        json_match = re.search(r'```json\n(.*?)\n```', response_content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except:
                pass
                
        # Last resort: try to find anything that looks like JSON
        json_match = re.search(r'{.*}', response_content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except:
                return {"error": "Could not parse response from LLM"}
        
        return {"error": "Could not parse response from LLM"}


def create_event(calendar_service, event_data):
    """Create a new event in GCal."""
    event = {
        'summary': event_data.get('event_title', 'Untitled Event'),
        'location': event_data.get('location', ''),
        'description': event_data.get('notes', ''),
        'start': {
            'dateTime': format_datetime(event_data.get('date'), event_data.get('event_time')),
            'timeZone': 'Etc/UTC',
        },
        'end': {
            'dateTime': calculate_end_time(
                event_data.get('date'), 
                event_data.get('event_time'),
                event_data.get('duration', '1 hour')
            ),
            'timeZone': 'Etc/UTC',
        }
    }
    
    # Add attendees if given
    attendees = event_data.get('attendees', [])
    if attendees:
        event['attendees'] = [{'email': attendee} if '@' in attendee else {'displayName': attendee} 
                            for attendee in attendees]
    
    # Insert event into GCal
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
    """Search for events in GCal."""
    # Create time boundaries for the search
    start_time = format_datetime(date, time)
    end_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    end_time += timedelta(hours=1)
    end_time_str = end_time.isoformat().replace('+00:00', 'Z')
    
    # Query parameters for the search
    query_params = {
        'calendarId': 'primary',
        'timeMin': start_time,
        'timeMax': end_time_str,
        'singleEvents': True,
        'orderBy': 'startTime'
    }
    
    # Add title to the query if given
    if title:
        query_params['q'] = title
    
    return calendar_service.events().list(**query_params).execute()


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
    """API endpoint to handle calendar requests from the chat."""
    if request.method == 'GET':
        return jsonify({"message": "Calendar API is running"}), 200
    
    data = request.json
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({"error": "No message provided"}), 400
    
    # Get structured data from Nebius LLM
    parsed_data = get_nebius_llm_response(user_message)
    
    if 'error' in parsed_data:
        return jsonify(parsed_data), 500
    
    # Get calendar service
    try:
        calendar_service = get_calendar_service()
    except Exception as e:
        return jsonify({"error": f"Failed to authenticate with Google Calendar: {str(e)}"}), 500
    
    # Execute the appropriate action
    action = parsed_data.get('action', '').lower()
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
    app.run(debug=True, port=5000)
