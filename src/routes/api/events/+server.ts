import type { RequestHandler } from '@sveltejs/kit';
import { addClient, removeClient } from '$lib/server/events';

export const GET: RequestHandler = async () => {
	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			// Add client to the set
			addClient(controller);

			// Send initial connection message
			controller.enqueue(
				encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`)
			);

			// Send periodic updates
			const interval = setInterval(() => {
				const message = {
					type: 'ping',
					timestamp: Date.now()
				};
				try {
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
				} catch (error) {
					clearInterval(interval);
					removeClient(controller);
				}
			}, 1000);

			// Cleanup on close
			return () => {
				clearInterval(interval);
				removeClient(controller);
			};
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
};
