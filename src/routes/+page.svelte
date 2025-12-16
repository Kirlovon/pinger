<script lang="ts">
	import type { PageData } from './$types';
	import { slide, fade, scale } from 'svelte/transition';
	import Clock from '$lib/components/Clock.svelte';
	import TrashIcon from '$lib/components/TrashIcon.svelte';
	import { createUrlSchema } from '$lib/schema';
	import { invalidateAll } from '$app/navigation';
	import { getStatusColor } from '$lib/utils';
	import { createSSEClient } from '$lib/sseClient';

	const { data }: { data: PageData } = $props();

	let errorMessage = $state<string | null>(null);
	let newUrlInput = $state('');
	let isLoading = $state(false);

	// Clear error message on new input
	$effect(() => {
		newUrlInput;
		errorMessage = null;
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
				const resData = await response.json();
				console.log(resData)
				errorMessage = resData?.message || 'Failed to add URL. Please try again.';
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

			{#if data.urls?.length && data.lastPingDate}
				<div class="absolute right-2 top-2" transition:scale>
					<Clock interval={data.pingInterval} lastPingDate={data.lastPingDate} />
				</div>
			{/if}
		</div>

		<div class="border border-stone-300 rounded-md bg-white overflow-hidden" class:border-none={data.urls?.length === 0}>
			{#each data.urls as url, index (url.id)}
				<div class="relative block group/url not-last:border-b border-stone-300" transition:slide={{ duration: 200 }}>
					<div class="relative flex justify-between items-center gap-2 max-w-full overflow-hidden px-4 py-3">
						<div class="whitespace-nowrap overflow-hidden text-ellipsis duration-500">
							{url?.url}
						</div>

						{#if url.lastPing}
							{#key url.lastPing.createdAt.getTime()}
								<div
									class="flex gap-2 items-center text-xs text-stone-400 transition-all text-nowrap group-hover/url:-translate-y-1 group-hover/url:opacity-0"
									in:fade={{ duration: 500, delay: index * 50 }}
								>
									<span>Response: {url.lastPing?.responseTime} ms</span>
									<span class="{getStatusColor(url.lastPing.status)} text-white/90 px-1.5 py-0.5 rounded-md border-black/10 border"
										>{url.lastPing.status}</span
									>
								</div>
							{/key}
						{/if}

						<button
							onclick={() => handleDeleteUrl(url.id)}
							class="absolute right-4 block opacity-0 translate-y-1 transition-all group-hover/url:translate-y-0 group-hover/url:opacity-100 hover:opacity-75 cursor-pointer"
						>
							<TrashIcon />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<div
			role="group"
			class="border flex bg-white overflow-hidden rounded-md leading-6 {errorMessage ? 'border-red-500 **:border-red-500' : (
				'border-stone-300 focus-within:border-stone-400 focus-within:**:border-stone-400'
			)}"
		>
			<input
				type="text"
				id="url"
				name="url"
				disabled={isLoading}
				bind:value={newUrlInput}
				onkeydown={(e) => e.key === 'Enter' && handleAddUrl(newUrlInput)}
				placeholder="URL to ping every minute"
				class="px-4 py-3 w-full border-none focus:outline-none placeholder:text-stone-400"
			/>

			<button
				onclick={() => handleAddUrl(newUrlInput)}
				class="px-6 py-3 border-l border-stone-300 whitespace-nowrap font-medium cursor-pointer"
			>
				Add URL
			</button>
		</div>

		<div class="flex flex-col">
			{#if errorMessage}
				<span class="text-xs text-red-500 px-4 m-0" transition:slide={{ duration: 200 }}>Error: {errorMessage}</span>
			{:else}
				<span class="text-xs text-stone-400 px-4" transition:slide={{ duration: 200 }}>
					Made with ♥︎ by
					<a href="https://github.com/Kirlovon" target="_blank" class="hover:underline hover:text-stone-600">Kirlovon</a>
				</span>
			{/if}
		</div>
	</main>
</div>
