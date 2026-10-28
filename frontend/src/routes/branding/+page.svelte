<script lang="ts">
	import { branding } from '#lib/branding.svelte';
	import { auth } from '#lib/auth.svelte';

	let form = $state({
		company_name: '',
		logo_url: '',
		primary_color: '#0d9488',
		secondary_color: '#0f172a',
		accent_color: '#f59e0b'
	});
	let msg = $state('');
	let error = $state('');

	$effect(() => {
		if (branding.data) {
			form = {
				company_name: branding.data.company_name,
				logo_url: branding.data.logo_url || '',
				primary_color: branding.data.primary_color,
				secondary_color: branding.data.secondary_color,
				accent_color: branding.data.accent_color
			};
		}
	});

	async function save(e: Event) {
		e.preventDefault();
		if (auth.profile?.role !== 'admin') {
			error = 'Solo admin puede editar el branding';
			return;
		}
		try {
			await branding.save({
				...form,
				logo_url: form.logo_url || null
			});
			msg = 'Branding actualizado';
			setTimeout(() => (msg = ''), 2000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error';
		}
	}
</script>

<div class="page-head">
	<div>
		<h1>Branding</h1>
		<p>Identidad visual propia del CRM</p>
	</div>
</div>

{#if msg}<div class="toast">{msg}</div>{/if}

<form class="panel" style="max-width:560px" onsubmit={save}>
	<div class="field">
		<label>Nombre de la empresa</label>
		<input bind:value={form.company_name} required />
	</div>
	<div class="field">
		<label>URL del logo</label>
		<input type="url" bind:value={form.logo_url} placeholder="https://..." />
	</div>
	<div class="grid grid-2">
		<div class="field">
			<label>Color primario</label>
			<input type="color" bind:value={form.primary_color} />
		</div>
		<div class="field">
			<label>Color secundario</label>
			<input type="color" bind:value={form.secondary_color} />
		</div>
		<div class="field">
			<label>Acento</label>
			<input type="color" bind:value={form.accent_color} />
		</div>
	</div>

	<div
		style="margin:1rem 0;padding:1.25rem;border-radius:12px;background:var(--secondary);color:white"
	>
		<div class="brand" style="color:white">
			<span class="brand-dot" style="background:{form.primary_color}"></span>
			{form.company_name || 'Vista previa'}
		</div>
		<button
			type="button"
			class="btn"
			style="margin-top:1rem;background:{form.primary_color}"
		>
			Botón de muestra
		</button>
		<span
			style="display:inline-block;margin-left:0.5rem;padding:0.35rem 0.7rem;border-radius:999px;background:{form.accent_color};color:#111;font-size:0.8rem;font-weight:600"
		>
			Acento
		</span>
	</div>

	{#if error}<p style="color:var(--danger)">{error}</p>{/if}
	<button class="btn" disabled={auth.profile?.role !== 'admin'}>Guardar branding</button>
</form>
