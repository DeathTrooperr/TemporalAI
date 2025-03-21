<script>
    let messages = [
        { text: "Hello! How can I assist you today?", sender: "ai" }
    ];
    let userInput = "";

    function sendMessage() {
        if (!userInput.trim()) return;

        messages = [...messages, { text: userInput, sender: "user" }];
        userInput = "";

        // Simulated AI response
        setTimeout(() => {
            messages = [...messages, { text: "I'm here to help!", sender: "ai" }];
        }, 1000);
    }
</script>

<div class="flex flex-col h-full w-full">
    <!-- Chat Messages (Scrollable) -->
    <div class="flex-1 overflow-y-scroll p-3 space-y-2">
        {#each messages as message}
            <div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs md:max-w-sm lg:max-w-md px-3 py-2 rounded-lg shadow-sm
          {message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}">
                    {message.text}
                </div>
            </div>
        {/each}
    </div>

    <!-- Input Box -->
    <div class="p-3 flex">
        <input
                type="text"
                bind:value={userInput}
                class="flex-1 p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a message..."
                on:keydown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
                on:click={sendMessage}
                class="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-400">
            Send
        </button>
    </div>
</div>