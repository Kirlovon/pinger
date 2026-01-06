import type { RequestHandler } from '@sveltejs/kit';
import {
	addClient,
	removeClient,
	type ServerEventConnected,
	type ServerEventIntervalStatus
} from '$lib/server/events';
import { lastPingAt, nextPingAt } from '$lib/server/pinger';
import { PING_INTERVAL } from '$lib/config';

export const GET: RequestHandler = async () => {
	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();
			addClient(controller);

			// Send initial connection message
			const connectedMessage: ServerEventConnected = { type: 'connected', timestamp: Date.now() };
			controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectedMessage)}\n\n`));

			// Send initial interval status
			const initialStatusMessage: ServerEventIntervalStatus = {
				type: 'interval_status',
				timestamp: Date.now(),
				lastPingAt: lastPingAt?.getTime() ?? null,
				nextPingAt: nextPingAt.getTime()
			};
			controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialStatusMessage)}\n\n`));

			// Send interval status every 5 seconds
			const statusInterval = setInterval(() => {
				try {
					const statusMessage: ServerEventIntervalStatus = {
						type: 'interval_status',
						timestamp: Date.now(),
						lastPingAt: lastPingAt?.getTime() ?? null,
						nextPingAt: nextPingAt.getTime()
					};
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(statusMessage)}\n\n`));
				} catch (error) {
					clearInterval(statusInterval);
					removeClient(controller);
				}
			}, 5000);

			// Cleanup on close
			return () => {
				clearInterval(statusInterval);
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
