import signale from 'signale';
import { PING_INTERVAL } from '$lib/config';
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
	globalThis.interval = setInterval(() => sendPingRequests(), PING_INTERVAL);
}

/**
 * Send request
 */
async function sendPingRequests() {
    try {
        const urls = await prisma.url.findMany();
    
        const promises = [];
        for (const url of urls) promises.push(sendRequest(url));    
        await Promise.all(promises);

        signale.info(`${promises.length} ping requests sent!`);

    } finally {
        lastPingAt = new Date();
    }
}

export async function sendRequest(url: Url) {
    let response: Response | undefined = undefined;
    const startTime = new Date();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 500); // 500 ms timeout

        response = await fetch(url.url, { signal: controller.signal });
        clearTimeout(timeoutId);
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            signale.error(`Request to "${url.url}" timed out`);
        } else {
            signale.error(`Request to "${url.url}" failed`);
        }
    }

    const endTime = new Date();
    const timeTaken = endTime.getTime() - startTime.getTime();
    
    // Log
    if (response?.ok) {
        signale.success(`Requests sent to "${url.url}" with status ${response?.status} (took ${timeTaken} ms)`);
    } else {
        signale.warn(`Requests sent to "${url.url}" with status ${response?.status} (took ${timeTaken} ms)`);
    }

    // Save ping request
    if (response) {
        await prisma.pingRequest.upsert({
            where: { urlId: url.id },
            update: {
                status: response.status,
                responseTime: timeTaken,
                createdAt: new Date(),
            },
            create: {
                id: crypto.randomUUID(),
                urlId: url.id,
                status: response.status,
                responseTime: timeTaken,
            },
        });
    }
}



