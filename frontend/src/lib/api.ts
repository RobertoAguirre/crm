import { browser } from '$app/env';

/**
 * Base del API:
 * - Navegador: ruta pública `/api` (rewrite de Vercel → service backend)
 * - SSR / server: binding `BACKEND_URL` (inyectado por Vercel; no configurarlo a mano)
 * - Local sin Vercel: PUBLIC_API_URL o localhost:3001
 */
function apiBase(): string {
	if (browser) {
		return import.meta.env.PUBLIC_API_URL || '/api';
	}

	const backendUrl = typeof process !== 'undefined' ? process.env.BACKEND_URL : undefined;
	if (backendUrl) {
		// Express monta rutas bajo /api; el service recibe el path original
		return new URL('/api', backendUrl).toString().replace(/\/$/, '');
	}

	return import.meta.env.PUBLIC_API_URL || 'http://localhost:3001/api';
}

function token() {
	if (!browser) return null;
	return localStorage.getItem('crm_token');
}

export async function api<T = unknown>(
	path: string,
	options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
	const { auth = true, headers, ...rest } = options;
	const h = new Headers(headers);
	if (!h.has('Content-Type') && rest.body) h.set('Content-Type', 'application/json');
	if (auth) {
		const t = token();
		if (t) h.set('Authorization', `Bearer ${t}`);
	}

	const base = apiBase();
	const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
	const res = await fetch(url, { ...rest, headers: h });
	if (res.status === 204) return undefined as T;

	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error || data);
		throw new Error(msg || `Error ${res.status}`);
	}
	return data as T;
}

export function money(amount: number, currency: 'MXN' | 'USD' = 'MXN') {
	return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount || 0);
}

export function mxDate(iso: string) {
	return new Date(iso).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
}
