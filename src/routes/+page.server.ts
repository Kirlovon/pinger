import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { lastPingAt, nextPingAt } from '$lib/server/pinger';

// Pass URLs on load for initial rendering
export const load: PageServerLoad = async () => {
    const urls = await prisma.url.findMany({
        include: { lastPing: true },
        orderBy: { createdAt: 'asc' }
    });


    console.log(urls);
    return {
        urls,
        lastPingAt: lastPingAt?.getTime() ?? null,
        nextPingAt: nextPingAt.getTime()
    };
};
