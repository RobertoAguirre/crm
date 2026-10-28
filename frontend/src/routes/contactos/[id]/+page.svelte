<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { api } from '#lib/api';
	import MapPicker from '#lib/components/MapPicker.svelte';

	type Contact = {
		id: string;
		first_name: string;
		last_name: string;
		phone?: string;
		company?: string;
		email?: string;
		stage: 'lead' | 'prospecto' | 'cliente';
		business_address?: string;
		lat?: number | null;
		lng?: number | null;
		notes?: string;
	};

	let contact = $state<Contact | null>(null);
	let mailSubject = $state('');
	let mailBody = $state('');
	let msg = $state('');
	let error = $state('');
	let saving = $state(false);

	onMount(async () => {
		try {
			contact = await api<Contact>(`/contacts/${page.params.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error';
		}
	});

	async function save() {
		if (!contact) return;
		saving = true;
		error = '';
		try {
			contact = await api<Contact>(`/contacts/${contact.id}`, {
				method: 'PATCH',
				body: JSON.stringify(contact)
			});
			msg = 'Guardado';
			setTimeout(() => (msg = ''), 2000);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error';
		} finally {
			saving = false;
		}
	}

	async function sendMail() {
		if (!contact?.email) {
			error = 'El contacto no tiene email';
			return;
		}
		try {
			await api('/email/send', {
				method: 'POST',
				body: JSON.stringify({
					to: contact.email,
					subject: mailSubject,
					html: `<p>${mailBody.replace(/\n/g, '<br>')}</p>`,
					contact_id: contact.id
				})
			});
			msg = 'Correo enviado';
			mailSubject = '';
			mailBody = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error al enviar';
		}
	}
</script>

{#if error && !contact}
	<p style="color:var(--danger)">{error}</p>
{:else if !contact}
	<p>Cargando…</p>
{:else}
	<div class="page-head">
		<div>
			<h1>{contact.first_name} {contact.last_name}</h1>
			<p>{contact.company || 'Sin compañía'}</p>
		</div>
		<div style="display:flex;gap:0.5rem">
			<a class="btn btn-ghost" href="/contactos">Volver</a>
			<button class="btn" onclick={save} disabled={saving}>{saving ? '…' : 'Guardar'}</button>
		</div>
	</div>

	{#if msg}<div class="toast">{msg}</div>{/if}

	<div class="grid grid-2">
		<div class="panel">
			<div class="grid grid-2">
				<div class="field">
					<label>Nombre</label>
					<input bind:value={contact.first_name} />
				</div>
				<div class="field">
					<label>Apellido</label>
					<input bind:value={contact.last_name} />
				</div>
				<div class="field">
					<label>Teléfono</label>
					<input bind:value={contact.phone} />
				</div>
				<div class="field">
					<label>Compañía</label>
					<input bind:value={contact.company} />
				</div>
				<div class="field">
					<label>Email</label>
					<input type="email" bind:value={contact.email} />
				</div>
				<div class="field">
					<label>Etapa</label>
					<select bind:value={contact.stage}>
						<option value="lead">Lead</option>
						<option value="prospecto">Prospecto</option>
						<option value="cliente">Cliente</option>
					</select>
				</div>
			</div>
			<div class="field">
				<label>Dirección del negocio</label>
				<input bind:value={contact.business_address} />
			</div>
			<div class="field">
				<label>Notas</label>
				<textarea rows="3" bind:value={contact.notes}></textarea>
			</div>
			{#if error}<p style="color:var(--danger)">{error}</p>{/if}
		</div>

		<div class="panel">
			<h3 style="margin-top:0">Mapa del negocio</h3>
			<MapPicker
				lat={contact.lat}
				lng={contact.lng}
				address={contact.business_address}
				onchange={(v) => {
					contact!.lat = v.lat;
					contact!.lng = v.lng;
				}}
			/>

			<h3 style="margin-top:1.5rem">Enviar correo</h3>
			<div class="field">
				<label>Asunto</label>
				<input bind:value={mailSubject} />
			</div>
			<div class="field">
				<label>Mensaje</label>
				<textarea rows="4" bind:value={mailBody}></textarea>
			</div>
			<button class="btn" type="button" onclick={sendMail}>Enviar con Resend</button>
		</div>
	</div>
{/if}
