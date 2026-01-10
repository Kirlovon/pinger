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
	import { PING_INTERVAL } from '$lib/config';

	const { data }: { data: PageData } = $props();

	// svelte-ignore state_referenced_locally
	let urls = $state(data.urls);

	// svelte-ignore state_referenced_locally
	let intervalStatus = $state<PageData['intervalStatus'] | null>({
		lastPingAt: data.intervalStatus.lastPingAt,
		nextPingAt: data.intervalStatus.nextPingAt
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

	/**
	 * Handle copying a URL to clipboard
	 * @param id ID of the URL instance to copy. (NanoId)
	 */
	async function handleCopyUrl(id: string) {
		const urlToCopy = urls.find(url => url.id === id);
		if (urlToCopy) {
			try {
				await navigator.clipboard.writeText(urlToCopy.url);
			} catch (error) {
				console.error('Failed to copy URL to clipboard:', error);
			}
		}
	}

	// Human-readable interval string (e.g. "every 5 seconds")
	const intervalSeconds = Math.floor(PING_INTERVAL / 1000);
	const readableInterval = intervalSeconds === 1 ? 'second' : `${intervalSeconds} seconds`;
</script>

<div class="flex min-h-svh justify-center items-center py-32">
	<main class="container max-w-3xl flex flex-col gap-12 mx-auto px-8 mb-64">
		<div class="relative">
			<h1 class="text-xl font-black pb-1 font-serif mb-1">pinger.</h1>
			<p class="max-w-[60ch]">This service will send GET requests to the specified URLs <i class="underline decoration-wavy underline-offset-6 font-medium">every {readableInterval}</i>.</p>

			{#if urls?.length && intervalStatus}
				<div class="absolute right-0 top-0" transition:scale>
					<Clock intervalStatus={intervalStatus} />
				</div>
			{/if}
		</div>

		<div class="flex flex-col gap-4">
			<UrlList {urls} onDelete={handleDeleteUrl} onCopy={handleCopyUrl} />
			<UrlInput bind:value={newUrlInput} {errorMessage} {isLoading} onSubmit={handleAddUrl} />
		</div>
	</main>
</div>
