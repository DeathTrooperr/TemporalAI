// src/routes/auth/logout/+server.ts
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    // Set the cookie to expire immediately.
    const expiredCookie = `token=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
    return new Response(null, {
        status: 302,
        headers: {
            'Set-Cookie': expiredCookie,
            Location: '/'
        }
    });
};