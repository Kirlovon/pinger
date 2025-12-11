import type { Handle } from '@sveltejs/kit';
import { isAuthEnabled, isAuthorized } from '$lib/server/auth';
import { setupInterval } from "$lib/server/pinger";

// Setup fetching interval on server start
setupInterval();

// Middleware to handle basic authentication
export const handle: Handle = async ({ event, resolve }) => {
    if (isAuthEnabled) {
        if (!isAuthorized(event.request)) {
            return new Response('Unauthorized', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Restricted Area"'
                }
            });
        }
    }
    
    return resolve(event);
};
