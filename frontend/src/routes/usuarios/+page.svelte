<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '#lib/api';
	import { auth } from '#lib/auth.svelte';

	type User = {
		id: string;
		email: string;
		full_name: string;
		phone?: string;
		role: 'admin' | 'manager' | 'sales' | 'viewer';
		is_active: boolean;
	};

	let users = $state<User[]>([]);
	let error = $state('');
	let showForm = $state(false);
	let form = $state({
		email: '',
		password: '',
		full_name: '',
		role: 'sales' as User['role'],
		phone: ''
	});

	const canManage = $derived(
		auth.profile?.role === 'admin' || auth.profile?.role === 'manager'
	);

	onMount(async () => {
		if (!canManage) return;
		try {
			users = await api<User[]>('/users');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error';
		}
	});

	async function create(e: Event) {
		e.preventDefault();
		try {
			const u = await api<User>('/users', { method: 'POST', body: JSON.stringify(form) });
			users = [u, ...users];
			showForm = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error';
		}
	}

	async function updateRole(id: string, role: User['role']) {
		const u = await api<User>(`/users/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({ role })
		});
		users = users.map((x) => (x.id === id ? u : x));
	}

	async function toggleActive(u: User) {
		const updated = await api<User>(`/users/${u.id}`, {
			method: 'PATCH',
			body: JSON.stringify({ is_active: !u.is_active })
		});
		users = users.map((x) => (x.id === u.id ? updated : x));
	}
</script>

<div class="page-head">
	<div>
		<h1>Usuarios y roles</h1>
		<p>Crear, ver y modificar niveles de acceso</p>
	</div>
	{#if auth.profile?.role === 'admin'}
		<button class="btn" onclick={() => (showForm = !showForm)}>
			{showForm ? 'Cerrar' : '+ Usuario'}
		</button>
	{/if}
</div>

{#if !canManage}
	<div class="panel">
		<p>Solo <strong>admin</strong> y <strong>manager</strong> pueden ver el listado de usuarios.</p>
		<p style="color:var(--muted)">Tu rol: {auth.profile?.role}</p>
	</div>
{:else}
	{#if showForm}
		<form class="panel" style="margin-bottom:1rem;max-width:640px" onsubmit={create}>
			<div class="grid grid-2">
				<div class="field">
					<label>Nombre</label>
					<input bind:value={form.full_name} required />
				</div>
				<div class="field">
					<label>Email</label>
					<input type="email" bind:value={form.email} required />
				</div>
				<div class="field">
					<label>Contraseña</label>
					<input type="password" bind:value={form.password} minlength="6" required />
				</div>
				<div class="field">
					<label>Rol</label>
					<select bind:value={form.role}>
						<option value="admin">Admin</option>
						<option value="manager">Manager</option>
						<option value="sales">Sales</option>
						<option value="viewer">Viewer</option>
					</select>
				</div>
				<div class="field">
					<label>Teléfono</label>
					<input bind:value={form.phone} />
				</div>
			</div>
			<button class="btn">Crear usuario</button>
		</form>
	{/if}

	{#if error}<p style="color:var(--danger)">{error}</p>{/if}

	<div class="panel table-wrap">
		<table>
			<thead>
				<tr>
					<th>Nombre</th>
					<th>Email</th>
					<th>Rol</th>
					<th>Activo</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each users as u, i}
					<tr style="animation-delay:{i * 0.03}s">
						<td>{u.full_name}</td>
						<td>{u.email}</td>
						<td>
							{#if auth.profile?.role === 'admin'}
								<select
									value={u.role}
									onchange={(e) => updateRole(u.id, (e.currentTarget as HTMLSelectElement).value as User['role'])}
								>
									<option value="admin">admin</option>
									<option value="manager">manager</option>
									<option value="sales">sales</option>
									<option value="viewer">viewer</option>
								</select>
							{:else}
								{u.role}
							{/if}
						</td>
						<td>{u.is_active ? 'Sí' : 'No'}</td>
						<td>
							<button class="btn btn-ghost" style="padding:0.35rem 0.6rem" onclick={() => toggleActive(u)}>
								{u.is_active ? 'Desactivar' : 'Activar'}
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
