// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { UserSession } from '$lib/server/utlis/auth.js';

declare global {
	namespace App {
		interface Locals {
			user?: UserSession;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
