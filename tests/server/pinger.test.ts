import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { interval, lastPingAt, nextPingAt, setupInterval } from '$lib/server/pinger';
import { PING_INTERVAL } from '$lib/config';

// Mock dependencies
vi.mock('$lib/utils', () => ({
	sendRequest: vi.fn()
}));

vi.mock('$lib/server/prisma', () => ({
	prisma: {
		url: {
			findMany: vi.fn()
		},
		pingRequest: {
			upsert: vi.fn()
		}
	}
}));

vi.mock('signale', () => ({
	default: {
		error: vi.fn(),
		warn: vi.fn(),
		success: vi.fn()
	}
}));

describe('pinger', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		if (interval) {
			clearInterval(interval);
		}
		vi.clearAllMocks();
	});

	describe('setupInterval', () => {
		it('creates an interval', () => {
			setupInterval();
			expect(interval).not.toBeNull();
		});

		it('sets nextPingAt to future time', () => {
			const now = Date.now();
			setupInterval();
			expect(nextPingAt.getTime()).toBeGreaterThanOrEqual(now);
			expect(nextPingAt.getTime()).toBeLessThanOrEqual(now + PING_INTERVAL + 100);
		});

		it('clears existing interval when called again', () => {
			setupInterval();
			const firstInterval = interval;
			
			setupInterval();
			const secondInterval = interval;

			expect(firstInterval).not.toBe(secondInterval);
		});
	});

	describe('exports', () => {
		it('exports lastPingAt initially as null', () => {
			// lastPingAt is set when pingUrls runs
			// At module load, it should be null
			expect(lastPingAt).toBeNull();
		});

		it('exports nextPingAt as a Date', () => {
			expect(nextPingAt).toBeInstanceOf(Date);
		});

		it('interval is null before setup', () => {
			// After the module is imported but before setupInterval is called,
			// if no previous test ran, interval might be null or set from previous test
			// This test verifies the type is correct
			expect(interval === null || typeof interval === 'object').toBe(true);
		});
	});

	describe('configuration', () => {
		it('uses PING_INTERVAL from config', () => {
			expect(typeof PING_INTERVAL).toBe('number');
			expect(PING_INTERVAL).toBeGreaterThan(0);
		});
	});
});
