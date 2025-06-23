<script lang="ts">
	import '../app.css';

	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import Clock from '../components/Clock.svelte';
	import { onMount } from 'svelte';

	export let data: PageData;
	export let form: ActionData;
	export let fetchingUrlsIDs = new Set<string>();

	onMount(() => {
		const evtSource = new EventSource('/api/events');

		const requestStart = (event: MessageEvent) => {
			const data = JSON.parse(event.data);
			fetchingUrlsIDs.add(data.id);
		};

		const requestEnd = (event: MessageEvent) => {
			const data = JSON.parse(event.data);
			fetchingUrlsIDs.delete(data.id);
			fetchingUrlsIDs = fetchingUrlsIDs;
		};

		evtSource.addEventListener('request_start', requestStart);
		evtSource.addEventListener('request_end', requestEnd);

		return () => {
			evtSource.removeEventListener('request_start', requestStart);
			evtSource.removeEventListener('request_end', requestEnd);
			evtSource.close();
		};
	});
</script>

<div class="flex min-h-svh justify-center py-32">
	<main class="container max-w-3xl flex flex-col gap-4 mx-auto px-8">
		<div class="relative mb-8">
			<h1 class="text-xl font-black pb-1 font-serif mb-1">pinger.</h1>
			<p class="max-w-lg">This service will send GET requests to the specified URLs on a minute-by-minute basis.</p>

			{#if data?.urls?.length}
				<div class="absolute right-2 top-2">
					<Clock interval={data.interval} lastFetchDate={data.lastFetchDate} />
				</div>
			{/if}
		</div>

		{#if data?.urls?.length}
			<div class="border border-stone-200 rounded-md bg-white">
				{#each data?.urls as url}
					<form method="POST" action="?/delete" class="relative block group/url [&:not(:last-child)]:border-b" use:enhance>
						<div class="flex items-center gap-2 max-w-full overflow-hidden px-4 py-3">
							<input name="id" type="hidden" value={url.id} readonly />
							<div
								class="whitespace-nowrap overflow-hidden text-ellipsis duration-500"
								class:text-stone-300={fetchingUrlsIDs.has(url.id)}
								class:transition-colors={!fetchingUrlsIDs.has(url.id)}
							>
								{url.url}
							</div>
							{#if url.timeTaken}
								<span class="italic text-xs text-stone-400 text-nowrap">({url.timeTaken} ms)</span>
							{/if}

							<button
								type="submit"
								class="block ml-auto opacity-0 translate-y-1 transition-all group-hover/url:translate-y-0 group-hover/url:opacity-100 hover:opacity-75"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
									<path
										fill-rule="evenodd"
										d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</div>
					</form>
				{/each}
			</div>
		{/if}

		<form method="POST" action="?/add" use:enhance>
			<!-- svelte-ignore a11y-no-redundant-roles -->
			<fieldset
				role="group"
				class="border border-stone-200 flex bg-white overflow-hidden rounded-md focus-within:border-stone-400"
				class:border-red-500={form?.error}
			>
				<input
					type="text"
					id="url"
					name="url"
					value={form?.url ?? ''}
					placeholder="URL to ping every minute"
					aria-invalid={form?.error ? 'true' : null}
					class="px-4 py-3 w-full border-none focus:outline-none placeholder:text-stone-400"
					required
				/>

				<input type="submit" value="Add URL" class="px-6 py-3 border-l text-stone-800 font-medium" />
			</fieldset>

			{#if form?.error}
				<span class="block text-sm text-red-400 px-4 py-2">{form?.error}</span>
			{/if}
		</form>

		<span class="text-xs text-stone-400 pl-4">Made with ♥︎ by Kirlovon</span>
	</main>
</div>
