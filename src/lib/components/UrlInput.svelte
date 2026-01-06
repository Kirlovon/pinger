<script lang="ts">
	import { slide } from 'svelte/transition';

	let {
		value = $bindable(''),
		errorMessage = null,
		isLoading = false,
		onSubmit,
	}: {
		value?: string;
		errorMessage?: string | null;
		isLoading?: boolean;
		onSubmit: (value: string) => void;
	} = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			onSubmit(value);
		}
	}
</script>

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
		bind:value
		onkeydown={handleKeydown}
		placeholder="URL to ping every minute"
		class="px-4 py-3 w-full border-none focus:outline-none placeholder:text-stone-400"
	/>

	<button onclick={() => onSubmit(value)} class="px-6 py-3 border-l border-stone-300 whitespace-nowrap font-medium cursor-pointer">
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
