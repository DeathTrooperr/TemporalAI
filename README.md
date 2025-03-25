# TemporalAI

## Overview

TemporalAI is an AI-powered calendar management assistant built with Svelte 5 and SvelteKit. The application provides an intelligent interface to help users manage their calendar events, appointments, and schedules through natural language interactions.

## Features

- **AI-Powered Calendar Management**: Interact with your calendar through natural conversations
- **Modern UI**: Built with Svelte 5 and styled with Tailwind CSS
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Secure Authentication**: JWT-based authentication for user accounts

## Technology Stack

- **Frontend**: Svelte 5, SvelteKit 2.0
- **Styling**: Tailwind CSS 4.0 with Typography and Forms plugins
- **Date/Time Handling**: Luxon 3.5
- **AI Integration**: OpenAI API 4.89
- **Google Calendar Integration**: Google APIs &lt;googleapis 148.0&gt;
- **Authentication**: JWT &lt;jsonwebtoken 9.0.2&gt;
- **Build System**: Vite 6.0
- **Code Quality**: ESLint, Prettier, TypeScript

## Development

To get started with development:

1. Clone the repository
2. Install dependencies:

```bash
   npm install
```

1. Start the development server:

```bash
   npm run dev
```

Or open in a browser tab automatically:

```bash
   npm run dev -- --open
```

## User Input Guidelines

Events should have a distinct name. For example, don't just say "meeting", specify what kind of meeting it is.

- **Bad Example**:
  - User input: "Reschedule my meeting to 4 PM tomorrow."
- **Good Example**:
  - User input: "Reschedule my project planning meeting with John to 4 PM tomorrow."

### Create an Event

- Format: &lt;action&gt; &lt;event_name&gt; &lt;attendees&gt; &lt;time of event&gt; &lt;date of event&gt; &lt;length of event&gt;
- Example: "Create a meeting with John at 3 PM tomorrow that's 1hr long."

### Delete an Event

- Format: &lt;action&gt; &lt;event_name&gt; &lt;attendees&gt; &lt;time of event&gt;
- Example: "Cancel my meeting with John tomorrow."

### Reschedule an Event

- Works best if you mention the specific name of the event.
- Format: &lt;action&gt; &lt;event_name&gt; &lt;attendees&gt; &lt;NEW time of event&gt;
- Example: "Reschedule my project planning meeting with John to 4 PM tomorrow."

## Our vision

Some key enhancements we've slated for future development:

- **Handle more input variety**: Improve the AI's ability to understand and process a wider range of natural language inputs
- **Handling events with the same names but different dates/times**: Enhance the system to manage events that have identical names but occur at different times or dates
- **UI improvements**: Continously refine the UI to be more intuitive and user-friendly
- **More mobile friendly**: Focus on making the app more responsive and usable on mobile devices
- **Integrate classic calendar features**: Add traditional calendar functionalities like clicking into events to view or edit details

## Building for Production

To build the application for production:

```bash
npm run build
```

You can preview the production build with:

```bash
npm run preview
```

## Cloudflare Deployment

This project was originally intended to be deployed with Cloudflare Pages using the `@sveltejs/adapter-cloudflare` adapter. While the foundation for Cloudflare deployment has been set up, these features weren't fully completed due to time constraints. Future development will focus on:

- Completing Cloudflare Functions integration
- Setting up Cloudflare KV for data storage
- Implementing proper environment variable management for Cloudflare
- Configuring Cloudflare deployment pipelines

## Project Structure

- `src/lib` - Core library components and functionality
- `src/routes` - SvelteKit routes and pages
- `static` - Static assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
