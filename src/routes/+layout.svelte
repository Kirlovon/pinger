<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	
	let { children } = $props();
</script>

<svelte:head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width" />
	<link rel="icon" href={favicon} />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="preconnect" href="https://rsms.me/" />
	<link rel="preconnect" href="https://api.fontshare.com/" />
	<link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
	<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=neco@900&display=swap" />
	<title>pinger</title>
</svelte:head>

{@render children()}

