<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '#lib/api';
	import MapPicker from '#lib/components/MapPicker.svelte';

	let form = $state({
		first_name: '',
		last_name: '',
		phone: '',
		company: '',
		email: '',
		stage: 'lead' as 'lead' | 'prospecto' | 'cliente',
		business_address: '',
		lat: 19.4326 as number | null,
		lng: -99.1332 as number | null,
		notes: ''
	});
	let error = $state('');
	let loading = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		try {
			const created = await api<{ id: string }>('/contacts', {
				method: 'POST',
				body: JSON.stringify(form)
			});
			goto(`/contactos/${created.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="page-head">
	<div>
		<h1>Nuevo contacto</h1>
		<p>Incluye ubicación del negocio en el mapa</p>
	</div>
</div>

<form class="panel" style="max-width:820px" onsubmit={submit}>
	<div class="grid grid-2">
		<div class="field">
			<label>Nombre</label>
			<input bind:value={form.first_name} required />
		</div>
		<div class="field">
			<label>Apellido</label>
			<input bind:value={form.last_name} required />
		</div>
		<div class="field">
			<label>Teléfono</label>
			<input bind:value={form.phone} placeholder="+52 ..." />
		</div>
		<div class="field">
			<label>Compañía</label>
			<input bind:value={form.company} />
		</div>
		<div class="field">
			<label>Email</label>
			<input type="email" bind:value={form.email} />
		</div>
		<div class="field">
			<label>Etapa</label>
			<select bind:value={form.stage}>
				<option value="lead">Lead</option>
				<option value="prospecto">Prospecto</option>
				<option value="cliente">Cliente</option>
			</select>
		</div>
	</div>

	<div class="field">
		<label>Dirección del negocio</label>
		<input bind:value={form.business_address} placeholder="Calle, colonia, ciudad" />
	</div>

	<MapPicker
		lat={form.lat}
		lng={form.lng}
		address={form.business_address}
		onchange={(v) => {
			form.lat = v.lat;
			form.lng = v.lng;
		}}
	/>

	<div class="field" style="margin-top:1rem">
		<label>Notas</label>
		<textarea rows="3" bind:value={form.notes}></textarea>
	</div>

	{#if error}<p style="color:var(--danger)">{error}</p>{/if}

	<button class="btn" disabled={loading}>{loading ? 'Guardando…' : 'Guardar contacto'}</button>
</form>
