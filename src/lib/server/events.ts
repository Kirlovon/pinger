import { stringify } from 'devalue';
import type { PingRequest, Url } from './prisma';

// Store all active connections
const clients = new Set<ReadableStreamDefaultController>();

// Structure of connected event
export interface ServerEventConnected {
	type: 'connected';
	timestamp: number;
}

// Event when a URL is pinged
export interface ServerEventUrlPinged {
	type: 'url_pinged';
	timestamp: number;
	url: Url;
	ping: PingRequest;
}

// Event with interval status (timing information)
export interface ServerEventIntervalStatus {
	type: 'interval_status';
	timestamp: number;
	lastPingAt: number | null;
	nextPingAt: number;
}

// Union type for all events
export type ServerEvent =
	| ServerEventConnected
	| ServerEventUrlPinged
	| ServerEventIntervalStatus;

/**
 * Emits an event to all connected clients.
 * @param event - The event to emit to all connected clients.
 */
export function emitEvent(event: ServerEvent) {
	const message = `data: ${stringify(event)}\n\n`;
	const encoder = new TextEncoder();
	const encoded = encoder.encode(message);

	clients.forEach((controller) => {
		try {
			controller.enqueue(encoded);
		} catch (error) {
			clients.delete(controller); // Remove client if sending fails
		}
	});
}

/**
 * Adds a new client connection to the set of active clients.
 * @param controller - The ReadableStreamDefaultController for the client connection.
 */
export function addClient(controller: ReadableStreamDefaultController) {
	clients.add(controller);
}

/**
 * Removes a client connection from the set of active clients.
 * @param controller - The ReadableStreamDefaultController for the client connection.
 */
export function removeClient(controller: ReadableStreamDefaultController) {
	clients.delete(controller);
}

/**
 * Returns the current number of connected clients.
 * @returns The number of connected clients.
 */
export function getClientCount() {
	return clients.size;
}
