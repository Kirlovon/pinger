<script lang="ts">
	import type { Url, PingRequest } from '$lib/server/prisma';
	import { slide, fade } from 'svelte/transition';
	import TrashIcon from '$lib/components/TrashIcon.svelte';
	import { getStatusColor } from '$lib/utils';

	interface UrlWithPing extends Url {
		lastPing: PingRequest | null;
	}

	let { urls, onDelete }: { urls: UrlWithPing[]; onDelete: (id: string) => void } = $props();
</script>

<div class="border border-stone-300 rounded-md bg-white overflow-hidden" class:border-none={urls?.length === 0}>
	{#each urls as url, index (url.id)}
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
					onclick={() => onDelete(url.id)}
					class="absolute right-4 block opacity-0 translate-y-1 transition-all group-hover/url:translate-y-0 group-hover/url:opacity-100 hover:text-red-600 cursor-pointer"
				>
					<TrashIcon />
				</button>
			</div>
		</div>
	{/each}
</div>
