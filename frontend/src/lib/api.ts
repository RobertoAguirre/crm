import { browser } from '$app/env';

const BASE = browser
	? import.meta.env.PUBLIC_API_URL || '/api'
	: import.meta.env.PUBLIC_API_URL || 'http://localhost:3001/api';

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

	const res = await fetch(`${BASE}${path}`, { ...rest, headers: h });
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
