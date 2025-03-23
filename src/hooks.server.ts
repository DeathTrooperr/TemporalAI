import { redirect, type Handle } from '@sveltejs/kit';
import { getUserFromCookies } from '$lib/server/auth.js';

// List of public routes that don't require authentication
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/login/auth/google',
    '/error',
    '/favicon.ico',
];

export const handle: Handle = async ({ event, resolve }) => {
    const url = new URL(event.request.url);
    const path = url.pathname;

    // Check if the route is an API route
    const isApiRoute = path.startsWith('/api/');

    // Check if the route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));

    // Check if the path is a static asset
    const isStaticAsset = path.startsWith('/assets/') ||
        path.endsWith('.js') ||
        path.endsWith('.css') ||
        path.endsWith('.ico');

    // If it's not a public route, static asset, or API request, check for auth
    if (!isPublicRoute && !isStaticAsset) {
        const user = getUserFromCookies(event.cookies);

        if (!user) {
            // Redirect to login if no user found
            return redirect(302, '/login');
        }

        // Set user in locals to be accessible in routes
        event.locals.user = user;
    }

    // For API routes, check authentication
    if (isApiRoute) {
        const user = getUserFromCookies(event.cookies);

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        event.locals.user = user;
    }

    // Continue with the request
    return resolve(event);
};