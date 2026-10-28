<script lang="ts">
	import { onMount } from 'svelte';
	import { api, money } from '#lib/api';

	type Opp = {
		id: string;
		title: string;
		amount: number;
		currency: 'MXN' | 'USD';
		status: string;
		probability: number;
		contact_id: string;
		contacts?: { first_name: string; last_name: string; company?: string };
	};

	type Contact = { id: string; first_name: string; last_name: string };

	let items = $state<Opp[]>([]);
	let contacts = $state<Contact[]>([]);
	let showForm = $state(false);
	let error = $state('');
	let form = $state({
		title: '',
		amount: 0,
		currency: 'MXN' as 'MXN' | 'USD',
		contact_id: '',
		probability: 50,
		status: 'open'
	});

	onMount(async () => {
		try {
			[items, contacts] = await Promise.all([
				api<Opp[]>('/opportunities'),
				api<Contact[]>('/contacts')
			]);
			if (contacts[0]) form.contact_id = contacts[0].id;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error';
		}
	});

	async function create(e: Event) {
		e.preventDefault();
		try {
			const created = await api<Opp>('/opportunities', {
				method: 'POST',
				body: JSON.stringify({ ...form, amount: Number(form.amount) })
			});
			items = [created, ...items];
			showForm = false;
			form.title = '';
			form.amount = 0;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error';
		}
	}

	async function setStatus(id: string, status: string) {
		const updated = await api<Opp>(`/opportunities/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({ status })
		});
		items = items.map((o) => (o.id === id ? { ...o, ...updated } : o));
	}
</script>

<div class="page-head">
	<div>
		<h1>Oportunidades</h1>
		<p>Por cliente y monto en MXN o USD</p>
	</div>
	<button class="btn" onclick={() => (showForm = !showForm)}>
		{showForm ? 'Cerrar' : '+ Nueva'}
	</button>
</div>

{#if showForm}
	<form class="panel" style="margin-bottom:1rem;max-width:720px" onsubmit={create}>
		<div class="grid grid-2">
			<div class="field">
				<label>Título</label>
				<input bind:value={form.title} required />
			</div>
			<div class="field">
				<label>Cliente / contacto</label>
				<select bind:value={form.contact_id} required>
					{#each contacts as c}
						<option value={c.id}>{c.first_name} {c.last_name}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label>Monto</label>
				<input type="number" step="0.01" min="0" bind:value={form.amount} required />
			</div>
			<div class="field">
				<label>Moneda</label>
				<select bind:value={form.currency}>
					<option value="MXN">MXN (pesos)</option>
					<option value="USD">USD (dólares)</option>
				</select>
			</div>
			<div class="field">
				<label>Probabilidad %</label>
				<input type="number" min="0" max="100" bind:value={form.probability} />
			</div>
		</div>
		<button class="btn">Crear oportunidad</button>
	</form>
{/if}

{#if error}<p style="color:var(--danger)">{error}</p>{/if}

<div class="panel table-wrap">
	<table>
		<thead>
			<tr>
				<th>Oportunidad</th>
				<th>Cliente</th>
				<th>Monto</th>
				<th>%</th>
				<th>Estado</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each items as o, i}
				<tr style="animation-delay:{i * 0.03}s">
					<td>{o.title}</td>
					<td>
						{#if o.contacts}
							{o.contacts.first_name} {o.contacts.last_name}
						{:else}
							—
						{/if}
					</td>
					<td>{money(Number(o.amount), o.currency)}</td>
					<td>{o.probability}%</td>
					<td><span class="badge {o.status}">{o.status}</span></td>
					<td style="display:flex;gap:0.35rem">
						<button class="btn btn-ghost" style="padding:0.35rem 0.6rem" onclick={() => setStatus(o.id, 'won')}
							>Ganada</button
						>
						<button class="btn btn-ghost" style="padding:0.35rem 0.6rem" onclick={() => setStatus(o.id, 'lost')}
							>Perdida</button
						>
					</td>
				</tr>
			{:else}
				<tr><td colspan="6" style="color:var(--muted)">Sin oportunidades</td></tr>
			{/each}
		</tbody>
	</table>
</div>
