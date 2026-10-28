<script lang="ts">
	import { onMount } from 'svelte';
	import { api, mxDate } from '#lib/api';

	type N = {
		id: string;
		title: string;
		body?: string;
		type: string;
		link?: string;
		read: boolean;
		created_at: string;
	};

	let items = $state<N[]>([]);
	let error = $state('');

	onMount(load);

	async function load() {
		try {
			items = await api<N[]>('/notifications');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error';
		}
	}

	async function markRead(id: string) {
		await api(`/notifications/${id}/read`, { method: 'PATCH' });
		items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
	}

	async function readAll() {
		await api('/notifications/read-all', { method: 'POST' });
		items = items.map((n) => ({ ...n, read: true }));
	}
</script>

<div class="page-head">
	<div>
		<h1>Notificaciones</h1>
		<p>Alertas oportunas de contactos, oportunidades y agenda</p>
	</div>
	<button class="btn btn-ghost" onclick={readAll}>Marcar todas leídas</button>
</div>

{#if error}<p style="color:var(--danger)">{error}</p>{/if}

<div style="display:flex;flex-direction:column;gap:0.75rem;max-width:720px">
	{#each items as n, i}
		<div
			class="panel"
			style="opacity:{n.read ? 0.65 : 1};animation-delay:{i * 0.04}s;display:flex;justify-content:space-between;gap:1rem;align-items:flex-start"
		>
			<div>
				<div style="font-weight:700">{n.title}</div>
				{#if n.body}<p style="margin:0.35rem 0;color:var(--muted)">{n.body}</p>{/if}
				<div style="font-size:0.8rem;color:var(--muted)">{mxDate(n.created_at)} · {n.type}</div>
				{#if n.link}
					<a href={n.link} style="font-size:0.9rem">Abrir</a>
				{/if}
			</div>
			{#if !n.read}
				<button class="btn btn-ghost" style="padding:0.4rem 0.7rem" onclick={() => markRead(n.id)}
					>Leída</button
				>
			{/if}
		</div>
	{:else}
		<div class="panel" style="color:var(--muted)">Sin notificaciones</div>
	{/each}
</div>
