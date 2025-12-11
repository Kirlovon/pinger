// @ts-nocheck
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { lastPingAt } from '$lib/server/pinger';
import { PING_INTERVAL } from '$lib/config';

// Pass URLs on load for initial rendering
export const load = async () => {
    const urls = await prisma.url.findMany({
        include: { lastPing: true },
        orderBy: { createdAt: 'asc' }
    });
    
    return {
        urls,
        lastPingDate : lastPingAt,
        pingInterval: PING_INTERVAL
    };
};
;null as any as PageServerLoad;