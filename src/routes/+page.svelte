<div class="min-h-full">
    <header class="bg-indigo-600 pb-24">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <div class="relative flex items-center justify-center py-5 lg:justify-between">
                <!-- Logo -->
                <div class="absolute left-0 shrink-0 lg:static">
                    <a href="/">
                        <span class="sr-only">Your Company</span>
                        <img class="h-8 w-auto" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=300" alt="Your Company">
                    </a>
                </div>

                <!-- Right section on desktop -->
                <div class="hidden lg:ml-4 lg:flex lg:items-center lg:pr-0.5">
                    <button type="button" class="relative shrink-0 rounded-full p-1 text-indigo-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white">
                        <span class="absolute -inset-1.5"></span>
                        <span class="sr-only">View notifications</span>
                        <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                        </svg>
                    </button>

                    <!-- Profile dropdown -->
                    <div class="relative ml-4 shrink-0">
                        <div>
                            <button type="button" class="relative flex rounded-full bg-white text-sm ring-2 ring-white/20 focus:outline-none focus:ring-white" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                                <span class="absolute -inset-1.5"></span>
                                <span class="sr-only">Open user menu</span>
                                <img class="size-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
                            </button>
                        </div>

                        <!-- Dropdown menu -->
                        <div class="absolute -right-2 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                            <a href="/profile" class="block px-4 py-2 text-sm text-gray-700">Your Profile</a>
                            <a href="/settings" class="block px-4 py-2 text-sm text-gray-700">Settings</a>
                            <a href="/logout" class="block px-4 py-2 text-sm text-gray-700">Sign out</a>
                        </div>
                    </div>
                </div>

                <!-- Mobile menu button -->
                <div class="absolute right-0 shrink-0 lg:hidden">
                    <button type="button" class="relative inline-flex items-center justify-center rounded-md bg-transparent p-2 text-indigo-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white">
                        <span class="absolute -inset-0.5"></span>
                        <span class="sr-only">Open main menu</span>
                        <svg class="block size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Desktop Navigation -->
            <div class="hidden border-t border-white/20 py-5 lg:block">
                <div class="grid grid-cols-3 items-center gap-8">
                    <div class="col-span-2">
                        <nav class="flex space-x-4">
                            <a href="/" class="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-white/10" aria-current="page">Home</a>
                            <a href="/profile" class="rounded-md px-3 py-2 text-sm font-medium text-indigo-100 hover:bg-white/10">Profile</a>
                            <a href="/resources" class="rounded-md px-3 py-2 text-sm font-medium text-indigo-100 hover:bg-white/10">Resources</a>
                            <a href="/directory" class="rounded-md px-3 py-2 text-sm font-medium text-indigo-100 hover:bg-white/10">Company Directory</a>
                            <a href="/openings" class="rounded-md px-3 py-2 text-sm font-medium text-indigo-100 hover:bg-white/10">Openings</a>
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile menu -->
        <div class="lg:hidden">
            <div class="fixed inset-0 z-20 bg-black/25" aria-hidden="true"></div>
            <div class="absolute inset-x-0 top-0 z-30 mx-auto w-full max-w-3xl origin-top transform p-2 transition">
                <div class="divide-y divide-gray-200 rounded-lg bg-white shadow-lg ring-1 ring-black/5">
                    <div class="pb-2 pt-3">
                        <div class="mt-3 space-y-1 px-2">
                            <a href="/" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800">Home</a>
                            <a href="/profile" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800">Profile</a>
                            <a href="/resources" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800">Resources</a>
                            <a href="/directory" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800">Company Directory</a>
                            <a href="/openings" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800">Openings</a>
                        </div>
                    </div>
                    <div class="pb-2 pt-4">
                        <div class="flex items-center px-5">
                            <div class="shrink-0">
                                <img class="size-10 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
                            </div>
                            <div class="ml-3 min-w-0 flex-1">
                                <div class="truncate text-base font-medium text-gray-800">Tom Cook</div>
                                <div class="truncate text-sm font-medium text-gray-500">tom@example.com</div>
                            </div>
                        </div>
                        <div class="mt-3 space-y-1 px-2">
                            <a href="/profile" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800">Your Profile</a>
                            <a href="/settings" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800">Settings</a>
                            <a href="/logout" class="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800">Sign out</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>
</div>