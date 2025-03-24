import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import type { UserSession } from '../interfaces/userSession.js';
import type { Cookies } from '@sveltejs/kit';
import { DEV } from 'esm-env';
import crypto from 'crypto';

const JWT_SECRET = env.JWT_SECRET as string;
const ENCRYPTION_KEY = env.ENCRYPTION_KEY as string;
const ENCRYPTION_IV = env.ENCRYPTION_IV as string;
const COOKIE_NAME = 'session';
const JWT_EXPIRES_IN = '1h'

// Encrypt data using AES-256-CBC
function encryptData(data: string): string {
	const iv = Buffer.from(ENCRYPTION_IV, 'hex');
	const key = Buffer.from(ENCRYPTION_KEY, 'hex');
	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
	let encrypted = cipher.update(data, 'utf8', 'base64');
	encrypted += cipher.final('base64');
	return encrypted;
}

// Decrypt data using AES-256-CBC
function decryptData(encryptedData: string): string {
	try {
		const iv = Buffer.from(ENCRYPTION_IV, 'hex');
		const key = Buffer.from(ENCRYPTION_KEY, 'hex');
		const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
		let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
	} catch (error) {
		console.error('Decryption error:', error);
		throw new Error('Failed to decrypt data');
	}
}

// Create JWT token - first sign, then encrypt
export function createToken(user: UserSession): string {
	const signedToken = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
	return encryptData(signedToken);
}

// Verify JWT token - first decrypt, then verify
export function verifyToken(encryptedToken: string): UserSession | null {
	try {
		const token = decryptData(encryptedToken);
		const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
		if (!isValidUserSession(decoded)) return null;
		return decoded;
	} catch (error) {
		console.error('Token verification error:', error);
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
		maxAge: 60 * 60 // 1 hour
	});
}

// Clear auth cookie with improved typing
export function clearAuthCookie(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

// Get user from cookies with improved typing
export function getUserFromCookies(cookies: Cookies): UserSession | null {
	const encryptedToken = cookies.get(COOKIE_NAME);
	if (!encryptedToken) return null;
	return verifyToken(encryptedToken);
}

// Request a new token from Google's token API using refresh token
export async function refreshUserSession(cookies: Cookies): Promise<boolean> {
	try {
		const encryptedToken = cookies.get(COOKIE_NAME);
		if (!encryptedToken) return false;

		const token = decryptData(encryptedToken);
		const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

		if (!isValidUserSession(payload)) return false;

		const user = payload as UserSession;

		if (!user.refreshToken) return false;

		// Request new access token from Google using refresh token
		const response = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				client_id: env.GOOGLE_CLIENT_ID as string,
				client_secret: env.GOOGLE_CLIENT_SECRET as string,
				refresh_token: user.refreshToken,
				grant_type: 'refresh_token',
			}),
		});

		if (!response.ok) {
			console.error('Failed to refresh Google token:', await response.text());
			return false;
		}

		const tokenData = await response.json();

		// Update user session with new access token
		const updatedUser: UserSession = {
			...user,
			token: tokenData.access_token,
		};

		setAuthCookie(cookies, updatedUser);
		return true;
	} catch (error) {
		console.error('Error refreshing token:', error);
		return false;
	}
}