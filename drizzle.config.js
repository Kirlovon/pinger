
/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./src/lib/schema.ts",
    out: './migrations',
    driver: 'better-sqlite',
    dbCredentials: { url: './data.db' }
};