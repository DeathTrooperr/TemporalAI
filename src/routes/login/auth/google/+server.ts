import { redirect } from '@sveltejs/kit';
import { setAuthCookie } from '$lib/server/auth.js';
import { env } from '$env/dynamic/private';
import type { UserSession } from '$lib/interfaces/userSession.js';

const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET as string;
const REDIRECT_URI = env.REDIRECT_URI as string;
const AUTH_REDIRECT = '/app';

export async function GET({ url, cookies }) {
	const code = url.searchParams.get('code');

	// Step 1: If no code, redirect to Google OAuth
	if (!code) {
		const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
		authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
		authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
		authUrl.searchParams.append('response_type', 'code');
		authUrl.searchParams.append(
			'scope',
			'email profile https://www.googleapis.com/auth/calendar.events.owned'
		);
		authUrl.searchParams.append('access_type', 'offline');
		authUrl.searchParams.append('prompt', 'consent');

		return redirect(302, authUrl.toString());
	}

	// Step 2: Exchange code for tokens
	try {
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				code,
				client_id: GOOGLE_CLIENT_ID,
				client_secret: GOOGLE_CLIENT_SECRET,
				redirect_uri: REDIRECT_URI,
				grant_type: 'authorization_code'
			})
		});

		const tokens = await tokenResponse.json();

		if (!tokens.access_token) {
			throw new Error('Failed to get access token');
		}

		// Step 3: Get user info with the access token
		const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: { Authorization: `Bearer ${tokens.access_token}` }
		});

		const userData = await userInfoResponse.json();

		const user: UserSession = {
			id: userData.id,
			email: userData.email,
			name: userData.name,
			picture: userData.picture,
			token: tokens.access_token
		};

		// Step 5: Set auth cookie
		setAuthCookie(cookies, user);
	} catch (error) {
		console.error('Failed to authenticate with Google');
		console.error('Error:', error);
		return redirect(302, '/login?error=auth_failed');
	}
	return redirect(302, AUTH_REDIRECT);
}
