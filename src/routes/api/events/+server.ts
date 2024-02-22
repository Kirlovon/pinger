import type { RequestHandler } from '../$types';
import { LISTENERS } from '$lib/services/pinger';
import { EventEmitter } from 'node:events';

export const GET: RequestHandler = async () => {
    const ee = new EventEmitter();
    LISTENERS.add(ee);

    const stream = new ReadableStream({
        start(controller) {
            ee.on('request_start', (url) => {
                controller.enqueue(`event:request_start\ndata:${JSON.stringify(url)}\n\n`);
            });

            ee.on('request_end', (url) => {
                controller.enqueue(`event:request_end\ndata:${JSON.stringify(url)}\n\n`);
            });
        },

        cancel() {
            LISTENERS.delete(ee);
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
};