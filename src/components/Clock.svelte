<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	export let interval: number;
	export let lastFetchDate: number;

	let percent: number = getPercent();
	$: makeSmaller = percent > 95;

	function getPercent() {
		const timeElapsed = Date.now() - lastFetchDate;
		const newPercent = Math.floor((timeElapsed / interval) * 100);

		if (newPercent > 100) {
			if (browser) invalidateAll();
			lastFetchDate = Date.now();
			return newPercent - 100;
		}

		return newPercent;
	}

	onMount(() => {
		const update = setInterval(() => {
			percent = getPercent();
		}, 1000 / 60);

		return () => clearInterval(update);
	});
</script>

<div
	class="w-6 h-6 rounded-full overflow-hidden border-2 border-stone-800 transition-transform duration-300"
	style:transform={makeSmaller ? 'scale(0.75)' : 'scale(1)'}
>
	<div class="w-full h-full" style={`background: conic-gradient(rgb(41, 37, 36) ${percent}%, 0, transparent)`}></div>
</div>
