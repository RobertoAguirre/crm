<script lang="ts">
	import { onMount } from 'svelte';
	import { api, mxDate } from '#lib/api';

	type Ev = {
		id: string;
		title: string;
		description?: string;
		starts_at: string;
		ends_at: string;
		reminder_minutes?: number;
		contacts?: { first_name: string; last_name: string };
	};

	let events = $state<Ev[]>([]);
	let error = $state('');
	let msg = $state('');
	let form = $state({
		title: '',
		description: '',
		starts_at: '',
		ends_at: '',
		reminder_minutes: 30
	});

	onMount(load);

	async function load() {
		try {
			events = await api<Ev[]>('/events');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error';
		}
	}

	async function create(e: Event) {
		e.preventDefault();
		try {
			const starts = new Date(form.starts_at).toISOString();
			const ends = new Date(form.ends_at || form.starts_at).toISOString();
			const created = await api<Ev>('/events', {
				method: 'POST',
				body: JSON.stringify({
					...form,
					starts_at: starts,
					ends_at: ends
				})
			});
			events = [...events, created].sort(
				(a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)
			);
			form.title = '';
			form.description = '';
			msg = 'Evento agendado';
			setTimeout(() => (msg = ''), 2000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error';
		}
	}

	async function remind(id: string) {
		try {
			await api(`/events/${id}/remind`, { method: 'POST' });
			msg = 'Recordatorio enviado por correo';
			setTimeout(() => (msg = ''), 2500);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error';
		}
	}

	async function remove(id: string) {
		await api(`/events/${id}`, { method: 'DELETE' });
		events = events.filter((x) => x.id !== id);
	}
</script>

<div class="page-head">
	<div>
		<h1>Agenda</h1>
		<p>Calendario de citas y recordatorios oportunos (hora México)</p>
	</div>
</div>

{#if msg}<div class="toast">{msg}</div>{/if}
{#if error}<p style="color:var(--danger)">{error}</p>{/if}

<div class="grid grid-2">
	<form class="panel" onsubmit={create}>
		<h3 style="margin-top:0">Nuevo evento</h3>
		<div class="field">
			<label>Título</label>
			<input bind:value={form.title} required />
		</div>
		<div class="field">
			<label>Inicio</label>
			<input type="datetime-local" bind:value={form.starts_at} required />
		</div>
		<div class="field">
			<label>Fin</label>
			<input type="datetime-local" bind:value={form.ends_at} />
		</div>
		<div class="field">
			<label>Descripción</label>
			<textarea rows="3" bind:value={form.description}></textarea>
		</div>
		<div class="field">
			<label>Recordatorio (minutos antes)</label>
			<input type="number" min="0" bind:value={form.reminder_minutes} />
		</div>
		<button class="btn">Agendar</button>
	</form>

	<div class="panel">
		<h3 style="margin-top:0">Próximos eventos</h3>
		<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.75rem">
			{#each events as ev, i}
				<li
					style="padding:1rem;border:1px solid var(--line);border-radius:12px;animation:fade-up 0.4s both;animation-delay:{i *
						0.05}s"
				>
					<strong>{ev.title}</strong>
					<div style="color:var(--muted);font-size:0.85rem;margin:0.35rem 0">
						{mxDate(ev.starts_at)}
						{#if ev.contacts}
							· {ev.contacts.first_name} {ev.contacts.last_name}
						{/if}
					</div>
					{#if ev.description}
						<p style="margin:0 0 0.65rem;font-size:0.9rem">{ev.description}</p>
					{/if}
					<div style="display:flex;gap:0.4rem;flex-wrap:wrap">
						<button class="btn" style="padding:0.4rem 0.75rem" onclick={() => remind(ev.id)}>
							Enviar recordatorio
						</button>
						<button class="btn btn-ghost" style="padding:0.4rem 0.75rem" onclick={() => remove(ev.id)}>
							Eliminar
						</button>
					</div>
				</li>
			{:else}
				<li style="color:var(--muted)">Sin eventos</li>
			{/each}
		</ul>
	</div>
</div>
