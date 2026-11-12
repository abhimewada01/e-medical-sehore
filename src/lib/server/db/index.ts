import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const connectionString = env.DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL must be configured before starting the application.');
}

const client = postgres(connectionString, {
	// Vercel may create many short-lived serverless instances; keep each one to a
	// single connection so the combined pool stays within PostgreSQL limits.
	max: process.env.VERCEL ? 1 : 10,
	idle_timeout: 20,
	connect_timeout: 10
});

export const db = drizzle(client, { schema });
