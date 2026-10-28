<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '#lib/auth.svelte';
	import { branding } from '#lib/branding.svelte';

	let full_name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			await auth.register(full_name, email, password);
			goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al registrar';
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-page">
	<form class="auth-card" onsubmit={submit}>
		<div class="brand" style="margin-bottom:0.75rem">
			<span class="brand-dot"></span>
			{branding.data?.company_name || 'Mi CRM'}
		</div>
		<h1>Crear cuenta</h1>
		<p style="color:var(--muted);margin:0 0 1.25rem">Registro rápido para tu equipo</p>

		<div class="field">
			<label for="name">Nombre completo</label>
			<input id="name" bind:value={full_name} required />
		</div>
		<div class="field">
			<label for="email">Correo</label>
			<input id="email" type="email" bind:value={email} required />
		</div>
		<div class="field">
			<label for="password">Contraseña</label>
			<input id="password" type="password" bind:value={password} minlength="6" required />
		</div>

		{#if error}
			<p style="color:var(--danger);font-size:0.9rem">{error}</p>
		{/if}

		<button class="btn" style="width:100%" disabled={loading}>
			{loading ? 'Creando…' : 'Registrarme'}
		</button>
		<p style="margin:1rem 0 0;text-align:center;color:var(--muted);font-size:0.9rem">
			¿Ya tienes cuenta? <a href="/login" style="color:var(--primary);font-weight:600">Entrar</a>
		</p>
	</form>
</div>
