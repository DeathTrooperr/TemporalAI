import { redirect, type Handle } from '@sveltejs/kit';
import { clearAuthCookie, getUserFromCookies, setAuthCookie } from '$lib/server/utlis/auth.js';

// List of protected routes that require authentication
const PROTECTED_ROUTES = ['/app', '/api'];

export const handle: Handle = async ({ event, resolve }) => {
	const url = new URL(event.request.url);
	const path = url.pathname;

	// Get user from cookies
	const user = getUserFromCookies(event.cookies);

	// Special handling for login and logout
	if (path === '/login' && user) {
		return redirect(302, '/app');
	} else if (path === '/logout') {
		clearAuthCookie(event.cookies);
		return redirect(302, '/');
	}

	// Check if the path is a static asset
	const isStaticAsset =
		path.startsWith('/assets/') ||
		path.endsWith('.js') ||
		path.endsWith('.css') ||
		path.endsWith('.ico');

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
		const { token, refreshToken, ...safeUser } = user; // Exclude sensitive tokens
		event.locals.user = safeUser;
	}

	// Continue with the request
	return resolve(event);
};
