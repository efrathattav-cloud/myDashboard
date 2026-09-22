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
