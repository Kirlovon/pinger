import { describe, it, expect } from 'vitest';
import { PING_INTERVAL, REQUEST_TIMEOUT } from '$lib/config';

describe('config', () => {
	describe('PING_INTERVAL', () => {
		it('is defined and is a number', () => {
			expect(PING_INTERVAL).toBeDefined();
			expect(typeof PING_INTERVAL).toBe('number');
		});

		it('is greater than 0', () => {
			expect(PING_INTERVAL).toBeGreaterThan(0);
		});

		it('is set to 5000ms (5 seconds)', () => {
			expect(PING_INTERVAL).toBe(5000);
		});
	});

	describe('REQUEST_TIMEOUT', () => {
		it('is defined and is a number', () => {
			expect(REQUEST_TIMEOUT).toBeDefined();
			expect(typeof REQUEST_TIMEOUT).toBe('number');
		});

		it('is greater than 0', () => {
			expect(REQUEST_TIMEOUT).toBeGreaterThan(0);
		});

		it('is set to 500ms', () => {
			expect(REQUEST_TIMEOUT).toBe(500);
		});

		it('is less than PING_INTERVAL', () => {
			expect(REQUEST_TIMEOUT).toBeLessThan(PING_INTERVAL);
		});
	});
});
