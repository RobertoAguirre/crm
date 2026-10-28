<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '#lib/api';

	type Contact = {
		id: string;
		first_name: string;
		last_name: string;
		phone?: string;
		company?: string;
		email?: string;
		stage: string;
		business_address?: string;
	};

	let contacts = $state<Contact[]>([]);
	let filter = $state('');
	let error = $state('');

	onMount(load);

	async function load(stage = filter) {
		try {
			const q = stage ? `?stage=${stage}` : '';
			contacts = await api<Contact[]>(`/contacts${q}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error';
		}
	}

	function setFilter(s: string) {
		filter = s;
		load(s);
	}
</script>

<div class="page-head">
	<div>
		<h1>Contactos</h1>
		<p>Nombre, compañía, teléfono y dirección con mapa</p>
	</div>
	<a class="btn" href="/contactos/nuevo">+ Nuevo</a>
</div>

<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
	{#each ['', 'lead', 'prospecto', 'cliente'] as s}
		<button
			class="btn"
			class:btn-ghost={filter !== s}
			onclick={() => setFilter(s)}
		>
			{s || 'Todos'}
		</button>
	{/each}
</div>

{#if error}
	<p style="color:var(--danger)">{error}</p>
{/if}

<div class="panel table-wrap">
	<table>
		<thead>
			<tr>
				<th>Nombre</th>
				<th>Compañía</th>
				<th>Teléfono</th>
				<th>Etapa</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each contacts as c, i}
				<tr style="animation-delay:{i * 0.03}s">
					<td>{c.first_name} {c.last_name}</td>
					<td>{c.company || '—'}</td>
					<td>{c.phone || '—'}</td>
					<td><span class="badge {c.stage}">{c.stage}</span></td>
					<td><a href="/contactos/{c.id}" style="color:var(--primary);font-weight:600">Ver</a></td>
				</tr>
			{:else}
				<tr><td colspan="5" style="color:var(--muted)">Sin contactos aún</td></tr>
			{/each}
		</tbody>
	</table>
</div>
