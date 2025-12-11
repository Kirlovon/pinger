import { z } from 'zod';

/**
 * Schema for creating a new URL
 */
export const createUrlSchema = z.object({
    url: z.url('Invalid URL format'),
    id: z.uuid().default(() => crypto.randomUUID()),
    createdAt: z.coerce.date().optional()
});

/**
 * Schema for deleting a URL by ID
 */
export const deleteUrlSchema = z.object({
    id: z.uuid()
});

export type CreateUrlInput = z.infer<typeof createUrlSchema>;
export type DeleteUrlInput = z.infer<typeof deleteUrlSchema>;
