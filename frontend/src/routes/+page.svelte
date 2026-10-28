<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '#lib/auth.svelte';

	onMount(() => {
		goto(auth.isLoggedIn ? '/dashboard' : '/login');
	});
</script>

<div class="auth-page"><p>Redirigiendo…</p></div>
