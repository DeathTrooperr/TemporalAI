<script>
    let email = "";
    let password = "";
    let errorMessage = "";

    function handleLogin() {
        if (!email || !password) {
            errorMessage = "Please enter both email and password.";
            return;
        }
        errorMessage = "";
        console.log("Logging in with", email, password);
    }
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
    <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h2 class="text-2xl font-bold text-center text-gray-800">Login</h2>
        {#if errorMessage}
            <p class="mt-2 text-red-500 text-sm">{errorMessage}</p>
        {/if}
        <form class="mt-4">
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
                <input
                        type="email"
                        bind:value={email}
                        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email"
                />
            </div>
            <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <input
                        type="password"
                        bind:value={password}
                        class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your password"
                />
            </div>
            <button
                    type="button"
                    on:click={handleLogin}
                    class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
            >
                Login
            </button>
        </form>
    </div>
</div>