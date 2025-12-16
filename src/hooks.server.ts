import type { Handle } from '@sveltejs/kit';
import signale from 'signale';
import { isAuthEnabled, isAuthorized } from '$lib/server/auth';
import { setupInterval } from "$lib/server/pinger";

// Log about authentication status
if (isAuthEnabled) {
    signale.info('Basic authentication is enabled!');
} else {
    signale.warn('Basic authentication is NOT enabled! Make sure to set ACCESS_USERNAME and ACCESS_PASSWORD environment variables to enable it.');
}

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
