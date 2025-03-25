<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { calendarStore } from '../../stores/calendarStore.js';

	$: year = $calendarStore.currentYear;

	async function refreshEvents() {
		try {
			const response = await fetch(`/api/calendar/?year:${year}`);
			if (response.ok) {
				calendarStore.updateEvents(await response.json());
			}
		} catch (error) {
			console.error('Failed to fetch events:', error);
		}
	}

	// Define types for our chat messages
	interface ChatMessage {
		id: number;
		sender: 'user' | 'ai';
		text: string;
		timestamp: Date;
		isLoading?: boolean;
	}

	let messages: ChatMessage[] = [
		{
			id: 1,
			sender: 'ai',
			text: "Hello! I'm your AI assistant for TemporalAI. How can I help you manage your calendar today?",
			timestamp: new Date()
		}
	];

	let newMessage = '';
	let chatContainer: HTMLElement;
	let messageInput: HTMLTextAreaElement;
	let isAtBottom = true;

	// Example suggested queries
	const suggestedQueries: string[] = [
		'Schedule a meeting tomorrow at 2 PM',
		'Show me my appointments for next week',
		'Reschedule my 3 PM meeting to 4 PM',
		"What's on my calendar for today?"
	];

	// Constants for UI behavior
	const TEXTAREA_MAX_HEIGHT = 150; // pixels
	const SCROLL_THRESHOLD = 20; // pixels from bottom to consider "at bottom"
	const ERROR_MESSAGE =
		'Sorry, I encountered an error while processing your request. Please try again later.';
	const FALLBACK_MESSAGE = "Sorry, I couldn't process your request.";

	// Auto-resize the textarea based on content
	function resizeTextarea(): void {
		if (!messageInput) return;

		// Reset height to measure the scrollHeight correctly
		messageInput.style.height = 'auto';

		// Set the height based on content (with a maximum height cap)
		const newHeight = Math.min(messageInput.scrollHeight, TEXTAREA_MAX_HEIGHT);
		messageInput.style.height = `${newHeight}px`;

		// Add scrollbar if content exceeds max height
		messageInput.style.overflowY = newHeight === TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
	}

	// Scroll management
	function checkIfAtBottom(): void {
		if (!chatContainer) return;

		const scrollBottom =
			chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
		isAtBottom = scrollBottom < SCROLL_THRESHOLD;
	}

	function handleScroll(): void {
		checkIfAtBottom();
	}

	function scrollToBottom(): void {
		if (!chatContainer) return;
		chatContainer.scrollTop = chatContainer.scrollHeight;
	}

	// Message management
	function addMessage(
		messageData: Partial<ChatMessage> & { text: string; sender: 'user' | 'ai' }
	): void {
		const newId = messages.length + 1;
		messages = [
			...messages,
			{
				id: newId,
				timestamp: new Date(),
				...messageData
			}
		];
		return;
	}

	function removeLoadingMessages(): void {
		messages = messages.filter((msg) => !msg.isLoading);
	}

	// Send message functionality
	async function sendMessage(): Promise<void> {
		if (newMessage.trim() === '') return;

		// Store and clear user message
		const userMessage = newMessage;
		addMessage({ sender: 'user', text: userMessage });
		newMessage = '';

		// Reset textarea height after clearing
		setTimeout(resizeTextarea, 0);

		try {
			// Add loading message with animated bubble
			addMessage({ sender: 'ai', text: '', isLoading: true });

			// Make request to our AI endpoint
			const response = await fetch('/api/ai', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: userMessage })
			});

			if (!response.ok) {
				throw new Error(`Error: ${response.status}`);
			}

			const data = await response.json();
			refreshEvents().then(() => console.log('refreshed'));

			// Remove loading message and add the actual response
			removeLoadingMessages();
			addMessage({
				sender: 'ai',
				text: data.nlResponse ? data.nlResponse : FALLBACK_MESSAGE
			});
		} catch (error) {
			console.error('Error communicating with AI:', error);

			// Replace thinking message with error message
			removeLoadingMessages();
			addMessage({ sender: 'ai', text: ERROR_MESSAGE });
		}
	}

	// Handle key press events in the textarea
	function handleKeyDown(event: KeyboardEvent): void {
		// If Enter is pressed without Shift key, submit the message
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault(); // Prevent adding a new line
			sendMessage();
		}
		// If Shift+Enter is pressed, allow the default behavior (new line)
	}

	function sendSuggestedQuery(query: string): void {
		newMessage = query;
		setTimeout(resizeTextarea, 0);
		sendMessage();
	}

	// Format time for messages
	function formatTime(date: Date): string {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	// Lifecycle
	onMount(() => {
		if (chatContainer) {
			scrollToBottom();
			checkIfAtBottom();
		}
		// Initialize textarea height
		resizeTextarea();
	});

	// Auto scroll to bottom when new messages arrive, but only if already at bottom
	$: if (messages && chatContainer && isAtBottom) {
		setTimeout(scrollToBottom, 0);
	}

	// Watch for changes to newMessage to resize textarea
	$: if (newMessage !== undefined) {
		setTimeout(resizeTextarea, 0);
	}
</script>

<div class="flex h-full flex-col overflow-hidden rounded-lg bg-gray-900 text-white shadow-2xl">
	<!-- Header with same styling as landing page -->
	<div
		class="border-gradient-horizontal flex items-center justify-between border-b bg-gray-800 p-5"
	>
		<div>
			<h3 class="text-xl font-bold">TemporalAI Assistant</h3>
		</div>
		<div class="rounded-full bg-gray-700 px-2 py-1 text-xs text-gray-400">Online</div>
	</div>

	<!-- Animated gradient elements similar to landing page -->
	<div class="relative flex-1 overflow-hidden">
		<!-- Chat messages container with custom scrollbar -->
		<div
			class="scrollbar-styled relative z-10 h-full flex-1 space-y-4 overflow-y-auto p-4"
			bind:this={chatContainer}
			on:scroll={handleScroll}
		>
			{#each messages as message (message.id)}
				<div
					class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}"
					in:fade={{ duration: 200 }}
				>
					<div
						class="max-w-3/4 {message.sender === 'user'
							? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
							: 'border border-gray-700 bg-gray-800 text-gray-200'}
						rounded-lg p-4 shadow-lg"
						in:slide|local={{ duration: 150, easing: quintOut }}
					>
						{#if message.isLoading}
							<div class="flex items-center space-x-1">
								<div class="loading-bubble h-2 w-2 rounded-full bg-gray-400 opacity-75"></div>
								<div
									class="loading-bubble animation-delay-200 h-2 w-2 rounded-full bg-gray-400 opacity-75"
								></div>
								<div
									class="loading-bubble animation-delay-400 h-2 w-2 rounded-full bg-gray-400 opacity-75"
								></div>
							</div>
						{:else}
							<div>{message.text}</div>
						{/if}

						<!-- Only show timestamp for AI messages, not for user messages -->
						{#if message.sender === 'ai' && !message.isLoading}
							<div class="mt-1 text-right text-xs opacity-75">
								{formatTime(message.timestamp)}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Suggested queries section -->
	{#if messages.length === 1}
		<div class="px-4 pb-4">
			<div class="mb-2 text-sm text-gray-300">Try asking:</div>
			<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
				{#each suggestedQueries as query}
					<button
						on:click={() => sendSuggestedQuery(query)}
						class="cursor-pointer rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-left text-sm text-gray-300 transition hover:bg-gray-800"
					>
						{query}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Input area styled to match landing page terminal style -->
	<div class="border-t border-gray-700 bg-gray-800 p-4">
		<form on:submit|preventDefault={sendMessage} class="flex space-x-2">
			<textarea
				bind:this={messageInput}
				bind:value={newMessage}
				placeholder="Type your message..."
				rows="1"
				on:input={resizeTextarea}
				on:keydown={handleKeyDown}
				class="min-h-[46px] flex-grow resize-none rounded-lg border border-gray-700 bg-gray-900 p-3 text-gray-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
			></textarea>
			<button
				type="submit"
				class="flex transform cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 font-bold text-white transition hover:scale-105 hover:from-blue-600 hover:to-purple-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		</form>
	</div>
</div>

<style>
	.border-gradient-horizontal {
		border-image: linear-gradient(to left, #3b82f6, #8b5cf6) 1;
	}

	.loading-bubble {
		animation: pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	.animation-delay-200 {
		animation-delay: 200ms;
	}

	.animation-delay-400 {
		animation-delay: 400ms;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Ensure transitions work properly */
	:global(.scrollbar-styled > div) {
		transform-origin: top;
	}
</style>
