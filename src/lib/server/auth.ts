import jwt from 'jsonwebtoken';
import { dev } from '$app/environment';

export interface UserSession {
    id: string;
    email: string;
    name: string;
    picture: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;
const COOKIE_NAME = 'session';
const JWT_EXPIRES_IN = '7d';

// Create JWT token
export function createToken(user: UserSession): string {
    return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): UserSession | null {
    try {
        return jwt.verify(token, JWT_SECRET) as UserSession;
    } catch (error) {
        return null;
    }
}

// Set auth cookie
export function setAuthCookie(cookies: any, user: UserSession) {
    const token = createToken(user);
    cookies.set(COOKIE_NAME, token, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

// Clear auth cookie
export function clearAuthCookie(cookies: any) {
    cookies.delete(COOKIE_NAME, { path: '/' });
}

// Get user from cookies
export function getUserFromCookies(cookies: any): UserSession | null {
    const token = cookies.get(COOKIE_NAME);
    if (!token) return null;
    return verifyToken(token);
}