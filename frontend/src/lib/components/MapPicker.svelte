<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/env';

	interface Props {
		lat?: number | null;
		lng?: number | null;
		address?: string | null;
		editable?: boolean;
		onchange?: (v: { lat: number; lng: number; address?: string }) => void;
	}

	let {
		lat = null,
		lng = null,
		address = '',
		editable = true,
		onchange
	}: Props = $props();

	let el: HTMLDivElement | undefined = $state();
	let map: import('leaflet').Map | undefined;
	let marker: import('leaflet').Marker | undefined;

	onMount(async () => {
		if (!browser || !el) return;
		const L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		// Fix default marker icons in Vite
		// @ts-expect-error leaflet icon patch
		delete L.Icon.Default.prototype._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
			iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
			shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
		});

		const start: [number, number] = [
			lat ?? 19.4326,
			lng ?? -99.1332
		];

		map = L.map(el).setView(start, lat && lng ? 15 : 12);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap'
		}).addTo(map);

		marker = L.marker(start, { draggable: editable }).addTo(map);
		if (editable) {
			marker.on('dragend', () => {
				const p = marker!.getLatLng();
				onchange?.({ lat: p.lat, lng: p.lng, address: address || undefined });
			});
			map.on('click', (e) => {
				marker!.setLatLng(e.latlng);
				onchange?.({ lat: e.latlng.lat, lng: e.latlng.lng, address: address || undefined });
			});
		}

		setTimeout(() => map?.invalidateSize(), 200);
	});

	$effect(() => {
		if (map && marker && lat != null && lng != null) {
			marker.setLatLng([lat, lng]);
			map.setView([lat, lng], 15);
		}
	});

	onDestroy(() => {
		map?.remove();
	});
</script>

<div class="map" bind:this={el}></div>
{#if editable}
	<p style="margin:0.5rem 0 0;color:var(--muted);font-size:0.85rem">
		Clic o arrastra el pin · Centro por defecto: CDMX
	</p>
{/if}
