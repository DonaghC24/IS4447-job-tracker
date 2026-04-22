import { eq, and, between, count } from 'drizzle-orm';
import { db } from './index';
import {
  applications, categories, targets, users,
  NewApplication, NewCategory, NewTarget, NewUser,
  ApplicationWithCategory, TargetWithProgress,
} from './schema';

// --- Users ---

export function getUserByUsername(username: string) {
  return db.select().from(users).where(eq(users.username, username)).get();
}

export function getUserById(id: number) {
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function createUser(data: Omit<NewUser, 'id'>): { success: boolean; error?: string } {
  try {
    db.insert(users).values(data).run();
    return { success: true };
  } catch (e: any) {
    if (e?.message?.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'Username already taken.' };
    }
    throw e;
  }
}

export function deleteUser(id: number) {
  return db.delete(users).where(eq(users.id, id)).run();
}

// --- Date helpers ---

function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now); mon.setDate(now.getDate() + diff);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().split('T')[0], end: sun.toISOString().split('T')[0] };
}

function getCurrentMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const last = new Date(y, now.getMonth() + 1, 0).getDate();
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(last).padStart(2, '0')}` };
}

// --- Categories ---

export function getCategories() {
  return db.select().from(categories).all();
}

export function createCategory(data: Omit<NewCategory, 'id'>) {
  return db.insert(categories).values(data).run();
}

export function updateCategory(id: number, data: Partial<Omit<NewCategory, 'id'>>) {
  return db.update(categories).set(data).where(eq(categories.id, id)).run();
}

export function deleteCategory(id: number) {
  const inUse = db.select().from(applications).where(eq(applications.categoryId, id)).all();
  if (inUse.length > 0) {
    throw new Error(`Cannot delete: ${inUse.length} application(s) use this category.`);
  }
  const targetUse = db.select().from(targets).where(eq(targets.categoryId, id)).all();
  if (targetUse.length > 0) {
    throw new Error(`Cannot delete: ${targetUse.length} target(s) reference this category.`);
  }
  return db.delete(categories).where(eq(categories.id, id)).run();
}

// --- Applications ---

export function getApplications(): ApplicationWithCategory[] {
  return db
    .select({
      id: applications.id,
      company: applications.company,
      role: applications.role,
      status: applications.status,
      dateApplied: applications.dateApplied,
      categoryId: applications.categoryId,
      notes: applications.notes,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(applications)
    .leftJoin(categories, eq(applications.categoryId, categories.id))
    .all();
}

export function createApplication(data: Omit<NewApplication, 'id'>) {
  return db.insert(applications).values(data).run();
}

export function updateApplication(id: number, data: Partial<Omit<NewApplication, 'id'>>) {
  return db.update(applications).set(data).where(eq(applications.id, id)).run();
}

export function deleteApplication(id: number) {
  return db.delete(applications).where(eq(applications.id, id)).run();
}

// --- Targets ---

export function getTargetsWithProgress(): TargetWithProgress[] {
  const rows = db
    .select({
      id:           targets.id,
      period:       targets.period,
      count:        targets.count,
      categoryId:   targets.categoryId,
      categoryName: categories.name,
    })
    .from(targets)
    .leftJoin(categories, eq(targets.categoryId, categories.id))
    .all();

  return rows.map((row) => {
    const range = row.period === 'weekly' ? getCurrentWeekRange() : getCurrentMonthRange();

    const whereClause =
      row.categoryId !== null
        ? and(
            between(applications.dateApplied, range.start, range.end),
            eq(applications.categoryId, row.categoryId)
          )
        : between(applications.dateApplied, range.start, range.end);

    const result = db
      .select({ actual: count() })
      .from(applications)
      .where(whereClause)
      .get();

    const actual = result?.actual ?? 0;
    return {
      id:           row.id,
      period:       row.period as 'weekly' | 'monthly',
      count:        row.count,
      categoryId:   row.categoryId ?? null,
      categoryName: row.categoryName ?? null,
      actual,
      remaining: Math.max(0, row.count - actual),
      exceeded:  actual > row.count,
    };
  });
}

export function createTarget(data: Omit<NewTarget, 'id'>): { success: boolean; error?: string } {
  try {
    db.insert(targets).values(data).run();
    return { success: true };
  } catch (e: any) {
    if (e?.message?.includes('UNIQUE constraint failed')) {
      const periodLabel = data.period === 'weekly' ? 'Weekly' : 'Monthly';
      const scope = data.categoryId == null ? 'All Categories' : 'this category';
      return { success: false, error: `A ${periodLabel} target for ${scope} already exists.` };
    }
    throw e;
  }
}

export function updateTarget(id: number, data: Partial<Omit<NewTarget, 'id'>>) {
  return db.update(targets).set(data).where(eq(targets.id, id)).run();
}

export function deleteTarget(id: number) {
  return db.delete(targets).where(eq(targets.id, id)).run();
}

// --- Streaks ---

export type StreakData = {
  dailyStreak:      number;
  weeklyStreak:     number;
  hasWeeklyTargets: boolean;
};

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function weekBounds(weeksAgo: number): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff - weeksAgo * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: dateStr(mon), end: dateStr(sun) };
}

export function getStreakData(): StreakData {
  const appRows = db
    .select({ dateApplied: applications.dateApplied, categoryId: applications.categoryId })
    .from(applications)
    .all();

  const weeklyTargetRows = db
    .select()
    .from(targets)
    .where(eq(targets.period, 'weekly'))
    .all();

  // ── Daily streak ───────────────────────────────────────────────────────────
  // Consecutive days (going backwards) with at least one application.
  // Today is allowed to be empty — streak is not broken until yesterday is also empty.
  const dateSet = new Set(appRows.map(a => a.dateApplied));
  const today = new Date();
  const startOffset = dateSet.has(dateStr(today)) ? 0 : 1;

  let dailyStreak = 0;
  for (let i = startOffset; i < 366; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (dateSet.has(dateStr(d))) dailyStreak++;
    else break;
  }

  // ── Weekly streak ──────────────────────────────────────────────────────────
  // Consecutive weeks (going backwards) where every weekly target was met.
  // Current week counts if already met; if not, we fall back to last week so
  // an in-progress week doesn't reset the streak.
  function weekMet(weeksAgo: number): boolean {
    const { start, end } = weekBounds(weeksAgo);
    const weekApps = appRows.filter(a => a.dateApplied >= start && a.dateApplied <= end);
    return weeklyTargetRows.every(t => {
      const n = t.categoryId == null
        ? weekApps.length
        : weekApps.filter(a => a.categoryId === t.categoryId).length;
      return n >= t.count;
    });
  }

  let weeklyStreak = 0;
  if (weeklyTargetRows.length > 0) {
    const start = weekMet(0) ? 0 : 1;
    for (let i = start; i < 53; i++) {
      if (weekMet(i)) weeklyStreak++;
      else break;
    }
  }

  return { dailyStreak, weeklyStreak, hasWeeklyTargets: weeklyTargetRows.length > 0 };
}

// --- Insights ---

export type InsightsData = {
  total: number;
  thisWeek: number;
  thisMonth: number;
  byStatus: { status: string; count: number }[];
  byCategory: { name: string; color: string; count: number }[];
  dailyLast7: { label: string; count: number }[];
  weeklyLast4: { label: string; count: number }[];
  monthlyLast6: { label: string; count: number }[];
};

export function getInsightsData(): InsightsData {
  const allApps = db
    .select({
      dateApplied: applications.dateApplied,
      status:      applications.status,
      categoryId:  applications.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(applications)
    .leftJoin(categories, eq(applications.categoryId, categories.id))
    .all();

  const { start: wStart, end: wEnd } = getCurrentWeekRange();
  const { start: mStart, end: mEnd } = getCurrentMonthRange();

  const total     = allApps.length;
  const thisWeek  = allApps.filter(a => a.dateApplied >= wStart && a.dateApplied <= wEnd).length;
  const thisMonth = allApps.filter(a => a.dateApplied >= mStart && a.dateApplied <= mEnd).length;

  // By status
  const statusMap: Record<string, number> = {};
  for (const app of allApps) {
    statusMap[app.status] = (statusMap[app.status] ?? 0) + 1;
  }
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // By category
  const catMap: Record<string, { name: string; color: string; count: number }> = {};
  for (const app of allApps) {
    const key = String(app.categoryId);
    if (!catMap[key]) {
      catMap[key] = { name: app.categoryName ?? 'Unknown', color: app.categoryColor ?? '#999', count: 0 };
    }
    catMap[key].count++;
  }
  const byCategory = Object.values(catMap).sort((a, b) => b.count - a.count);

  // Daily — last 7 days
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const dailyLast7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return {
      label: DAY_LABELS[d.getDay()],
      count: allApps.filter(a => a.dateApplied === dateStr).length,
    };
  });

  // Weekly — last 4 weeks (current + 3 prior)
  const weeklyLast4 = Array.from({ length: 4 }, (_, i) => {
    const offset = 3 - i; // 3, 2, 1, 0
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(now.getDate() + diff - offset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const s = weekStart.toISOString().split('T')[0];
    const e = weekEnd.toISOString().split('T')[0];
    return {
      label: offset === 0 ? 'This wk' : `${offset}w ago`,
      count: allApps.filter(a => a.dateApplied >= s && a.dateApplied <= e).length,
    };
  });

  // Monthly — last 6 months
  const monthlyLast6 = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const last = new Date(y, d.getMonth() + 1, 0).getDate();
    const s = `${y}-${m}-01`;
    const e = `${y}-${m}-${String(last).padStart(2, '0')}`;
    return {
      label: d.toLocaleString('default', { month: 'short' }),
      count: allApps.filter(a => a.dateApplied >= s && a.dateApplied <= e).length,
    };
  });

  return { total, thisWeek, thisMonth, byStatus, byCategory, dailyLast7, weeklyLast4, monthlyLast6 };
}
