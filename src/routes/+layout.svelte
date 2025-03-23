<script lang="ts">
    import '../app.css';
    let { children } = $props();
</script>

<div class="absolute inset-0 bg-black/70"></div>
<div class="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
<div class="absolute bottom-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse" style="animation-delay: 1s;"></div>
{@render children()}