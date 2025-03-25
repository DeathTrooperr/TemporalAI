import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import type { UserSession } from '$lib/core/interfaces/userSession.js';
import type { Cookies } from '@sveltejs/kit';
import { DEV } from 'esm-env';

const JWT_SECRET = env.JWT_SECRET as string;
const ENCRYPTION_KEY = env.ENCRYPTION_KEY as string;
const ENCRYPTION_IV = env.ENCRYPTION_IV as string;
const COOKIE_NAME = 'session';
const JWT_EXPIRES_IN = '1h';

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hexString: string): Uint8Array {
	return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

// Helper function to convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
	return new TextEncoder().encode(str);
}

// Helper function to convert Uint8Array to string
function uint8ArrayToString(array: Uint8Array): string {
	return new TextDecoder().decode(array);
}

// Encrypt data using AES-GCM (Web Crypto API)
async function encryptData(data: string): Promise<string> {
	const iv = hexToUint8Array(ENCRYPTION_IV);
	const key = await crypto.subtle.importKey(
		'raw',
		hexToUint8Array(ENCRYPTION_KEY),
		{ name: 'AES-GCM' },
		false,
		['encrypt']
	);

	const encodedData = stringToUint8Array(data);
	const encryptedBuffer = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		key,
		encodedData
	);

	// Convert encrypted buffer to base64
	return btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
}

// Decrypt data using AES-GCM (Web Crypto API)
async function decryptData(encryptedData: string): Promise<string> {
	try {
		const iv = hexToUint8Array(ENCRYPTION_IV);
		const key = await crypto.subtle.importKey(
			'raw',
			hexToUint8Array(ENCRYPTION_KEY),
			{ name: 'AES-GCM' },
			false,
			['decrypt']
		);

		// Convert base64 to array buffer
		const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

		const decryptedBuffer = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv },
			key,
			encryptedBytes
		);

		return uint8ArrayToString(new Uint8Array(decryptedBuffer));
	} catch (error) {
		console.error('Decryption error:', error);
		throw new Error('Failed to decrypt data');
	}
}

// Create JWT token - first sign, then encrypt
export async function createToken(user: UserSession): Promise<string> {
	const signedToken = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
	return await encryptData(signedToken);
}

// Verify JWT token - first decrypt, then verify
export async function verifyToken(encryptedToken: string): Promise<UserSession | null> {
	try {
		const token = await decryptData(encryptedToken);
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
export async function setAuthCookie(cookies: Cookies, user: UserSession): Promise<void> {
	const token = await createToken(user);
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
export async function getUserFromCookies(cookies: Cookies): Promise<UserSession | null> {
	const encryptedToken = cookies.get(COOKIE_NAME);
	if (!encryptedToken) return null;
	return await verifyToken(encryptedToken);
}

// Request a new token from Google's token API using refresh token
export async function refreshUserSession(cookies: Cookies): Promise<boolean> {
	try {
		const encryptedToken = cookies.get(COOKIE_NAME);
		if (!encryptedToken) return false;

		const token = await decryptData(encryptedToken);
		const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

		if (!isValidUserSession(payload)) return false;

		const user = payload as UserSession;

		if (!user.refreshToken) return false;

		// Request new access token from Google using refresh token
		const response = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				client_id: env.GOOGLE_CLIENT_ID as string,
				client_secret: env.GOOGLE_CLIENT_SECRET as string,
				refresh_token: user.refreshToken,
				grant_type: 'refresh_token'
			})
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

		// Set updated user session in cookie
		await setAuthCookie(cookies, updatedUser);
		return true;
	} catch (error) {
		console.error('Failed to refresh user session:', error);
		return false;
	}
}