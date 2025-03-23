<script lang="ts">
    import { onMount } from 'svelte';

    let messages = [
        {
            id: 1,
            sender: 'ai',
            text: 'Hello! I\'m your AI assistant for TemporalAI. How can I help you manage your calendar today?',
            timestamp: new Date()
        }
    ];

    let newMessage = '';
    let chatContainer;
    let messageInput;
    let isAtBottom = true;

    // Example suggested queries
    const suggestedQueries = [
        "Schedule a meeting tomorrow at 2 PM",
        "Show me my appointments for next week",
        "Reschedule my 3 PM meeting to 4 PM",
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
        const scrollBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight;
        isAtBottom = scrollBottom < threshold;
    }

    function handleScroll() {
        checkIfAtBottom();
    }

    function sendMessage() {
        if (newMessage.trim() === '') return;

        // Add user message
        messages = [...messages, {
            id: messages.length + 1,
            sender: 'user',
            text: newMessage,
            timestamp: new Date()
        }];

        // Clear input
        const userMessage = newMessage;
        newMessage = '';

        // Reset textarea height after clearing
        setTimeout(resizeTextarea, 0);

        // Simulate AI typing
        setTimeout(() => {
            messages = [...messages, {
                id: messages.length + 1,
                sender: 'ai',
                text: generateResponse(userMessage),
                timestamp: new Date()
            }];
        }, 1000);
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

    function generateResponse(message) {
        // This would be replaced with actual AI processing in a real app
        if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('meeting')) {
            return "I've added that meeting to your calendar. Is there anything else you need?";
        } else if (message.toLowerCase().includes('appointments') || message.toLowerCase().includes('show')) {
            return "I've found 3 appointments in the requested timeframe. You can see them highlighted on your calendar.";
        } else if (message.toLowerCase().includes('reschedule')) {
            return "I've updated your meeting time. The change is now reflected in your calendar.";
        } else if (message.toLowerCase().includes('today')) {
            return "You have 2 events scheduled for today: A team standup at 10 AM and a client call at 2 PM.";
        } else {
            return "I'll help you with that. Is there anything specific about your calendar you'd like me to assist with?";
        }
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

<div class="flex flex-col h-full bg-gray-900 text-white rounded-lg overflow-hidden shadow-2xl">
    <!-- Header with same styling as landing page -->
    <div class="flex items-center justify-between p-5 bg-gray-800 border-b border-gradient-horizontal">
        <div>
            <h3 class="font-bold text-xl">TemporalAI Assistant</h3>
        </div>
        <div class="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">Online</div>
    </div>

    <!-- Animated gradient elements similar to landing page -->
    <div class="relative flex-1 overflow-hidden">
        <!-- Chat messages container with custom scrollbar -->
        <div
                class="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 h-full scrollbar-styled"
                bind:this={chatContainer}
                on:scroll={handleScroll}
        >
            {#each messages as message (message.id)}
                <div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-3/4 {message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-gray-800 text-gray-200 border border-gray-700'}
                        p-4 rounded-lg shadow-lg">
                        <div>{message.text}</div>
                        <div class="text-xs opacity-75 mt-1 text-right">
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
            <div class="text-sm text-gray-300 mb-2">Try asking:</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                {#each suggestedQueries as query}
                    <button
                            on:click={() => sendSuggestedQuery(query)}
                            class="cursor-pointer text-left p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 transition">
                        {query}
                    </button>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Input area styled to match landing page terminal style -->
    <div class="p-4 bg-gray-800 border-t border-gray-700">
        <form on:submit|preventDefault={sendMessage} class="flex space-x-2">
            <textarea
                    bind:this={messageInput}
                    bind:value={newMessage}
                    placeholder="Type your message..."
                    rows="1"
                    on:input={resizeTextarea}
                    on:keydown={handleKeyDown}
                    class="flex-grow bg-gray-900 text-gray-200 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[46px]"
            ></textarea>
            <button
                    type="submit"
                    class="cursor-pointer px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-lg transition transform hover:scale-105 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
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