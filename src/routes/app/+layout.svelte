<script lang="ts">
    import Header from '$lib/components/layout/header.svelte'
    import Footer from '$lib/components/layout/footer.svelte'
	import '../../app.css';
    let { children } = $props();
</script>

<div class="min-h-full">
    <Header/>
    <main class="-mt-24 pb-8">
        {@render children()}
    </main>
    <Footer/>
</div>