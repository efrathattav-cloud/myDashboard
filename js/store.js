// The single place that holds the app's leads.
//
// Screens never build or import the demo data themselves – they ask the store.
// Because of that, adding storage changed only this file: not one screen knows
// where the leads come from.
//
// Changes are kept in the browser's own storage, so a refresh does not throw
// away the morning's work (SPEC section 16). There is still no server and no
// database: everything lives on this one device, in this one browser.
//
// Storage can fail for reasons that are nobody's fault – a private window,
// blocked site data, a full quota. None of those should stop the app working,
// so every read and write is wrapped. A failure just means this session is not
// saved, and the interface says so rather than letting the user find out by
// losing something.

import { createDemoLeads } from './demo-data.js';

/**
 * The name the data is filed under. The "v1" is deliberate: if the shape of a
 * lead ever changes, saving under "v2" leaves the old data alone instead of
 * feeding new code something it cannot read.
 */
const STORAGE_KEY = 'leadflow.leads.v1';

/** @type {import('./model.js').Lead[] | null} */
let leads = null;

/** Becomes false once a read or write has failed, so the app stops trying. */
let storageWorks = true;

/**
 * Is this actually a list of leads?
 *
 * Storage is plain text that anything could have written, including an older
 * version of this app. Rather than trusting it, the minimum is checked and
 * anything else is thrown away in favour of the demo data.
 *
 * @param {unknown} value
 */
function looksLikeLeads(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (lead) =>
        lead &&
        typeof lead === 'object' &&
        typeof lead.id === 'string' &&
        typeof lead.name === 'string' &&
        Array.isArray(lead.interactions)
    )
  );
}

/**
 * Reads the saved leads.
 *
 * Two different failures are deliberately kept apart:
 *   - storage itself is unavailable (a private window, blocked site data).
 *     Nothing can be saved this session, so say so.
 *   - storage works but what is in it is unreadable (damaged text, or a shape
 *     an older version wrote). Storage is fine; the content is simply replaced
 *     with fresh demo data on the next write.
 *
 * Treating the second as the first would tell the user their browser is
 * blocking saves when it is not.
 *
 * @returns {import('./model.js').Lead[] | null} null when there is nothing usable.
 */
function readFromStorage() {
  let raw;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    storageWorks = false;
    return null;
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return looksLikeLeads(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Writes the current leads out. Does nothing when storage is unavailable. */
function persist() {
  if (!storageWorks || leads === null) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch {
    storageWorks = false;
  }
}

/**
 * All leads currently in the app: whatever was saved before, or a fresh set of
 * demo leads on the very first visit.
 *
 * @returns {import('./model.js').Lead[]}
 */
export function getLeads() {
  if (leads === null) {
    leads = readFromStorage() ?? createDemoLeads();
    persist();
  }
  return leads;
}

/** Whether changes are being saved. */
export function isPersistent() {
  return storageWorks;
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
  persist();
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
  persist();
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
  persist();
  return true;
}

/**
 * Records a conversation with a lead, and updates what comes next.
 *
 * Two things happen automatically, because forgetting either of them would
 * leave the lead in the wrong list:
 *   - "last conversation" becomes the most recent interaction date, so the
 *     lead stops counting as one with no answer.
 *   - the next action is replaced by whatever was chosen, which also means
 *     that choosing nothing marks the old action as done.
 *
 * @param {string} leadId
 * @param {object} entry
 * @param {import('./model.js').Interaction} entry.interaction
 * @param {string} [entry.nextAction]
 * @param {string} [entry.customNextAction]
 * @param {string} [entry.nextActionDate]
 * @returns {import('./model.js').Lead | null} null when there is no such lead.
 */
export function addInteraction(leadId, { interaction, nextAction, customNextAction, nextActionDate }) {
  const lead = getLead(leadId);
  if (!lead) return null;

  lead.interactions.push(interaction);
  lead.lastInteractionAt = lead.interactions
    .map((item) => item.date)
    .sort()
    .at(-1);

  if (nextAction) {
    lead.nextAction = nextAction;
    lead.nextActionDate = nextActionDate;
    if (nextAction === 'other' && customNextAction) lead.customNextAction = customNextAction;
    else delete lead.customNextAction;
  } else {
    delete lead.nextAction;
    delete lead.nextActionDate;
    delete lead.customNextAction;
  }

  persist();
  return lead;
}

/**
 * Changes only the status of a lead.
 * Won and lost are deliberately not allowed here: they need a sale or a
 * reason, which only the full form collects.
 *
 * @param {string} leadId
 * @param {string} status
 * @returns {boolean} false when the lead or the status is not acceptable.
 */
export function changeStatus(leadId, status) {
  const lead = getLead(leadId);
  if (!lead || status === 'won' || status === 'lost') return false;
  lead.status = status;
  persist();
  return true;
}
