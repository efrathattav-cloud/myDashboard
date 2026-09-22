// The single place that holds the app's leads.
//
// Screens never build or import the demo data themselves – they ask the store.
// That way, when LocalStorage is added later, only this file changes.

import { createDemoLeads } from './demo-data.js';

/** @type {import('./model.js').Lead[] | null} */
let leads = null;

/**
 * All leads currently in the app.
 * The demo data is created on first use and kept from then on.
 *
 * @returns {import('./model.js').Lead[]}
 */
export function getLeads() {
  if (leads === null) leads = createDemoLeads();
  return leads;
}

/**
 * One lead by id, or undefined when there is no such lead.
 *
 * @param {string} id
 * @returns {import('./model.js').Lead | undefined}
 */
export function getLead(id) {
  return getLeads().find((lead) => lead.id === id);
}

/** Throws away every change and brings the demo data back to its starting state. */
export function resetDemoData() {
  leads = createDemoLeads();
}

/**
 * A new unique id.
 * Combines the current time with a few random characters, which is plenty for
 * a single-user demo and needs no server.
 *
 * @param {string} [prefix]
 * @returns {string}
 */
export function createId(prefix = 'lead') {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${time}-${random}`;
}

/**
 * Adds a new lead, or replaces an existing one with the same id.
 *
 * @param {import('./model.js').Lead} lead
 * @returns {import('./model.js').Lead} The saved lead.
 */
export function saveLead(lead) {
  const all = getLeads();
  const index = all.findIndex((existing) => existing.id === lead.id);
  if (index === -1) all.push(lead);
  else all[index] = lead;
  return lead;
}

/**
 * Removes a lead.
 *
 * @param {string} id
 * @returns {boolean} false when there was no such lead.
 */
export function deleteLead(id) {
  const all = getLeads();
  const index = all.findIndex((lead) => lead.id === id);
  if (index === -1) return false;
  all.splice(index, 1);
  return true;
}
