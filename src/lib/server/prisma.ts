import { DATABASE_URL } from '$env/static/private';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../../../prisma/generated/client';

const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export type * from '../../../prisma/generated/client';
export { prisma };
