<script>
    import { page } from '$app/state';
</script>

<main class="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
    <div class="text-center">
        <p class="text-base font-semibold text-indigo-600">{page.status}</p>
        <h1 class="mt-4 text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
            {page.status === 404 ? "Page not found" : "Something went wrong"}
        </h1>
        <p class="mt-6 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
            {page.status === 404
                ? "Sorry, we couldn’t find the page you’re looking for."
                : page.error?.message || "An unexpected error occurred."}
        </p>
        <div class="mt-10 flex items-center justify-center gap-x-6">
            <a href="/static" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm
        hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Go back home
            </a>
            <a href="/contact" class="text-sm font-semibold text-gray-900">
                Contact support <span aria-hidden="true">&rarr;</span>
            </a>
        </div>
    </div>
</main>