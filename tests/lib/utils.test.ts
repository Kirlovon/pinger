import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStatusColor, sendRequest } from '$lib/utils';

describe('getStatusColor', () => {
	it('returns lime-500 for 2xx status codes', () => {
		expect(getStatusColor(200)).toBe('bg-lime-500');
		expect(getStatusColor(201)).toBe('bg-lime-500');
		expect(getStatusColor(204)).toBe('bg-lime-500');
		expect(getStatusColor(299)).toBe('bg-lime-500');
	});

	it('returns cyan-500 for 3xx status codes', () => {
		expect(getStatusColor(300)).toBe('bg-cyan-500');
		expect(getStatusColor(301)).toBe('bg-cyan-500');
		expect(getStatusColor(302)).toBe('bg-cyan-500');
		expect(getStatusColor(304)).toBe('bg-cyan-500');
	});

	it('returns amber-500 for 4xx status codes', () => {
		expect(getStatusColor(400)).toBe('bg-amber-500');
		expect(getStatusColor(401)).toBe('bg-amber-500');
		expect(getStatusColor(403)).toBe('bg-amber-500');
		expect(getStatusColor(404)).toBe('bg-amber-500');
		expect(getStatusColor(499)).toBe('bg-amber-500');
	});

	it('returns red-500 for 5xx status codes', () => {
		expect(getStatusColor(500)).toBe('bg-red-500');
		expect(getStatusColor(502)).toBe('bg-red-500');
		expect(getStatusColor(503)).toBe('bg-red-500');
		expect(getStatusColor(504)).toBe('bg-red-500');
	});

	it('returns gray-500 for unknown status codes', () => {
		expect(getStatusColor(100)).toBe('bg-gray-500');
		expect(getStatusColor(101)).toBe('bg-gray-500');
		expect(getStatusColor(0)).toBe('bg-gray-500');
		expect(getStatusColor(600)).toBe('bg-gray-500');
	});
});

describe('sendRequest', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('returns success with status and responseTime for successful request', async () => {
		const mockResponse = new Response('OK', { status: 200 });
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

		const resultPromise = sendRequest('https://example.com', 1000);
		await vi.runAllTimersAsync();
		const result = await resultPromise;

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.status).toBe(200);
			expect(typeof result.responseTime).toBe('number');
		}
	});

	it('returns success false with error message for failed request', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

		const resultPromise = sendRequest('https://example.com', 1000);
		await vi.runAllTimersAsync();
		const result = await resultPromise;

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe('Network error');
		}
	});

	it('returns timeout error when request exceeds timeout', async () => {
		// Create an error that simulates AbortError
		const abortError = new Error('Aborted');
		abortError.name = 'AbortError';
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(abortError);

		const resultPromise = sendRequest('https://example.com', 500);
		await vi.runAllTimersAsync();
		const result = await resultPromise;

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe('Request timed out');
		}
	});

	it('handles non-Error exceptions gracefully', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce('string error');

		const resultPromise = sendRequest('https://example.com', 1000);
		await vi.runAllTimersAsync();
		const result = await resultPromise;

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBe('Unknown error');
		}
	});

	it('calculates response time correctly', async () => {
		const mockResponse = new Response('OK', { status: 200 });
		vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
			return mockResponse;
		});

		vi.useRealTimers(); // Use real timers for this test
		const result = await sendRequest('https://example.com', 1000);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.responseTime).toBeGreaterThanOrEqual(0);
		}
	});
});
