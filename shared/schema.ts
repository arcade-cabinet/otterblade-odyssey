import { sql } from 'drizzle-orm';
import { pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const users = pgTable('users', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
});

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Manually define User type to match the table structure
export type User = {
  id: string;
  username: string;
  password: string;
};
