import type { Actions } from './$types'
import { fail } from '@sveltejs/kit'
import { addUrl, INTERVAL, getLastFetchDate, getUrls, removeUrlByID } from '$lib/services/pinger'
import { validURL } from '$lib/utils'

export async function load() {
    return {
        interval: INTERVAL,
        urls: await getUrls(),
        lastFetchDate: await getLastFetchDate()
    };
}

export const actions: Actions = {
    add: async ({ request }) => {
        const data = await request.formData()
        const url = data.get('url')

        if (typeof url !== 'string' || !validURL(url)) {
            return fail(400, { url, error: 'Invalid URL specified' });
        }

        await addUrl(url);
        return { success: true };
    },

    delete: async ({ request }) => {
        const data = await request.formData()
        const id = data.get('id');

        if (typeof id === 'string') await removeUrlByID(id);
        return { success: true };
    }
}