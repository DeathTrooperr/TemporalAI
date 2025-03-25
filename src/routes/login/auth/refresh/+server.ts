import { json } from '@sveltejs/kit';
import { getUserFromCookies, refreshUserSession } from '$lib/server/utlis/auth.js';

export async function GET({ cookies }) {
	const user = await getUserFromCookies(cookies);

	if (!user) {
		return json({ success: false, message: 'Not authenticated' }, { status: 401 });
	}

	await refreshUserSession(cookies);

	return json({ success: true, message: 'Token refreshed successfully' });
}
