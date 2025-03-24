import { redirect } from '@sveltejs/kit';
import { clearAuthCookie } from '$lib/server/utlis/auth.js';

export function GET({ cookies }) {
	clearAuthCookie(cookies);
	return redirect(302, '/?logout=true');
}
