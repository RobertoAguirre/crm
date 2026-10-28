import { api } from './api';

export type Branding = {
	id: string;
	company_name: string;
	logo_url?: string | null;
	primary_color: string;
	secondary_color: string;
	accent_color: string;
};

const DEFAULTS: Branding = {
	id: '',
	company_name: 'Mi CRM',
	primary_color: '#ff6600',
	secondary_color: '#000000',
	accent_color: '#ffffff'
};

function darkenHex(hex: string, amount = 0.12): string {
	const h = hex.replace('#', '');
	if (h.length !== 6) return hex;
	const n = parseInt(h, 16);
	const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
	const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
	const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

class BrandingState {
	data = $state<Branding | null>(null);

	async load() {
		try {
			this.data = await api<Branding>('/branding', { auth: false });
			this.apply();
		} catch {
			this.data = { ...DEFAULTS };
			this.apply();
		}
	}

	apply() {
		if (!this.data || typeof document === 'undefined') return;
		const root = document.documentElement;
		root.style.setProperty('--primary', this.data.primary_color);
		root.style.setProperty('--primary-dark', darkenHex(this.data.primary_color));
		root.style.setProperty('--secondary', this.data.secondary_color);
		root.style.setProperty('--accent', this.data.accent_color);
		document.title = this.data.company_name;
	}

	async save(patch: Partial<Branding>) {
		this.data = await api<Branding>('/branding', {
			method: 'PATCH',
			body: JSON.stringify(patch)
		});
		this.apply();
	}
}

export const branding = new BrandingState();
