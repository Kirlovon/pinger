import pLimit from 'p-limit';
import signale from 'signale';
import { sendRequest } from '$lib/utils';
import { PING_INTERVAL, REQUEST_TIMEOUT } from '$lib/config';
import { prisma, type Url } from './prisma.ts';
import { nanoid } from 'nanoid';
import { emitEvent } from './events';

// Extend globalThis to include interval
declare global {
	var pingerInterval: ReturnType<typeof setInterval> | null;
}

// Max 10 concurrent requests
const limit = pLimit(10); 

// Interval handler stored in global context to persist across HMR
export let lastPingAt: Date | null = null;
export let nextPingAt: Date = getNextPingTime();

/**
 * Setup sending interval
 */
export function setupInterval() {
	// Clear any existing interval to prevent duplicates
	if (globalThis.pingerInterval) {
		clearInterval(globalThis.pingerInterval);
		signale.info('Cleared existing pinger interval');
	}
	
	globalThis.pingerInterval = setInterval(() => pingUrls(), PING_INTERVAL);
	nextPingAt = getNextPingTime();
	signale.info('Pinger interval initialized');
}

/**
 * Get the next scheduled ping time
 */
function getNextPingTime(): Date {
    return new Date(Date.now() + PING_INTERVAL);
}

/**
 * Send ping requests to all URLs in the database.
 */
async function pingUrls() {
	try {
		const urls = await prisma.url.findMany();

		signale.info(`Starting ping cycle for ${urls.length} URLs.`);

		lastPingAt = new Date();
		const promises = urls.map(url => limit(() => pingUrl(url)));
		await Promise.all(promises);
		nextPingAt = getNextPingTime();

		// Emit interval status event after all pings complete
		emitEvent({
			type: 'interval_status',
			timestamp: Date.now(),
			lastPingAt: lastPingAt.getTime(),
			nextPingAt: nextPingAt.getTime()
		});

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
	const pingRequest = await prisma.pingRequest.upsert({
		where: { urlId: url.id },
		update: {
			status: response.status,
			responseTime: response.responseTime,
			createdAt: new Date(),
		},
		create: {
			id: nanoid(),
			urlId: url.id,
			status: response.status,
			responseTime: response.responseTime,
		},
	});

	// Emit url_pinged event
	emitEvent({
		type: 'url_pinged',
		timestamp: Date.now(),
		url,
		ping: pingRequest
	});
}
