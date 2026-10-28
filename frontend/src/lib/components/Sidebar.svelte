<script lang="ts">
	import { page } from '$app/state';
	import { auth } from '#lib/auth.svelte';
	import { branding } from '#lib/branding.svelte';

	interface Props {
		open?: boolean;
		onclose?: () => void;
	}
	let { open = false, onclose }: Props = $props();

	const links = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/contactos', label: 'Contactos' },
		{ href: '/oportunidades', label: 'Oportunidades' },
		{ href: '/agenda', label: 'Agenda' },
		{ href: '/usuarios', label: 'Usuarios' },
		{ href: '/notificaciones', label: 'Notificaciones' },
		{ href: '/branding', label: 'Branding' }
	];

	function active(href: string, path: string) {
		return path === href || path.startsWith(href + '/');
	}
</script>

<aside class="sidebar" class:open>
	<div class="brand" style="flex-direction:column;align-items:flex-start;gap:0.75rem">
		<img src="/logo.jpg" alt="" width="140" height="115" style="width:140px;height:auto;display:block" />
		<span style="display:flex;align-items:center;gap:0.5rem">
			<span class="brand-dot"></span>
			{branding.data?.company_name || 'Mi CRM'}
		</span>
	</div>

	<nav class="nav">
		{#each links as link}
			<a
				href={link.href}
				class:active={active(link.href, page.url.pathname)}
				onclick={() => onclose?.()}
			>
				{link.label}
			</a>
		{/each}
	</nav>

	<div style="margin-top:auto;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.08)">
		<div style="font-size:0.85rem;color:#94a3b8;margin-bottom:0.65rem">
			{auth.profile?.full_name}<br />
			<span style="text-transform:capitalize">{auth.profile?.role}</span>
		</div>
		<button
			class="btn btn-ghost"
			style="width:100%;color:#e2e8f0;border-color:rgba(255,255,255,0.15)"
			onclick={() => {
				auth.logout();
				location.href = '/login';
			}}
		>
			Salir
		</button>
	</div>
</aside>
