import { json, error, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { createUrlSchema, deleteUrlSchema } from '$lib/schema';

/**
 * GET - Fetch all URLs
 */
export const GET: RequestHandler = async () => {
	const urls = await prisma.url.findMany({ include: { lastPing: true } });
	return json({ urls: urls });
};

/**
 * POST - Create a new URL
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const result = createUrlSchema.safeParse(body);
	if (!result.success) error(400, { message: result.error.message });

	// Check if URL is localhost
	const url = new URL(result.data.url);
	if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1') {
		error(400, { message: 'Localhost URLs are not allowed' });
	}

	const newUrl = await prisma.url.create({
		data: result.data,
	});

	return json({ url: newUrl }, { status: 201 });
};

/**
 * DELETE - Delete a URL
 */
export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const result = deleteUrlSchema.safeParse(body);
	if (!result.success) error(400, { message: result.error.message });

	await prisma.url.delete({
		where: { id: result.data.id },
	});

	return json({ success: true });
};
