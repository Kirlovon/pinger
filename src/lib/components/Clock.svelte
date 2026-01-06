<script lang="ts">
	import { onMount } from 'svelte';
	import { PING_INTERVAL } from '$lib/config';

	let { intervalStatus }: { intervalStatus: { lastPingAt: number | null; nextPingAt: number } } = $props();

	let percent: number = $state(getPercent());
	let currentlyPinging = $derived(percent >= 95);

	function getPercent() {
		// If no lastPingAt, calculate start time from nextPingAt and interval
		const startTime = intervalStatus.lastPingAt ?? (intervalStatus.nextPingAt - PING_INTERVAL);
		const totalDuration = intervalStatus.nextPingAt - startTime;
		const timeElapsed = Date.now() - startTime;
		const newPercent = Math.floor((timeElapsed / totalDuration) * 100);

		// Clamp percent between 0 and 100
		return Math.max(0, Math.min(100, newPercent));
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
	style:transform={currentlyPinging ? 'scale(0.75)' : 'scale(1)'}
>
	<div class="w-full h-full" style={`background: conic-gradient(var(--color-stone-800) ${percent}%, 0, transparent)`}></div>
</div>
