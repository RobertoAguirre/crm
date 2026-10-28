import { browser } from '$app/env';
import { api } from './api';

export type Profile = {
	id: string;
	email: string;
	full_name: string;
	phone?: string | null;
	role: 'admin' | 'manager' | 'sales' | 'viewer';
	is_active: boolean;
};

class AuthState {
	token = $state<string | null>(null);
	profile = $state<Profile | null>(null);
	loading = $state(true);

	constructor() {
		if (browser) {
			this.token = localStorage.getItem('crm_token');
			if (this.token) this.refresh().finally(() => (this.loading = false));
			else this.loading = false;
		} else {
			this.loading = false;
		}
	}

	get isLoggedIn() {
		return !!this.token && !!this.profile;
	}

	async login(email: string, password: string) {
		const data = await api<{
			access_token: string;
			profile: Profile;
		}>('/auth/login', {
			method: 'POST',
			auth: false,
			body: JSON.stringify({ email, password })
		});
		this.setSession(data.access_token, data.profile);
	}

	async register(full_name: string, email: string, password: string) {
		const data = await api<{
			access_token?: string;
			profile?: Profile;
			session?: { access_token: string };
		}>('/auth/register', {
			method: 'POST',
			auth: false,
			body: JSON.stringify({ full_name, email, password })
		});
		const token = data.access_token || data.session?.access_token;
		if (token) {
			this.token = token;
			localStorage.setItem('crm_token', token);
			await this.refresh();
		}
	}

	async refresh() {
		if (!this.token) return;
		try {
			const data = await api<{ profile: Profile }>('/auth/me');
			this.profile = data.profile;
		} catch {
			this.logout();
		}
	}

	setSession(token: string, profile: Profile) {
		this.token = token;
		this.profile = profile;
		if (browser) localStorage.setItem('crm_token', token);
	}

	logout() {
		this.token = null;
		this.profile = null;
		if (browser) localStorage.removeItem('crm_token');
	}
}

export const auth = new AuthState();
