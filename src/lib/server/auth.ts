import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import type { UserSession } from '$lib/interfaces/userSession.js';
import type { Cookies } from '@sveltejs/kit';
import { DEV } from 'esm-env';

const JWT_SECRET = env.JWT_SECRET as string;
const COOKIE_NAME = 'session';
const JWT_EXPIRES_IN = '7d';

// Create JWT token
export function createToken(user: UserSession): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, });
}

// Verify JWT token
export function verifyToken(token: string): UserSession | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
        if (!isValidUserSession(decoded)) return null;
        return decoded;
    } catch (error) {
        return null;
    }
}

// Helper to validate UserSession type
function isValidUserSession(obj: any): obj is UserSession {
    return obj && typeof obj === 'object' && 'id' in obj;
}

// Set auth cookie with improved typing
export function setAuthCookie(cookies: Cookies, user: UserSession): void {
    const token = createToken(user);
    cookies.set(COOKIE_NAME, token, {
        path: '/',
        httpOnly: true,
        secure: !DEV,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

// Clear auth cookie with improved typing
export function clearAuthCookie(cookies: Cookies): void {
    cookies.delete(COOKIE_NAME, { path: '/' });
}

// Get user from cookies with improved typing
export function getUserFromCookies(cookies: Cookies): UserSession | null {
    const token = cookies.get(COOKIE_NAME);
    if (!token) return null;
    return verifyToken(token);
}

// Improved resignToken function
export function resignToken(cookies: Cookies): boolean {
    try {
        const token = cookies.get(COOKIE_NAME);
        if (!token) return false;
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if (!isValidUserSession(payload)) return false;
        const { exp, iat, ...payloadWithoutExpiry } = payload as JwtPayload;
        setAuthCookie(cookies, payloadWithoutExpiry as UserSession);
        return true;
    } catch (error) {
        console.error('Error resigning token:', error);
        return false;
    }
}