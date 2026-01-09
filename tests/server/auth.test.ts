import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables before importing the module
vi.mock('$env/dynamic/private', () => ({
	env: {
		ACCESS_USERNAME: 'testuser',
		ACCESS_PASSWORD: 'testpassword'
	}
}));

describe('auth', () => {
	describe('isAuthorized', () => {
		let isAuthorized: (request: Request) => boolean;

		beforeEach(async () => {
			// Re-import to get fresh module with mocked env
			const authModule = await import('$lib/server/auth');
			isAuthorized = authModule.isAuthorized;
		});

		it('returns true for valid credentials', () => {
			const credentials = btoa('testuser:testpassword');
			const request = new Request('http://localhost', {
				headers: {
					authorization: `Basic ${credentials}`
				}
			});

			expect(isAuthorized(request)).toBe(true);
		});

		it('returns false for invalid username', () => {
			const credentials = btoa('wronguser:testpassword');
			const request = new Request('http://localhost', {
				headers: {
					authorization: `Basic ${credentials}`
				}
			});

			expect(isAuthorized(request)).toBe(false);
		});

		it('returns false for invalid password', () => {
			const credentials = btoa('testuser:wrongpassword');
			const request = new Request('http://localhost', {
				headers: {
					authorization: `Basic ${credentials}`
				}
			});

			expect(isAuthorized(request)).toBe(false);
		});

		it('returns false for missing authorization header', () => {
			const request = new Request('http://localhost');

			expect(isAuthorized(request)).toBe(false);
		});

		it('returns false for non-Basic auth scheme', () => {
			const request = new Request('http://localhost', {
				headers: {
					authorization: 'Bearer some-token'
				}
			});

			expect(isAuthorized(request)).toBe(false);
		});

		it('returns false for empty authorization header', () => {
			const request = new Request('http://localhost', {
				headers: {
					authorization: ''
				}
			});

			expect(isAuthorized(request)).toBe(false);
		});

		it('returns false for malformed Basic auth (missing credentials)', () => {
			const request = new Request('http://localhost', {
				headers: {
					authorization: 'Basic '
				}
			});

			expect(isAuthorized(request)).toBe(false);
		});

		it('returns false for credentials without colon separator', () => {
			const credentials = btoa('usernameonly');
			const request = new Request('http://localhost', {
				headers: {
					authorization: `Basic ${credentials}`
				}
			});

			expect(isAuthorized(request)).toBe(false);
		});
	});

	describe('isAuthEnabled', () => {
		it('is true when both username and password are set', async () => {
			const { isAuthEnabled } = await import('$lib/server/auth');
			expect(isAuthEnabled).toBe(true);
		});
	});
});
