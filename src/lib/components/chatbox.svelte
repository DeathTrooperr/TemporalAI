<script lang="ts">
	import { onMount } from 'svelte';

	let messages = [
		{
			id: 1,
			sender: 'ai',
			text: "Hello! I'm your AI assistant for TemporalAI. How can I help you manage your calendar today?",
			timestamp: new Date()
		}
	];

	let newMessage = '';
	let chatContainer;
	let messageInput;
	let isAtBottom = true;

	// Example suggested queries
	const suggestedQueries = [
		'Schedule a meeting tomorrow at 2 PM',
		'Show me my appointments for next week',
		'Reschedule my 3 PM meeting to 4 PM',
		"What's on my calendar for today?"
	];

	// Auto-resize the textarea based on content
	function resizeTextarea() {
		if (!messageInput) return;

		// Reset height to measure the scrollHeight correctly
		messageInput.style.height = 'auto';

		// Set the height based on content (with a maximum height cap)
		const maxHeight = 150; // maximum height in pixels
		const newHeight = Math.min(messageInput.scrollHeight, maxHeight);
		messageInput.style.height = `${newHeight}px`;

		// Add scrollbar if content exceeds max height
		messageInput.style.overflowY = newHeight === maxHeight ? 'auto' : 'hidden';
	}

	// Check if user is at bottom of chat
	function checkIfAtBottom() {
		if (!chatContainer) return;

		const threshold = 20; // pixels from bottom to consider "at bottom"
		const scrollBottom =
			chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
		isAtBottom = scrollBottom < threshold;
	}

	function handleScroll() {
		checkIfAtBottom();
	}

	async function sendMessage() {
		if (newMessage.trim() === '') return;

		// Add user message
		messages = [
			...messages,
			{
				id: messages.length + 1,
				sender: 'user',
				text: newMessage,
				timestamp: new Date()
			}
		];

		// Clear input
		const userMessage = newMessage;
		newMessage = '';

		// Reset textarea height after clearing
		setTimeout(resizeTextarea, 0);

		try {
			// Add temporary "thinking" message
			const thinkingId = messages.length + 1;
			messages = [
				...messages,
				{
					id: thinkingId,
					sender: 'ai',
					text: "Thinking...",
					isLoading: true,
					timestamp: new Date()
				}
			];

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
			console.log('Response from AI:', data);

			// Remove the thinking message and add the actual response
			messages = messages.filter(msg => !msg.isLoading);
			messages = [
				...messages,
				{
					id: messages.length + 1,
					sender: 'ai',
					text: data.status === "success" ? data.message : "Sorry, I couldn't process your request.",
					timestamp: new Date()
				}
			];
		} catch (error) {
			console.error('Error communicating with AI:', error);

			// Replace thinking message with error message
			messages = messages.filter(msg => !msg.isLoading);
			messages = [
				...messages,
				{
					id: messages.length + 1,
					sender: 'ai',
					text: "Sorry, I encountered an error while processing your request. Please try again later.",
					timestamp: new Date()
				}
			];
		}
	}

	// Handle key press events in the textarea
	function handleKeyDown(event) {
		// If Enter is pressed without Shift key, submit the message
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault(); // Prevent adding a new line
			sendMessage();
		}
		// If Shift+Enter is pressed, allow the default behavior (new line)
	}

	function sendSuggestedQuery(query) {
		newMessage = query;
		setTimeout(resizeTextarea, 0);
		sendMessage();
	}

	// Auto scroll to bottom when new messages arrive, but only if already at bottom
	$: if (messages && chatContainer && isAtBottom) {
		setTimeout(() => {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}, 0);
	}

	// Watch for changes to newMessage to resize textarea
	$: if (newMessage !== undefined) {
		setTimeout(resizeTextarea, 0);
	}

	// Initialize scroll position and check status
	onMount(() => {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
			checkIfAtBottom();
		}
		// Initialize textarea height
		resizeTextarea();
	});

	// Format time for messages
	function formatTime(date) {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
				<div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
					<div
						class="max-w-3/4 {message.sender === 'user'
							? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
							: 'border border-gray-700 bg-gray-800 text-gray-200'}
                        rounded-lg p-4 shadow-lg"
					>
						<div>{message.text}</div>
						<div class="mt-1 text-right text-xs opacity-75">
							{formatTime(message.timestamp)}
						</div>
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
</style>
