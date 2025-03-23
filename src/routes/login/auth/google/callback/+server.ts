// src/routes/api/auth/google/callback/+server.ts
import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

// Use the same configuration values
const GOOGLE_CLIENT_ID = ''; // Add your Google Client ID
const GOOGLE_CLIENT_SECRET = ''; // Add your Google Client Secret
const REDIRECT_URI = 'https://your-app.pages.dev/api/auth/google/callback';
const JWT_SECRET = ''; // Add a secure secret for signing JWT

export const GET = async ({ url, cookies }) => {
    const code = url.searchParams.get('code');

    if (!code) {
        return new Response('Authorization code not found', { status: 400 });
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            throw new Error('Failed to get access token');
        }

        // Get user information with the access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        const userData = await userInfoResponse.json();

        // Create JWT with user data
        const token = jwt.sign({
            name: userData.name,
            email: userData.email,
            picture: userData.picture,
            googleToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
        }, JWT_SECRET, {
            expiresIn: '7d',
        });

        // Set JWT as a cookie
        cookies.set('auth', token, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        // Redirect to the main application
        return new Response(null, {
            status: 302,
            headers: { Location: '/' }
        });
    } catch (error) {
        console.error('Authentication error:', error);
        return new Response('Authentication failed', { status: 500 });
    }
};