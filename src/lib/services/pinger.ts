import type { EventEmitter } from 'node:events';
import signale from 'signale';
import { db } from '$lib/db';
import { urls } from '$lib/schema';
import { eq, type InferSelectModel } from 'drizzle-orm';

// Fetch interval
export const INTERVAL = 1000 * 3;

// Events emitter
export const LISTENERS = new Set<EventEmitter>();

declare namespace globalThis {
	let interval: ReturnType<typeof setInterval>;
}

/**
 * Get all urls
 */
export async function getUrls() {
	return await db.query.urls.findMany();
}

/**
 * Add url to the list
 * @param url URL to add
 */
export async function addUrl(url: string) {
	return await db.insert(urls).values({ url, timeTaken: null });
}

/**
 * Remove url by ID
 * @param id ID to remove by
 */
export async function removeUrlByID(id: string) {
	return await db.delete(urls).where(eq(urls.id, id));
}

/**
 * Remove url from list
 * @param url URL to add
 */
export async function removeUrlByValue(url: string) {
	return await db.delete(urls).where(eq(urls.url, url));
}

/**
 * Get last fetch date
 */
export async function getLastFetchDate() {
	const lastFetchedUser = await db.select().from(urls).orderBy(urls.lastFetch).limit(1);
	if (!lastFetchedUser.length) return Date.now();

	return lastFetchedUser[0].lastFetch as number;
}
/**
 * Setup sending interval
 */
export function setupInterval() {
	clearInterval(globalThis.interval);
	globalThis.interval = setInterval(() => sendFetchRequests(), INTERVAL);
}

/**
 * Send request
 */
async function sendFetchRequests() {
	const entities = await db.query.urls.findMany();
	const promises = [];

	for (const entity of entities) {
		const promise = sendRequest(entity);
		promises.push(promise);
	}

	await Promise.all(promises);
}

export async function sendRequest(entity: InferSelectModel<typeof urls>) {
	// Notify about request start
	LISTENERS.forEach((listener) => {
		listener.emit('request_start', entity);
	});

	let response: Response;
	const start = Date.now();

	try {
		response = await fetch(entity.url);
	} catch (error) {
		signale.fatal(error);
	}

	const end = Date.now();
	const time = end - start;

	// Notify about request end
	LISTENERS.forEach((listener) => {
		listener.emit('request_end', { ...entity, time, ok: response?.ok });
	});

	signale.success(`Requests sent to "${entity.url}" (took ${time} ms)`);

	// Update DB
	await db.update(urls).set({ lastFetch: end, timeTaken: time }).where(eq(urls.id, entity.id));
}
