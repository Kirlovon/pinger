import { env } from '$env/dynamic/private';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../../prisma/generated/client';

const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Re-export PrismaClient types for convenience
export type * from '../../../prisma/generated/client';

export { prisma };
