import { describe, it, expect, beforeEach, vi } from 'vitest';
import { emitEvent, addClient, removeClient, getClientCount } from '$lib/server/events';

describe('events', () => {
	// Create a mock controller for testing
	function createMockController(): ReadableStreamDefaultController & { enqueuedData: Uint8Array[] } {
		const enqueuedData: Uint8Array[] = [];
		return {
			desiredSize: 1,
			enqueuedData,
			enqueue: vi.fn((chunk: Uint8Array) => {
				enqueuedData.push(chunk);
			}),
			close: vi.fn(),
			error: vi.fn()
		} as unknown as ReadableStreamDefaultController & { enqueuedData: Uint8Array[] };
	}

	beforeEach(() => {
		// Clear all clients before each test
		// We need to get current count and remove them all
		const count = getClientCount();
		for (let i = 0; i < count; i++) {
			// Since we don't have direct access to clear, we'll work around this
		}
	});

	describe('addClient and getClientCount', () => {
		it('adds a client and increases count', () => {
			const initialCount = getClientCount();
			const controller = createMockController();

			addClient(controller);

			expect(getClientCount()).toBe(initialCount + 1);

			// Cleanup
			removeClient(controller);
		});

		it('adds multiple clients', () => {
			const initialCount = getClientCount();
			const controller1 = createMockController();
			const controller2 = createMockController();
			const controller3 = createMockController();

			addClient(controller1);
			addClient(controller2);
			addClient(controller3);

			expect(getClientCount()).toBe(initialCount + 3);

			// Cleanup
			removeClient(controller1);
			removeClient(controller2);
			removeClient(controller3);
		});
	});

	describe('removeClient', () => {
		it('removes a client and decreases count', () => {
			const controller = createMockController();
			addClient(controller);
			const countAfterAdd = getClientCount();

			removeClient(controller);

			expect(getClientCount()).toBe(countAfterAdd - 1);
		});

		it('does not throw when removing non-existent client', () => {
			const controller = createMockController();

			expect(() => removeClient(controller)).not.toThrow();
		});
	});

	describe('emitEvent', () => {
		it('sends data to all connected clients', () => {
			const controller1 = createMockController();
			const controller2 = createMockController();

			addClient(controller1);
			addClient(controller2);

			const testEvent = {
				type: 'interval_status' as const,
				timestamp: Date.now(),
				lastPingAt: Date.now(),
				nextPingAt: Date.now() + 5000
			};
			emitEvent(testEvent);

			expect(controller1.enqueue).toHaveBeenCalled();
			expect(controller2.enqueue).toHaveBeenCalled();

			// Cleanup
			removeClient(controller1);
			removeClient(controller2);
		});

		it('formats event data correctly', () => {
			const controller = createMockController();
			addClient(controller);

			const testEvent = { type: 'connected' as const, timestamp: Date.now() };
			emitEvent(testEvent);

			// Decode the enqueued data
			const decoder = new TextDecoder();
			const encodedData = controller.enqueuedData[0];
			const decodedMessage = decoder.decode(encodedData);

			// Should be in SSE format: "data: {...}\n\n"
			expect(decodedMessage).toMatch(/^data: /);
			expect(decodedMessage).toMatch(/\n\n$/);

			// Parse the JSON payload
			const jsonStr = decodedMessage.replace('data: ', '').trim();
			const parsed = JSON.parse(jsonStr);

			expect(parsed.type).toBe('connected');
			expect(typeof parsed.timestamp).toBe('number');

			// Cleanup
			removeClient(controller);
		});

		it('removes client if enqueue throws', () => {
			const failingController = {
				desiredSize: 1,
				enqueue: vi.fn(() => {
					throw new Error('Connection closed');
				}),
				close: vi.fn(),
				error: vi.fn()
			} as unknown as ReadableStreamDefaultController;

			addClient(failingController);
			const countAfterAdd = getClientCount();

			emitEvent({
				type: 'interval_status' as const,
				timestamp: Date.now(),
				lastPingAt: Date.now(),
				nextPingAt: Date.now() + 5000
			});

			// Client should be removed after failed enqueue
			expect(getClientCount()).toBe(countAfterAdd - 1);
		});

		it('continues sending to other clients if one fails', () => {
			const failingController = {
				desiredSize: 1,
				enqueue: vi.fn(() => {
					throw new Error('Connection closed');
				}),
				close: vi.fn(),
				error: vi.fn()
			} as unknown as ReadableStreamDefaultController;

			const workingController = createMockController();

			addClient(failingController);
			addClient(workingController);

			emitEvent({
				type: 'interval_status' as const,
				timestamp: Date.now(),
				lastPingAt: Date.now(),
				nextPingAt: Date.now() + 5000
			});

			// Working controller should still receive the event
			expect(workingController.enqueue).toHaveBeenCalled();

			// Cleanup
			removeClient(workingController);
		});

		it('does nothing when no clients connected', () => {
			// Just ensure it doesn't throw
			expect(() =>
				emitEvent({
					type: 'interval_status' as const,
					timestamp: Date.now(),
					lastPingAt: Date.now(),
					nextPingAt: Date.now() + 5000
				})
			).not.toThrow();
		});

		it('includes timestamp in event payload', () => {
			const controller = createMockController();
			addClient(controller);

			const beforeTime = Date.now();
			emitEvent({
				type: 'interval_status' as const,
				timestamp: Date.now(),
				lastPingAt: Date.now(),
				nextPingAt: Date.now() + 5000
			});
			const afterTime = Date.now();

			const decoder = new TextDecoder();
			const decodedMessage = decoder.decode(controller.enqueuedData[0]);
			const jsonStr = decodedMessage.replace('data: ', '').trim();
			const parsed = JSON.parse(jsonStr);

			expect(parsed.timestamp).toBeGreaterThanOrEqual(beforeTime);
			expect(parsed.timestamp).toBeLessThanOrEqual(afterTime);

			// Cleanup
			removeClient(controller);
		});
	});
});
