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

    // Example suggested queries
    const suggestedQueries = [
        "Schedule a meeting tomorrow at 2 PM",
        "Show me my appointments for next week",
        "Reschedule my 3 PM meeting to 4 PM",
        "What's on my calendar for today?"
    ];

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

    function sendSuggestedQuery(query) {
        newMessage = query;
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

    // Auto scroll to bottom when new messages arrive
    $: if (messages && chatContainer) {
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 0);
    }

    // Format time for messages
    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
</script>

<div class="flex flex-col h-full">
    <div class="flex items-center justify-between p-3 border-b">
        <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span class="text-white font-bold text-xs">AI</span>
            </div>
            <h3 class="font-medium">TemporalAI Assistant</h3>
        </div>
        <div class="text-xs text-gray-500">Online</div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4" bind:this={chatContainer}>
        {#each messages as message (message.id)}
            <div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-3/4 {message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'} p-3 rounded-lg">
                    <div>{message.text}</div>
                    <div class="text-xs opacity-75 mt-1 text-right">
                        {formatTime(message.timestamp)}
                    </div>
                </div>
            </div>
        {/each}
    </div>

    {#if messages.length === 1}
        <div class="px-4 pb-4">
            <div class="text-sm text-gray-500 mb-2">Suggested queries:</div>
            <div class="flex flex-wrap gap-2">
                {#each suggestedQueries as query}
                    <button
                            class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm transition"
                            on:click={() => sendSuggestedQuery(query)}
                    >
                        {query}
                    </button>
                {/each}
            </div>
        </div>
    {/if}

    <div class="p-3 border-t bg-white">
        <form class="flex items-center space-x-2" on:submit|preventDefault={sendMessage}>
            <div class="flex-1 relative">
                <input
                        type="text"
                        bind:value={newMessage}
                        placeholder="Ask me anything about your calendar..."
                        class="w-full p-2 pl-3 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <button
                    type="submit"
                    class="p-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        </form>
    </div>
</div>