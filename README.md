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
- **Google Calendar Integration**: Google APIs (googleapis 148.0)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Build System**: Vite 6.0
- **Code Quality**: ESLint, Prettier, TypeScript

## Development
To get started with development:
1. Clone the repository
2. Install dependencies:
``` bash
   npm install
```
1. Start the development server:
``` bash
   npm run dev
```
Or open in a browser tab automatically:
``` bash
   npm run dev -- --open
```
## Building for Production
To build the application for production:
``` bash
npm run build
```
You can preview the production build with:
``` bash
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