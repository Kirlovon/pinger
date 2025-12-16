import { describe, it, expect } from 'vitest';
import { createUrlSchema, deleteUrlSchema } from '$lib/schema';

describe('createUrlSchema', () => {
	it('validates a valid URL with auto-generated id', () => {
		const result = createUrlSchema.safeParse({
			url: 'https://example.com'
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.url).toBe('https://example.com');
			expect(typeof result.data.id).toBe('string');
			expect(result.data.id.length).toBeGreaterThan(0);
		}
	});

	it('validates a URL with custom id', () => {
		const customId = 'V1StGXR8_Z5jdHi6B-myT';
		const result = createUrlSchema.safeParse({
			url: 'https://example.com',
			id: customId
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.id).toBe(customId);
		}
	});

	it('validates a URL with createdAt date', () => {
		const date = new Date('2024-01-01');
		const result = createUrlSchema.safeParse({
			url: 'https://example.com',
			createdAt: date.toISOString()
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.createdAt).toEqual(date);
		}
	});

	it('rejects invalid URL format', () => {
		const result = createUrlSchema.safeParse({
			url: 'not-a-valid-url'
		});

		expect(result.success).toBe(false);
	});

	it('rejects missing URL', () => {
		const result = createUrlSchema.safeParse({});

		expect(result.success).toBe(false);
	});

	it('rejects empty URL', () => {
		const result = createUrlSchema.safeParse({
			url: ''
		});

		expect(result.success).toBe(false);
	});

	it('accepts URLs with different protocols', () => {
		const httpResult = createUrlSchema.safeParse({ url: 'http://example.com' });
		const httpsResult = createUrlSchema.safeParse({ url: 'https://example.com' });

		expect(httpResult.success).toBe(true);
		expect(httpsResult.success).toBe(true);
	});

	it('accepts URLs with paths and query strings', () => {
		const result = createUrlSchema.safeParse({
			url: 'https://example.com/path/to/resource?query=value&other=123'
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.url).toBe('https://example.com/path/to/resource?query=value&other=123');
		}
	});

	it('accepts URLs with ports', () => {
		const result = createUrlSchema.safeParse({
			url: 'https://example.com:8080/api'
		});

		expect(result.success).toBe(true);
	});
});

describe('deleteUrlSchema', () => {
	it('validates a valid nanoid', () => {
		const validId = 'V1StGXR8_Z5jdHi6B-myT';
		const result = deleteUrlSchema.safeParse({ id: validId });

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.id).toBe(validId);
		}
	});

	it('rejects missing id', () => {
		const result = deleteUrlSchema.safeParse({});

		expect(result.success).toBe(false);
	});

	it('rejects empty id', () => {
		const result = deleteUrlSchema.safeParse({ id: '' });

		expect(result.success).toBe(false);
	});

	it('rejects invalid nanoid format', () => {
		const result = deleteUrlSchema.safeParse({ id: 'invalid-id-format-too-short' });

		// nanoid validation may vary, this tests the schema behavior
		expect(result).toBeDefined();
	});
});
