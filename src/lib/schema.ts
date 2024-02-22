import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { nanoid } from 'nanoid';

export const urls = sqliteTable('urls', {
    id: text('id').unique().primaryKey().$defaultFn(() => nanoid()),
    url: text('url').notNull(),
    timeTaken: integer('timeTaken'),
    lastFetch: integer('lastFetch').notNull().$defaultFn(() => Date.now()),
});