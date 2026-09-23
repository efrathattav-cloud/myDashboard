// The business rules of LeadFlow.
//
// Every screen asks the same questions: is this lead overdue? has she been
// forgotten? how much did we make this month? The answers live here, once, so
// the Dashboard, the Leads list and the Tasks screen can never disagree.
//
// The rules themselves come from SPEC.en.md section 20.
//
// Each function takes `now` as an argument instead of reading the clock
// itself. That keeps them predictable and easy to check.

import { daysBetween, monthOf, today } from './dates.js';
import { ACTIVE_STATUSES } from './model.js';

/** A lead with no contact for longer than this is considered forgotten. */
export const STALE_AFTER_DAYS = 5;

// ---------- One lead ----------

/**
 * Is this lead still in play? Won and lost leads are finished, so no
 * follow-up rule applies to them.
 *
 * @param {import('./model.js').Lead} lead
 */
export function isActive(lead) {
  return ACTIVE_STATUSES.includes(lead.status);
}

/**
 * Is something still waiting to be done with this lead?
 * Marking an action as done removes it, so an action that is still stored is
 * an action that is still pending.
 *
 * @param {import('./model.js').Lead} lead
 */
export function hasPendingAction(lead) {
  return Boolean(lead.nextAction && lead.nextActionDate);
}

/**
 * The action's date has passed and it still has not been done.
 *
 * @param {import('./model.js').Lead} lead
 * @param {string} [now] ISO date treated as today.
 */
export function isOverdue(lead, now = today()) {
  return isActive(lead) && hasPendingAction(lead) && lead.nextActionDate < now;
}

/**
 * The action is due today.
 *
 * @param {import('./model.js').Lead} lead
 * @param {string} [now]
 */
export function isDueToday(lead, now = today()) {
  return isActive(lead) && hasPendingAction(lead) && lead.nextActionDate === now;
}

/**
 * The action is due some time after today.
 *
 * @param {import('./model.js').Lead} lead
 * @param {string} [now]
 */
export function isUpcoming(lead, now = today()) {
  return isActive(lead) && hasPendingAction(lead) && lead.nextActionDate > now;
}

/**
 * How many days since the last conversation. `null` when there never was one.
 *
 * @param {import('./model.js').Lead} lead
 * @param {string} [now]
 * @returns {number | null}
 */
export function daysSinceLastInteraction(lead, now = today()) {
  if (!lead.lastInteractionAt) return null;
  return daysBetween(lead.lastInteractionAt, now);
}

/**
 * No contact for more than STALE_AFTER_DAYS while the lead is still active.
 *
 * @param {import('./model.js').Lead} lead
 * @param {string} [now]
 */
export function isStale(lead, now = today()) {
  if (!isActive(lead)) return false;
  const days = daysSinceLastInteraction(lead, now);
  return days !== null && days > STALE_AFTER_DAYS;
}

/**
 * Should this lead stand out in a list? True when she is overdue, due today,
 * or has been forgotten.
 *
 * @param {import('./model.js').Lead} lead
 * @param {string} [now]
 */
export function needsAttention(lead, now = today()) {
  return isOverdue(lead, now) || isDueToday(lead, now) || isStale(lead, now);
}

// ---------- Many leads ----------

/**
 * Leads created inside a given month.
 *
 * @param {import('./model.js').Lead[]} leads
 * @param {string} month 'YYYY-MM'.
 */
export function createdInMonth(leads, month) {
  return leads.filter((lead) => monthOf(lead.createdAt) === month);
}

/**
 * Leads marked as hot, whatever their status.
 *
 * @param {import('./model.js').Lead[]} leads
 */
export function hotLeads(leads) {
  return leads.filter((lead) => lead.temperature === 'hot');
}

/**
 * Leads that became paying clients.
 *
 * @param {import('./model.js').Lead[]} leads
 */
export function wonLeads(leads) {
  return leads.filter((lead) => lead.status === 'won' && lead.sale);
}

/**
 * Revenue from deals closed inside a given month.
 * Uses the price actually agreed on, not the price originally offered.
 *
 * @param {import('./model.js').Lead[]} leads
 * @param {string} month 'YYYY-MM'.
 * @returns {number}
 */
export function revenueInMonth(leads, month) {
  return wonLeads(leads)
    .filter((lead) => monthOf(lead.sale.closedAt) === month)
    .reduce((total, lead) => total + lead.sale.agreedPrice, 0);
}

/**
 * Share of leads that became clients, as a percentage.
 *
 * @param {import('./model.js').Lead[]} leads
 * @returns {number} 0 when there are no leads, so the UI never shows NaN.
 */
export function conversionRate(leads) {
  if (leads.length === 0) return 0;
  return Math.round((wonLeads(leads).length / leads.length) * 100);
}

/**
 * The leads that came in most recently, newest first.
 *
 * @param {import('./model.js').Lead[]} leads
 * @param {number} [limit]
 */
export function recentLeads(leads, limit = 5) {
  return [...leads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/**
 * Counts of everything the "needs attention" section reports on.
 *
 * @param {import('./model.js').Lead[]} leads
 * @param {string} [now]
 */
export function attentionSummary(leads, now = today()) {
  return {
    overdue: leads.filter((lead) => isOverdue(lead, now)).length,
    dueToday: leads.filter((lead) => isDueToday(lead, now)).length,
    stale: leads.filter((lead) => isStale(lead, now)).length,
  };
}

// ---------- Search and filters (SPEC sections 7.1 and 7.2) ----------

/**
 * Does the lead match one of the follow-up situations?
 *
 * @param {import('./model.js').Lead} lead
 * @param {keyof import('./model.js').FOLLOW_UP_FILTERS} situation
 * @param {string} now
 */
function matchesFollowUp(lead, situation, now) {
  switch (situation) {
    case 'today':
      return isDueToday(lead, now);
    case 'overdue':
      return isOverdue(lead, now);
    case 'none':
      return isActive(lead) && !hasPendingAction(lead);
    case 'stale':
      return isStale(lead, now);
    default:
      return true; // an unknown value filters nothing out
  }
}

/**
 * Does the lead match the free-text search?
 * Searches name, phone and notes (SPEC section 7.1).
 *
 * Phone numbers are compared digit by digit, so searching "0524" finds
 * "052-4471903" even though the stored number contains a dash.
 *
 * @param {import('./model.js').Lead} lead
 * @param {string} text Already trimmed and lower-cased.
 */
function matchesQuery(lead, text) {
  const digits = text.replace(/\D/g, '');
  if (digits && lead.phone.replace(/\D/g, '').includes(digits)) return true;
  return (
    lead.name.toLowerCase().includes(text) ||
    (lead.notes ?? '').toLowerCase().includes(text)
  );
}

/**
 * @typedef {Object} LeadFilters
 * @property {string} [query]       Free text for name, phone and notes.
 * @property {string} [source]
 * @property {string} [status]
 * @property {string} [temperature]
 * @property {string} [product]
 * @property {string} [followUp]    One of FOLLOW_UP_FILTERS.
 */

/**
 * The leads matching every filter that was set.
 * An empty or missing filter is ignored, so filters combine with "and".
 *
 * @param {import('./model.js').Lead[]} leads
 * @param {LeadFilters} filters
 * @param {string} [now]
 * @returns {import('./model.js').Lead[]}
 */
export function filterLeads(leads, filters, now = today()) {
  const text = (filters.query ?? '').trim().toLowerCase();

  return leads.filter((lead) => {
    if (filters.source && lead.source !== filters.source) return false;
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.temperature && lead.temperature !== filters.temperature) return false;
    if (filters.product && !lead.products.includes(filters.product)) return false;
    if (filters.followUp && !matchesFollowUp(lead, filters.followUp, now)) return false;
    if (text && !matchesQuery(lead, text)) return false;
    return true;
  });
}

/**
 * How many filters are actually narrowing the list.
 * Used to tell the user that a filter is on even when the panel is closed.
 *
 * @param {LeadFilters} filters
 * @returns {number}
 */
export function countActiveFilters(filters) {
  return ['source', 'status', 'temperature', 'product', 'followUp'].filter(
    (name) => filters[name]
  ).length;
}

/**
 * Leads sorted for the list: the ones needing attention first, then the most
 * recently created. Within the attention group, the most overdue comes first.
 *
 * @param {import('./model.js').Lead[]} leads
 * @param {string} [now]
 */
export function sortLeadsForList(leads, now = today()) {
  return [...leads].sort((a, b) => {
    const attentionA = needsAttention(a, now) ? 0 : 1;
    const attentionB = needsAttention(b, now) ? 0 : 1;
    if (attentionA !== attentionB) return attentionA - attentionB;

    // Both need attention: the older the pending date, the higher it goes.
    if (attentionA === 0 && a.nextActionDate && b.nextActionDate) {
      return a.nextActionDate.localeCompare(b.nextActionDate);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/**
 * The pending actions, split into the three groups the Tasks screen shows
 * (SPEC section 12). Each group is sorted by date, oldest first.
 *
 * Only leads still in play appear: a won or lost lead has nothing pending,
 * which is the same rule the rest of this file uses.
 *
 * @param {import('./model.js').Lead[]} leads
 * @param {string} [now]
 * @returns {{overdue: import('./model.js').Lead[], today: import('./model.js').Lead[], upcoming: import('./model.js').Lead[]}}
 */
export function tasksByUrgency(leads, now = today()) {
  const pending = leads.filter((lead) => isActive(lead) && hasPendingAction(lead));
  const byDate = (a, b) => a.nextActionDate.localeCompare(b.nextActionDate);

  return {
    overdue: pending.filter((lead) => lead.nextActionDate < now).sort(byDate),
    today: pending.filter((lead) => lead.nextActionDate === now).sort(byDate),
    upcoming: pending.filter((lead) => lead.nextActionDate > now).sort(byDate),
  };
}

/**
 * The leads that most need getting back to, most pressing first.
 *
 * Order: the longest overdue, then what is due today. Leads with nothing
 * pending are left out entirely – they may be stale, but there is no action
 * waiting, so there is nothing to tick off.
 *
 * @param {import('./model.js').Lead[]} leads
 * @param {number} [limit]
 * @param {string} [now]
 * @returns {import('./model.js').Lead[]}
 */
export function mostUrgent(leads, limit = 3, now = today()) {
  const { overdue, today: dueToday } = tasksByUrgency(leads, now);
  return [...overdue, ...dueToday].slice(0, limit);
}

/**
 * How many leads are still in play, and how many are finished.
 * Used to say what the headline count is actually made of.
 *
 * @param {import('./model.js').Lead[]} leads
 */
export function activeBreakdown(leads) {
  const active = leads.filter(isActive).length;
  return { active, closed: leads.length - active };
}

/**
 * Clients won inside a given month.
 *
 * @param {import('./model.js').Lead[]} leads
 * @param {string} month 'YYYY-MM'.
 */
export function clientsWonInMonth(leads, month) {
  return wonLeads(leads).filter((lead) => monthOf(lead.sale.closedAt) === month);
}

/**
 * Which sources actually produced paying clients, best first.
 * Sources that brought nobody are left out: the point of this list is where
 * the clients come from, not where they do not.
 *
 * @param {import('./model.js').Lead[]} leads
 * @returns {Array<{source: string, clients: number, leads: number, rate: number}>}
 */
export function sourcesByClients(leads) {
  const bySource = new Map();

  for (const lead of leads) {
    const entry = bySource.get(lead.source) ?? { source: lead.source, clients: 0, leads: 0 };
    entry.leads += 1;
    if (lead.status === 'won') entry.clients += 1;
    bySource.set(lead.source, entry);
  }

  return [...bySource.values()]
    .filter((entry) => entry.clients > 0)
    .map((entry) => ({ ...entry, rate: Math.round((entry.clients / entry.leads) * 100) }))
    .sort((a, b) => b.clients - a.clients || b.rate - a.rate);
}
