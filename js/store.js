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
