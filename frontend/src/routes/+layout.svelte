<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { auth } from '#lib/auth.svelte';
	import { branding } from '#lib/branding.svelte';
	import Sidebar from '#lib/components/Sidebar.svelte';

	let { children } = $props();
	let menuOpen = $state(false);

	const publicPaths = ['/login', '/registro', '/'];

	onMount(() => {
		branding.load();
	});

	$effect(() => {
		if (auth.loading) return;
		const path = page.url.pathname;
		const isPublic = publicPaths.includes(path);
		if (!auth.isLoggedIn && !isPublic) goto('/login');
		if (auth.isLoggedIn && (path === '/login' || path === '/registro' || path === '/')) {
			goto('/dashboard');
		}
	});
</script>

{#if auth.loading}
	<div class="auth-page"><p>Cargando…</p></div>
{:else if publicPaths.includes(page.url.pathname)}
	{@render children()}
{:else}
	<div class="app-shell">
		{#if menuOpen}
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="backdrop" onclick={() => (menuOpen = false)}></div>
		{/if}
		<Sidebar open={menuOpen} onclose={() => (menuOpen = false)} />
		<main class="main">
			<button class="btn btn-ghost mobile-toggle" onclick={() => (menuOpen = !menuOpen)}>
				Menú
			</button>
			{@render children()}
		</main>
	</div>
{/if}
