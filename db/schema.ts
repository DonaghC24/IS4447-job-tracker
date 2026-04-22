import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#2563eb'),
});

export const applications = sqliteTable('applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  company: text('company').notNull(),
  role: text('role').notNull(),
  status: text('status').notNull().default('Applied'),
  dateApplied: text('date_applied').notNull(),
  categoryId: integer('category_id').notNull(),
  notes: text('notes'),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

export type ApplicationWithCategory = Application & {
  categoryName: string | null;
  categoryColor: string | null;
};

export const users = sqliteTable('users', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  username:     text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt:         text('salt').notNull(),
  createdAt:    text('created_at').notNull(),
});

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const targets = sqliteTable('targets', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  period:     text('period').notNull().$type<'weekly' | 'monthly'>(),
  count:      integer('count').notNull(),
  categoryId: integer('category_id'),
});

export type Target    = typeof targets.$inferSelect;
export type NewTarget = typeof targets.$inferInsert;

export type TargetWithProgress = {
  id:           number;
  period:       'weekly' | 'monthly';
  count:        number;
  categoryId:   number | null;
  categoryName: string | null;
  actual:       number;
  remaining:    number;
  exceeded:     boolean;
};
