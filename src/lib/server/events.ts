// Store all active connections
const clients = new Set<ReadableStreamDefaultController>();

// Function to emit events to all connected clients
export function emitEvent(event: string, data: any) {
	const message = `data: ${JSON.stringify({ event, data, timestamp: Date.now() })}\n\n`;
	const encoder = new TextEncoder();
	const encoded = encoder.encode(message);

	clients.forEach((controller) => {
		try {
			controller.enqueue(encoded);
		} catch (error) {
			// Remove client if sending fails
			clients.delete(controller);
		}
	});
}

// Add a client connection
export function addClient(controller: ReadableStreamDefaultController) {
	clients.add(controller);
}

// Remove a client connection
export function removeClient(controller: ReadableStreamDefaultController) {
	clients.delete(controller);
}

// Get the number of active connections
export function getClientCount() {
	return clients.size;
}
