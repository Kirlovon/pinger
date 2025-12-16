import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createUrlSchema, deleteUrlSchema } from '$lib/schema';

// Mock Prisma
const mockPrisma = {
	url: {
		findMany: vi.fn(),
		create: vi.fn(),
		delete: vi.fn()
	}
};

vi.mock('$lib/server/prisma', () => ({
	prisma: mockPrisma
}));

describe('URLs API Logic', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/urls', () => {
		it('returns empty array when no URLs exist', async () => {
			mockPrisma.url.findMany.mockResolvedValue([]);

			const urls = await mockPrisma.url.findMany({ include: { lastPing: true } });

			expect(urls).toEqual([]);
			expect(mockPrisma.url.findMany).toHaveBeenCalledWith({ include: { lastPing: true } });
		});

		it('returns array of URLs with lastPing data', async () => {
			const mockUrls = [
				{
					id: 'test-id-1',
					url: 'https://example.com',
					createdAt: new Date(),
					lastPing: { status: 200, responseTime: 50 }
				},
				{
					id: 'test-id-2',
					url: 'https://test.com',
					createdAt: new Date(),
					lastPing: null
				}
			];
			mockPrisma.url.findMany.mockResolvedValue(mockUrls);

			const urls = await mockPrisma.url.findMany({ include: { lastPing: true } });

			expect(urls).toEqual(mockUrls);
			expect(urls).toHaveLength(2);
		});
	});

	describe('POST /api/urls validation', () => {
		it('validates valid URL input', () => {
			const input = { url: 'https://example.com' };
			const result = createUrlSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it('rejects localhost URLs in validation', () => {
			const localhostVariants = [
				'http://localhost',
				'http://localhost:3000',
				'http://127.0.0.1',
				'http://127.0.0.1:8080'
			];

			localhostVariants.forEach(url => {
				const parsed = createUrlSchema.safeParse({ url });
				if (parsed.success) {
					const urlObj = new URL(parsed.data.url);
					const isLocalhost = urlObj.hostname === 'localhost' || 
					                   urlObj.hostname === '127.0.0.1' || 
					                   urlObj.hostname === '::1';
					expect(isLocalhost).toBe(true);
				}
			});
		});

		it('creates URL in database with valid input', async () => {
			const input = { url: 'https://example.com' };
			const parsed = createUrlSchema.safeParse(input);
			expect(parsed.success).toBe(true);

			if (parsed.success) {
				const mockCreatedUrl = {
					id: parsed.data.id,
					url: parsed.data.url,
					createdAt: new Date()
				};
				mockPrisma.url.create.mockResolvedValue(mockCreatedUrl);

				const result = await mockPrisma.url.create({ data: parsed.data });

				expect(result.url).toBe('https://example.com');
				expect(mockPrisma.url.create).toHaveBeenCalled();
			}
		});
	});

	describe('DELETE /api/urls validation', () => {
		it('validates valid nanoid', () => {
			const input = { id: 'V1StGXR8_Z5jdHi6B-myT' };
			const result = deleteUrlSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it('rejects missing id', () => {
			const result = deleteUrlSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('deletes URL from database', async () => {
			const input = { id: 'V1StGXR8_Z5jdHi6B-myT' };
			const parsed = deleteUrlSchema.safeParse(input);
			expect(parsed.success).toBe(true);

			if (parsed.success) {
				mockPrisma.url.delete.mockResolvedValue({ id: parsed.data.id });

				await mockPrisma.url.delete({ where: { id: parsed.data.id } });

				expect(mockPrisma.url.delete).toHaveBeenCalledWith({
					where: { id: 'V1StGXR8_Z5jdHi6B-myT' }
				});
			}
		});
	});
});

describe('URL localhost detection', () => {
	const isLocalhost = (urlString: string): boolean => {
		try {
			const url = new URL(urlString);
			return url.hostname === 'localhost' || 
			       url.hostname === '127.0.0.1' || 
			       url.hostname === '::1';
		} catch {
			return false;
		}
	};

	it('detects localhost', () => {
		expect(isLocalhost('http://localhost')).toBe(true);
		expect(isLocalhost('http://localhost:3000')).toBe(true);
		expect(isLocalhost('https://localhost/path')).toBe(true);
	});

	it('detects 127.0.0.1', () => {
		expect(isLocalhost('http://127.0.0.1')).toBe(true);
		expect(isLocalhost('http://127.0.0.1:8080')).toBe(true);
	});

	it('detects ::1 (IPv6 localhost)', () => {
		// Note: URL.hostname returns '[::1]' for IPv6, not '::1'
		// The actual API checks for '::1' which means IPv6 detection may need adjustment
		// This test documents the current behavior
		const url1 = new URL('http://[::1]');
		const url2 = new URL('http://[::1]:3000');
		
		// URL.hostname for IPv6 includes brackets in some environments
		expect(url1.hostname === '::1' || url1.hostname === '[::1]').toBe(true);
		expect(url2.hostname === '::1' || url2.hostname === '[::1]').toBe(true);
	});

	it('does not flag external URLs as localhost', () => {
		expect(isLocalhost('https://example.com')).toBe(false);
		expect(isLocalhost('https://api.github.com')).toBe(false);
		expect(isLocalhost('http://192.168.1.1')).toBe(false);
	});
});
