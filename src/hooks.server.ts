import { redirect, type Handle } from '@sveltejs/kit';
import { getUserFromCookies } from '$lib/server/auth.js';

// List of protected routes that require authentication
const PROTECTED_ROUTES = ['/app', '/api'];

export const handle: Handle = async ({ event, resolve }) => {
	const url = new URL(event.request.url);
	const path = url.pathname;

	// Check if the path is a static asset
	const isStaticAsset =
		path.startsWith('/assets/') ||
		path.endsWith('.js') ||
		path.endsWith('.css') ||
		path.endsWith('.ico');

	// Get user from cookies
	const user = getUserFromCookies(event.cookies);

	// Redirect from login to app if user is already logged in
	if (path === '/login' && user) {
		return redirect(302, '/app');
	}

	// Check if the route requires protection
	const isProtectedRoute = PROTECTED_ROUTES.some(
		(route) => path === route || path.startsWith(route + '/')
	);

	// Handle protected routes that need authentication
	if (isProtectedRoute && !isStaticAsset) {
		if (!user) {
			// Handle API routes differently
			if (path.startsWith('/api/')) {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}
			// Redirect to login for app routes
			return redirect(302, '/login');
		}
	}

	// Set user in locals if available (for all routes)
	if (user) {
		const { token, ...safeUser } = user; // Exclude token
		event.locals.user = safeUser;
	}

	// Continue with the request
	return resolve(event);
};
