import { onMount } from 'svelte';

interface SSEClientOptions {
    url: string;
    onMessage?: (data: unknown) => void;
    onError?: (error: Event) => void;
    onOpen?: () => void;
}

/**
 * Creates an SSE (Server-Sent Events) client for usage in Svelte 5 components.
 * Automatically connects on mount and cleans up on unmount.
 * 
 * @example
 * ```ts
 * let data = $state([]);
 * 
 * createSSEClient({
 *   url: '/api/events',
 *   onMessage: (payload) => {
 *     data = payload;
 *   }
 * });
 * ```
 */
export function createSSEClient(options: SSEClientOptions) {
    let eventSource: EventSource | null = null;

    onMount(() => {
        eventSource = new EventSource(options.url);

        eventSource.onopen = () => {
            options.onOpen?.();
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                options.onMessage?.(data);
            } catch (error) {
                console.error('Failed to parse SSE message:', error);
            }
        };

        eventSource.onerror = (error) => {
            options.onError?.(error);
            console.error('SSE connection error:', error);
        };

        return () => {
            eventSource?.close();
            eventSource = null;
        };
    });

    return {
        close: () => eventSource?.close()
    };
}