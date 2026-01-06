<script lang="ts">
	import type { PageData } from '../../routes/$types';
	import type { ServerEventUrlPinged, ServerEventIntervalStatus } from '$lib/server/events';
	import { scale } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';
	import Clock from '$lib/components/Clock.svelte';
	import UrlList from '$lib/components/UrlList.svelte';
	import UrlInput from '$lib/components/UrlInput.svelte';
	import { createUrlSchema } from '$lib/schema';
	import { createSSEClient } from '$lib/sseClient';

	const { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	let urls = $state(data.urls);

	// svelte-ignore state_referenced_locally
	let intervalStatus = $state<{ lastPingAt: number | null; nextPingAt: number } | null>({
		lastPingAt: data.lastPingAt,
		nextPingAt: data.nextPingAt
	});

	let errorMessage = $state<string | null>(null);
	let newUrlInput = $state('');
	let isLoading = $state(false);

	// Sync urls with data when it changes (after invalidateAll)
	$effect(() => {
		urls = data.urls;
	});

	// Clear error message on new input
	$effect(() => {
		newUrlInput;
		errorMessage = null;
	});

	// Setup SSE client to listen for events
	createSSEClient({
		url: '/api/events',
		onMessage: (event) => {
			switch (event.type) {
				case 'url_pinged': {
					const urlPingedEvent = event as ServerEventUrlPinged;

					// Update the URL in the list with new ping data
					urls = urls.map(url => {
						if (url.id === urlPingedEvent.url.id) {
							return {
								...urlPingedEvent.url,
								lastPing: urlPingedEvent.ping
							};
						}
						return url;
					});

					break;
				}

				case 'interval_status': {
					const statusEvent = event as ServerEventIntervalStatus;

					intervalStatus = {
						lastPingAt: statusEvent.lastPingAt,
						nextPingAt: statusEvent.nextPingAt
					};
					
					break;
				}
			}
		},
		onError: (error) => {
			console.error('SSE connection error:', error);
		}
	});

	/**
	 * Handle adding a new URL
	 */
	async function handleAddUrl(value: string) {
		if (value.trim() === '') return;
		errorMessage = null;

		try {
			const result = createUrlSchema.safeParse({ url: value });
			if (result.error) {
				errorMessage = result.error.issues[0].message;
				return;
			}

			const response = await fetch('/api/urls', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(result.data),
			});

			if (!response.ok) {
				const responseData = await response.json();
				errorMessage = responseData?.message || 'Failed to add URL. Please try again.';
				return;
			}

			newUrlInput = '';
			await invalidateAll();
		} catch (error) {
			errorMessage = 'An unexpected error occurred. Please try again.';
			return;
		}
	}

	/**
	 * Handle deleting a URL
	 * @param id ID of the URL instance to delete. (NanoId)
	 */
	async function handleDeleteUrl(id: string) {
		try {
			const response = await fetch(`/api/urls`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id }),
			});

			if (!response.ok) {
				const resData = await response.json();
				errorMessage = resData?.message || 'Failed to delete URL. Please try again.';
				return;
			}

			await invalidateAll();
		} catch (error) {
			errorMessage = 'An unexpected error occurred. Please try again.';
			return;
		}
	}
</script>

<div class="flex min-h-svh justify-center py-32">
	<main class="container max-w-3xl flex flex-col gap-4 mx-auto px-8">
		<div class="relative mb-8">
			<h1 class="text-xl font-black pb-1 font-serif mb-1">pinger.</h1>
			<p class="max-w-lg">This service will send GET requests to the specified URLs on a minute-by-minute basis.</p>

			{#if urls?.length && intervalStatus}
				<div class="absolute right-2 top-2" transition:scale>
					<Clock intervalStatus={intervalStatus} />
				</div>
			{/if}
		</div>

		<UrlList {urls} onDelete={handleDeleteUrl} />

		<UrlInput bind:value={newUrlInput} {errorMessage} {isLoading} onSubmit={handleAddUrl} />
	</main>
</div>
