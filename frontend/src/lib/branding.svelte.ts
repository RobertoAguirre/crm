import { api } from './api';

export type Branding = {
	id: string;
	company_name: string;
	logo_url?: string | null;
	primary_color: string;
	secondary_color: string;
	accent_color: string;
};

class BrandingState {
	data = $state<Branding | null>(null);

	async load() {
		try {
			this.data = await api<Branding>('/branding', { auth: false });
			this.apply();
		} catch {
			this.data = {
				id: '',
				company_name: 'Mi CRM',
				primary_color: '#0d9488',
				secondary_color: '#0f172a',
				accent_color: '#f59e0b'
			};
			this.apply();
		}
	}

	apply() {
		if (!this.data || typeof document === 'undefined') return;
		document.documentElement.style.setProperty('--primary', this.data.primary_color);
		document.documentElement.style.setProperty('--secondary', this.data.secondary_color);
		document.documentElement.style.setProperty('--accent', this.data.accent_color);
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
