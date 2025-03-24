<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="absolute inset-0 bg-black/70"></div>
<div
	class="absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full bg-blue-500 opacity-20 blur-3xl filter"
></div>
<div
	class="absolute right-1/4 bottom-1/3 h-72 w-72 animate-pulse rounded-full bg-purple-500 opacity-20 blur-3xl filter"
	style="animation-delay: 1s;"
></div>
{@render children()}
