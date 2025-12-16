// Store all active connections
const clients = new Set<ReadableStreamDefaultController>();

// Structure of connected event
export interface ServerEventConnected {
	type: 'connected';
	timestamp: number;
}

// Structure of ping event
export interface ServerEventPing {
	type: 'ping';
	timestamp: number;
}

// Structure of general data event
export interface ServerEventData {
	type: 'data';
	timestamp: number;
	data: Record<string, any>;
}

// Union type for all events
export type ServerEvent = ServerEventConnected | ServerEventPing | ServerEventData;

/**
 * Emits an event to all connected clients.
 * @param type - The type of the event.
 * @param data - The data associated with the event.
 */
export function emitEvent(data: ServerEventData['data']) {
	const payload: ServerEventData = {
		type: 'data',
		timestamp: Date.now(),
		data
	};

	const message = `data: ${JSON.stringify(payload)}\n\n`;
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
