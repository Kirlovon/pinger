import signale from 'signale';
import { sendRequest } from '$lib/utils';
import { PING_INTERVAL, REQUEST_TIMEOUT } from '$lib/config';
import { prisma, type Url } from './prisma.ts';

// Last ping time
export let lastPingAt: Date | null = null;

// Define global interval variable, for sending pings
declare namespace globalThis {
	let interval: ReturnType<typeof setInterval>;
}

/**
 * Setup sending interval
 */
export function setupInterval() {
	clearInterval(globalThis.interval);
	globalThis.interval = setInterval(() => pingUrls(), PING_INTERVAL);
}

/**
 * Send ping requests to all URLs in the database.
 */
async function pingUrls() {
	try {
		const urls = await prisma.url.findMany();
		lastPingAt = new Date();

		const promises = [];
		for (const url of urls) promises.push(pingUrl(url));
		await Promise.all(promises);
	} catch (error) {
		signale.error(error);
	}
}

/**
 * Send a ping request to the given URL and log the result.
 * @param url - The URL object containing the URL to ping.
 */
async function pingUrl(url: Url, timeout: number = REQUEST_TIMEOUT) {
	const response = await sendRequest(url.url, timeout);

	if (!response.success) {
		signale.warn(`Ping to ${url.url} failed: ${response.error}`);
		return;
	}
	
	signale.success(`Ping to ${url.url} succeeded: ${response.status} in ${response.responseTime}ms`);
	
	// Save ping request
	await prisma.pingRequest.upsert({
		where: { urlId: url.id },
		update: {
			status: response.status,
			responseTime: response.responseTime,
			createdAt: new Date(),
		},
		create: {
			id: crypto.randomUUID(),
			urlId: url.id,
			status: response.status,
			responseTime: response.responseTime,
		},
	});
}
