// Talking to an Airtable base.
//
// The app can keep its leads in Airtable instead of only in this browser.
// Nothing about the screens changes: the leads are fetched once when the app
// starts and held in the store exactly as before, and every change is written
// back in the background.
//
// ## About the key
//
// Airtable needs a personal access token. This site is static and public, so a
// token written into the code would be readable by anyone who opens the page
// or the repository – and with it they could read, change or delete the whole
// base. There are bots that scan public repositories for exactly that.
//
// So the token is never in the code and never in the repository. It is typed
// into the app by the person using it and kept in their own browser, the same
// way the leads are. Someone else opening the site sees an app asking for
// their own token, not this one's data.

import { keyOf } from './model.js';
import {
  LOST_REASONS,
  NEXT_ACTIONS,
  PAYMENT_METHODS,
  PRODUCTS,
  SOURCES,
  STATUSES,
  TEMPERATURES,
  labelOf,
} from './model.js';

const API = 'https://api.airtable.com/v0';

/**
 * The Hebrew column names in Airtable, by what they hold.
 * Names rather than field ids, so the mapping reads like the table looks and
 * survives the table being recreated.
 */
export const COLUMNS = {
  name: 'שם',
  phone: 'טלפון',
  source: 'מקור',
  customSource: 'פירוט המקור',
  products: 'מתעניינת ב',
  interestReason: 'סיבת הפנייה',
  createdAt: 'תאריך פנייה ראשונה',
  lastInteractionAt: 'תאריך שיחה אחרונה',
  status: 'סטטוס',
  temperature: 'רמת חום',
  offeredPrice: 'מחיר שהוצע',
  discountOffered: 'הוצעה הנחה',
  discountAmount: 'סכום ההנחה',
  finalOfferedPrice: 'מחיר אחרי הנחה',
  nextAction: 'הפעולה הבאה',
  customNextAction: 'פירוט הפעולה',
  nextActionDate: 'תאריך הפעולה הבאה',
  notes: 'הערות',
  saleProduct: 'מה רכשה',
  agreedPrice: 'מחיר שסוכם',
  closedAt: 'תאריך סגירה',
  paid: 'שולם',
  paymentMethod: 'אמצעי תשלום',
  installments: 'מספר תשלומים',
  saleNotes: 'הערות על העסקה',
  lostReason: 'סיבת אי־סגירה',
  customLostReason: 'פירוט סיבת אי־סגירה',
  interactionCount: 'מספר אינטראקציות',
  id: 'מזהה',
};

/** Leaves out anything empty, so a cleared field is cleared in Airtable too. */
function withoutEmpty(fields) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
  );
}

/**
 * A lead, as Airtable columns.
 *
 * Select columns hold the Hebrew words, not the stored keys, because those are
 * the words the table shows and the person there reads.
 *
 * @param {import('./model.js').Lead} lead
 * @returns {Record<string, unknown>}
 */
export function toAirtableFields(lead) {
  const C = COLUMNS;
  const sale = lead.sale;

  return withoutEmpty({
    [C.name]: lead.name,
    [C.phone]: lead.phone,
    [C.source]: labelOf(SOURCES, lead.source),
    [C.customSource]: lead.source === 'other' ? lead.customSource : '',
    [C.products]: lead.products.map((product) => labelOf(PRODUCTS, product)),
    [C.interestReason]: lead.interestReason,
    [C.createdAt]: lead.createdAt,
    [C.lastInteractionAt]: lead.lastInteractionAt,
    [C.status]: labelOf(STATUSES, lead.status),
    [C.temperature]: labelOf(TEMPERATURES, lead.temperature),
    [C.offeredPrice]: lead.offeredPrice,
    // A checkbox is written even when false, so unticking it actually unticks.
    [C.discountOffered]: lead.discountOffered || undefined,
    [C.discountAmount]: lead.discountAmount,
    [C.finalOfferedPrice]: lead.finalOfferedPrice,
    [C.nextAction]: labelOf(NEXT_ACTIONS, lead.nextAction),
    [C.customNextAction]: lead.nextAction === 'other' ? lead.customNextAction : '',
    [C.nextActionDate]: lead.nextActionDate,
    [C.notes]: lead.notes,
    [C.saleProduct]: sale ? labelOf(PRODUCTS, sale.product) : '',
    [C.agreedPrice]: sale?.agreedPrice,
    [C.closedAt]: sale?.closedAt,
    [C.paid]: sale?.paid || undefined,
    [C.paymentMethod]: sale ? labelOf(PAYMENT_METHODS, sale.paymentMethod) : '',
    [C.installments]: sale?.installments,
    [C.saleNotes]: sale?.notes,
    [C.lostReason]: labelOf(LOST_REASONS, lead.lostReason),
    [C.customLostReason]: lead.lostReason === 'other' ? lead.customLostReason : '',
    [C.interactionCount]: lead.interactions.length,
    [C.id]: lead.id,
  });
}

/**
 * An Airtable record, as a lead.
 *
 * A row can be edited by hand in Airtable, so nothing here is assumed: an
 * unrecognised word falls back rather than throwing, and a row with no name
 * or no id is reported so the caller can skip it.
 *
 * Interactions are not stored in this table – a row cannot hold many
 * conversations – so a lead loaded from Airtable starts with none.
 *
 * @param {{id: string, fields: Record<string, unknown>}} record
 * @returns {{lead: import('./model.js').Lead} | {error: string}}
 */
export function fromAirtableRecord(record) {
  const C = COLUMNS;
  const f = record.fields ?? {};
  const text = (column) => {
    const value = f[column];
    return typeof value === 'string' ? value.trim() : '';
  };
  const number = (column) => (typeof f[column] === 'number' ? f[column] : undefined);

  const name = text(C.name);
  if (!name) return { error: `שורה ללא שם (${record.id})` };

  const status = keyOf(STATUSES, text(C.status)) ?? 'new';
  const source = keyOf(SOURCES, text(C.source)) ?? 'other';
  const nextAction = keyOf(NEXT_ACTIONS, text(C.nextAction));
  const lostReason = keyOf(LOST_REASONS, text(C.lostReason));

  /** @type {import('./model.js').Lead} */
  const lead = {
    // A row added by hand in Airtable has no id of ours, so one is borrowed
    // from Airtable's own record id. It is stable and unique either way.
    id: text(C.id) || record.id,
    airtableId: record.id,
    name,
    phone: text(C.phone),
    source,
    products: (Array.isArray(f[C.products]) ? f[C.products] : [])
      .map((label) => keyOf(PRODUCTS, label))
      .filter(Boolean),
    createdAt: text(C.createdAt),
    status,
    temperature: keyOf(TEMPERATURES, text(C.temperature)) ?? 'medium',
    discountOffered: f[C.discountOffered] === true,
    interactions: [],
  };

  const set = (key, value) => {
    if (value !== undefined && value !== '' && value !== null) lead[key] = value;
  };

  if (source === 'other') set('customSource', text(C.customSource));
  set('interestReason', text(C.interestReason));
  set('lastInteractionAt', text(C.lastInteractionAt));
  set('offeredPrice', number(C.offeredPrice));
  if (lead.discountOffered) {
    set('discountAmount', number(C.discountAmount));
    set('finalOfferedPrice', number(C.finalOfferedPrice));
  }
  set('notes', text(C.notes));

  // A finished lead has nothing pending – the rule the whole app relies on.
  if (status !== 'won' && status !== 'lost' && nextAction) {
    lead.nextAction = nextAction;
    set('nextActionDate', text(C.nextActionDate));
    if (nextAction === 'other') set('customNextAction', text(C.customNextAction));
  }

  if (status === 'won') {
    const product = keyOf(PRODUCTS, text(C.saleProduct));
    const agreedPrice = number(C.agreedPrice);
    const closedAt = text(C.closedAt);
    // Without these three there is no sale, and revenue would be wrong.
    if (product && agreedPrice > 0 && closedAt) {
      lead.sale = { product, agreedPrice, closedAt, paid: f[C.paid] === true };
      const paymentMethod = keyOf(PAYMENT_METHODS, text(C.paymentMethod));
      if (paymentMethod) lead.sale.paymentMethod = paymentMethod;
      const installments = number(C.installments);
      if (installments) lead.sale.installments = installments;
      const saleNotes = text(C.saleNotes);
      if (saleNotes) lead.sale.notes = saleNotes;
      if (!lead.products.includes(product)) lead.products.push(product);
    }
  }

  if (status === 'lost' && lostReason) {
    lead.lostReason = lostReason;
    if (lostReason === 'other') set('customLostReason', text(C.customLostReason));
  }

  return { lead };
}

/**
 * One request to Airtable.
 *
 * @param {import('./settings.js').Connection} connection
 * @param {string} path Appended after the base id.
 * @param {RequestInit} [options]
 */
async function request(connection, path, options = {}) {
  const url = `${API}/${encodeURIComponent(connection.baseId)}/${encodeURIComponent(connection.tableName)}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${connection.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Airtable explains itself in the body; the status alone is not enough to
    // tell a wrong token from a wrong table name.
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error?.message ?? body?.error?.type ?? '';
    } catch {
      // Keep the status on its own.
    }
    throw new Error(`Airtable ${response.status}${detail ? `: ${detail}` : ''}`);
  }

  return response.json();
}

/**
 * Every lead in the table.
 * Airtable returns at most 100 rows at a time, so pages are followed until
 * there are none left.
 *
 * @param {import('./settings.js').Connection} connection
 * @returns {Promise<{leads: import('./model.js').Lead[], skipped: string[]}>}
 */
export async function fetchLeads(connection) {
  const leads = [];
  const skipped = [];
  let offset;

  do {
    const query = new URLSearchParams({ pageSize: '100' });
    if (offset) query.set('offset', offset);

    const page = await request(connection, `?${query}`);
    for (const record of page.records ?? []) {
      const result = fromAirtableRecord(record);
      if (result.error) skipped.push(result.error);
      else leads.push(result.lead);
    }
    offset = page.offset;
  } while (offset);

  return { leads, skipped };
}

/**
 * Adds a lead and returns the Airtable record id it was given.
 *
 * @param {import('./settings.js').Connection} connection
 * @param {import('./model.js').Lead} lead
 * @returns {Promise<string>}
 */
export async function createLead(connection, lead) {
  const body = await request(connection, '', {
    method: 'POST',
    body: JSON.stringify({ fields: toAirtableFields(lead), typecast: true }),
  });
  return body.id;
}

/**
 * Overwrites a lead. PUT rather than PATCH, so a field cleared in the app is
 * cleared in Airtable instead of keeping its old value.
 *
 * @param {import('./settings.js').Connection} connection
 * @param {string} recordId
 * @param {import('./model.js').Lead} lead
 */
export async function updateLead(connection, recordId, lead) {
  await request(connection, `/${encodeURIComponent(recordId)}`, {
    method: 'PUT',
    body: JSON.stringify({ fields: toAirtableFields(lead), typecast: true }),
  });
}

/**
 * @param {import('./settings.js').Connection} connection
 * @param {string} recordId
 */
export async function deleteLead(connection, recordId) {
  await request(connection, `/${encodeURIComponent(recordId)}`, { method: 'DELETE' });
}

/**
 * Checks a connection before it is saved, so a typo is caught here rather than
 * silently later.
 *
 * @param {import('./settings.js').Connection} connection
 * @returns {Promise<{ok: true, count: number} | {ok: false, message: string}>}
 */
export async function testConnection(connection) {
  try {
    const body = await request(connection, '?pageSize=1');
    return { ok: true, count: (body.records ?? []).length };
  } catch (error) {
    return { ok: false, message: String(error.message ?? error) };
  }
}
