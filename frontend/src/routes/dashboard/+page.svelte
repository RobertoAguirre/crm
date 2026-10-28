<script lang="ts">
	import { onMount } from 'svelte';
	import { api, money } from '#lib/api';

	type Overview = {
		stages: { lead: number; prospecto: number; cliente: number };
		total_contacts: number;
		pipeline: {
			MXN: number;
			USD: number;
			won_mxn: number;
			won_usd: number;
			open: number;
		};
		upcoming_events: { id: string; title: string; starts_at: string }[];
		recent_contacts: {
			id: string;
			first_name: string;
			last_name: string;
			company?: string;
			stage: string;
		}[];
	};

	let data = $state<Overview | null>(null);
	let error = $state('');

	onMount(async () => {
		try {
			data = await api<Overview>('/dashboard/overview');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error';
		}
	});

	const totalStages = $derived(
		data ? data.stages.lead + data.stages.prospecto + data.stages.cliente : 1
	);
</script>

<div class="page-head">
	<div>
		<h1>Dashboard</h1>
		<p>Evolución lead → prospecto → cliente</p>
	</div>
	<a class="btn" href="/contactos/nuevo">+ Contacto</a>
</div>

{#if error}
	<p style="color:var(--danger)">{error}</p>
{:else if !data}
	<p>Cargando métricas…</p>
{:else}
	<div class="grid grid-4" style="margin-bottom:1.25rem">
		<div class="stat">
			<div class="label">Contactos</div>
			<div class="value">{data.total_contacts}</div>
		</div>
		<div class="stat">
			<div class="label">Pipeline MXN</div>
			<div class="value" style="font-size:1.35rem">{money(data.pipeline.MXN, 'MXN')}</div>
		</div>
		<div class="stat">
			<div class="label">Pipeline USD</div>
			<div class="value" style="font-size:1.35rem">{money(data.pipeline.USD, 'USD')}</div>
		</div>
		<div class="stat">
			<div class="label">Oportunidades abiertas</div>
			<div class="value">{data.pipeline.open}</div>
		</div>
	</div>

	<div class="panel" style="margin-bottom:1.25rem">
		<h2 style="margin:0 0 1rem;font-size:1.15rem">Embudo de evolución</h2>
		<div class="pipeline">
			{#each [
				{ key: 'lead', label: 'Leads', color: '#0369a1' },
				{ key: 'prospecto', label: 'Prospectos', color: '#b45309' },
				{ key: 'cliente', label: 'Clientes', color: '#047857' }
			] as s, i}
				{@const n = data.stages[s.key as keyof typeof data.stages]}
				<div class="stage-col" style="animation-delay:{i * 0.08}s">
					<h3 style="color:{s.color}">{s.label}</h3>
					<div style="font-family:var(--font-display);font-size:2rem;font-weight:700">{n}</div>
					<div class="bar">
						<span style="width:{(n / totalStages) * 100}%"></span>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="grid grid-2">
		<div class="panel">
			<h3 style="margin-top:0">Contactos recientes</h3>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Nombre</th>
							<th>Etapa</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recent_contacts as c, i}
							<tr style="animation-delay:{i * 0.04}s">
								<td>
									<a href="/contactos/{c.id}" style="color:var(--primary);font-weight:600">
										{c.first_name} {c.last_name}
									</a>
									{#if c.company}
										<div style="color:var(--muted);font-size:0.8rem">{c.company}</div>
									{/if}
								</td>
								<td><span class="badge {c.stage}">{c.stage}</span></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
		<div class="panel">
			<h3 style="margin-top:0">Próxima agenda</h3>
			{#if data.upcoming_events.length === 0}
				<p style="color:var(--muted)">Sin eventos próximos</p>
			{:else}
				<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.75rem">
					{#each data.upcoming_events as ev}
						<li style="padding:0.75rem;border:1px solid var(--line);border-radius:10px">
							<strong>{ev.title}</strong>
							<div style="color:var(--muted);font-size:0.85rem">
								{new Date(ev.starts_at).toLocaleString('es-MX', {
									timeZone: 'America/Mexico_City'
								})}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
			<a href="/agenda" class="btn btn-ghost" style="margin-top:1rem">Ver agenda</a>
		</div>
	</div>
{/if}
