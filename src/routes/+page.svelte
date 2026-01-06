<script lang="ts">
	import type { PageData } from './$types';
	import UrlMonitor from '$lib/components/UrlMonitor.svelte';

	const { data }: { data: PageData } = $props();
</script>

<UrlMonitor {data} />
