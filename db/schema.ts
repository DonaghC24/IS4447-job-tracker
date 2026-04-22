// database schema - defines all tables using drizzle orm
// drizzle converts these typescript definitions into sqlite tables
// types are inferred directly from the schema to keep everything in sync

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// categories table - used to organise applications by type or sector
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#2563eb'),
});

// applications table - the primary record storing each job application
export const applications = sqliteTable('applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  company: text('company').notNull(),
  role: text('role').notNull(),
  status: text('status').notNull().default('Applied'),
  dateApplied: text('date_applied').notNull(),
  categoryId: integer('category_id').notNull(),
  notes: text('notes'),
});

// inferred types for categories
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

// inferred types for applications
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

// extended type that joins category name and colour onto an application
export type ApplicationWithCategory = Application & {
  categoryName: string | null;
  categoryColor: string | null;
};

// users table - stores account credentials for the login system
export const users = sqliteTable('users', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  username:     text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  // salt is stored alongside the hash for secure password verification
  salt:         text('salt').notNull(),
  createdAt:    text('created_at').notNull(),
});

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// targets table - stores weekly or monthly application goals
// categoryid is nullable - null means the target applies to all categories
export const targets = sqliteTable('targets', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  period:     text('period').notNull().$type<'weekly' | 'monthly'>(),
  count:      integer('count').notNull(),
  categoryId: integer('category_id'),
});

export type Target    = typeof targets.$inferSelect;
export type NewTarget = typeof targets.$inferInsert;

// extended type that includes calculated progress fields for the targets screen
export type TargetWithProgress = {
  id:           number;
  period:       'weekly' | 'monthly';
  count:        number;
  categoryId:   number | null;
  categoryName: string | null;
  actual:       number;    // how many applications have been made in this period
  remaining:    number;    // how many more are needed to hit the target
  exceeded:     boolean;   // true if the target has been met or surpassed
};