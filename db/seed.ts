import { db } from './index';
import { categories, applications, targets } from './schema';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/**
 * Inserts sample data only if the categories table is empty.
 * Safe to call on every app launch — will no-op after first run.
 */
export function seedIfEmpty() {
  const existing = db.select().from(categories).all();
  if (existing.length > 0) return;

  // ── Categories ────────────────────────────────────────────────────────────
  db.insert(categories).values([
    { name: 'Graduate',   color: '#16a34a' },
    { name: 'Full-time',  color: '#2563eb' },
    { name: 'Internship', color: '#7c3aed' },
    { name: 'Contract',   color: '#d97706' },
  ]).run();

  const cats = db.select().from(categories).all();
  const id = (name: string) => cats.find((c) => c.name === name)!.id;

  const graduate   = id('Graduate');
  const fulltime   = id('Full-time');
  const internship = id('Internship');
  const contract   = id('Contract');

  // ── Applications ──────────────────────────────────────────────────────────
  // Spread across ~4 months so daily / weekly / monthly charts all have data.
  db.insert(applications).values([
    // This week
    { company: 'Google',      role: 'Software Engineer Intern',  status: 'Applied',   dateApplied: daysAgo(0),  categoryId: internship, notes: 'Applied via referral from a friend.' },
    { company: 'Meta',        role: 'Data Analyst (Graduate)',   status: 'Applied',   dateApplied: daysAgo(0),  categoryId: graduate,   notes: null },
    { company: 'Apple',       role: 'iOS Engineer',              status: 'Applied',   dateApplied: daysAgo(1),  categoryId: fulltime,   notes: null },
    { company: 'Microsoft',   role: 'Graduate SWE',              status: 'Interview', dateApplied: daysAgo(2),  categoryId: graduate,   notes: 'Phone screen scheduled.' },
    { company: 'Stripe',      role: 'Frontend Developer',        status: 'Applied',   dateApplied: daysAgo(3),  categoryId: contract,   notes: null },

    // Last week
    { company: 'Amazon',      role: 'SDE I',                     status: 'Interview', dateApplied: daysAgo(8),  categoryId: fulltime,   notes: 'Completed online assessment.' },
    { company: 'Shopify',     role: 'Backend Developer',         status: 'Offer',     dateApplied: daysAgo(9),  categoryId: fulltime,   notes: 'Offer received — reviewing package.' },
    { company: 'Airbnb',      role: 'React Native Developer',    status: 'Rejected',  dateApplied: daysAgo(11), categoryId: contract,   notes: null },

    // 2–3 weeks ago
    { company: 'Netflix',     role: 'Mobile Engineer',           status: 'Interview', dateApplied: daysAgo(14), categoryId: fulltime,   notes: null },
    { company: 'Uber',        role: 'Android Developer',         status: 'Offer',     dateApplied: daysAgo(15), categoryId: fulltime,   notes: 'Offer — higher than expected.' },
    { company: 'Lyft',        role: 'Software Intern',           status: 'Applied',   dateApplied: daysAgo(16), categoryId: internship, notes: null },
    { company: 'Twitter',     role: 'Graduate Developer',        status: 'Rejected',  dateApplied: daysAgo(18), categoryId: graduate,   notes: 'Rejected after final round.' },

    // 3–4 weeks ago
    { company: 'LinkedIn',    role: 'Data Science Graduate',     status: 'Interview', dateApplied: daysAgo(21), categoryId: graduate,   notes: null },
    { company: 'Salesforce',  role: 'SWE I',                     status: 'Applied',   dateApplied: daysAgo(23), categoryId: fulltime,   notes: null },
    { company: 'Dropbox',     role: 'Mobile Developer',          status: 'Offer',     dateApplied: daysAgo(25), categoryId: fulltime,   notes: 'Verbal offer, awaiting written.' },

    // ~5–6 weeks ago (previous month)
    { company: 'Figma',       role: 'SWE Intern',                status: 'Applied',   dateApplied: daysAgo(33), categoryId: internship, notes: null },
    { company: 'Canva',       role: 'Frontend Developer',        status: 'Rejected',  dateApplied: daysAgo(37), categoryId: contract,   notes: 'Rejected at CV screening stage.' },
    { company: 'HubSpot',     role: 'Graduate Engineer',         status: 'Applied',   dateApplied: daysAgo(40), categoryId: graduate,   notes: null },

    // ~2 months ago
    { company: 'Atlassian',   role: 'Software Engineer',         status: 'Interview', dateApplied: daysAgo(50), categoryId: fulltime,   notes: null },
    { company: 'Notion',      role: 'SWE Intern',                status: 'Offer',     dateApplied: daysAgo(55), categoryId: internship, notes: 'Declined in favour of later offer.' },
    { company: 'Slack',       role: 'Graduate SWE',              status: 'Applied',   dateApplied: daysAgo(60), categoryId: graduate,   notes: null },

    // ~3 months ago
    { company: 'Zoom',        role: 'Data Engineer',             status: 'Rejected',  dateApplied: daysAgo(75), categoryId: contract,   notes: null },
    { company: 'Twilio',      role: 'SWE I',                     status: 'Applied',   dateApplied: daysAgo(85), categoryId: fulltime,   notes: null },

    // ~4 months ago
    { company: 'GitHub',      role: 'Software Intern',           status: 'Interview', dateApplied: daysAgo(100), categoryId: internship, notes: 'Second-round interview completed.' },
    { company: 'Docker',      role: 'Backend Developer',         status: 'Applied',   dateApplied: daysAgo(115), categoryId: contract,   notes: null },
  ]).run();

  // ── Targets ───────────────────────────────────────────────────────────────
  db.insert(targets).values([
    { period: 'weekly',  count: 5,  categoryId: null },        // global weekly target
    { period: 'monthly', count: 15, categoryId: null },        // global monthly target
    { period: 'monthly', count: 8,  categoryId: graduate },   // graduate-specific monthly target
  ]).run();
}
