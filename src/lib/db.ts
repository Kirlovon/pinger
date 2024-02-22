import { drizzle } from 'drizzle-orm/better-sqlite3';
import { urls } from './schema';
import Database from 'better-sqlite3';

export const sqlite = new Database('data.db', { fileMustExist: true });
export const db = drizzle(sqlite, { schema: { urls } });

