// Exporting the leads as CSV, for importing into a spreadsheet or Airtable.
//
// Two files rather than one, because a lead has many conversations and a
// single row cannot hold them. That is also how the data wants to be modelled
// in Airtable: a table of leads, a table of interactions, and a link between
// them. Each interaction row carries both the lead's name and her id, so the
// link can be made on either.
//
// Headers and values are written in Hebrew, because they become the field
// names and the cell contents in Airtable, and the person reading them there
// is the same person reading them here.

import { formatFullDate } from './dates.js';
import {
  INTERACTION_TYPES,
  LOST_REASONS,
  NEXT_ACTIONS,
  PAYMENT_METHODS,
  PRODUCTS,
  SOURCES,
  STATUSES,
  TEMPERATURES,
  labelOf,
} from './model.js';

/**
 * One cell of a CSV row.
 *
 * A cell only needs quoting when it contains a comma, a quote or a line
 * break; quoting everything would work too but makes the file harder to read.
 * A quote inside a quoted cell is written twice, which is what the CSV format
 * asks for.
 *
 * @param {unknown} value
 * @returns {string}
 */
function csvCell(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Rows of values into CSV text.
 *
 * Lines end with CRLF, which is what the CSV format specifies and what
 * Excel expects; Airtable and Google Sheets accept it too.
 *
 * @param {Array<Array<unknown>>} rows The first row is the header.
 * @returns {string}
 */
function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

/** How a yes/no value is written, so it reads as Hebrew rather than "true". */
const yesNo = (value) => (value ? 'כן' : 'לא');

/**
 * The leads, one row each.
 *
 * Products are joined with commas so that Airtable can read the column as a
 * "multiple select" and split it back into separate options on import.
 *
 * @param {import('./model.js').Lead[]} leads
 * @returns {string}
 */
export function leadsToCsv(leads) {
  const header = [
    'שם', 'טלפון', 'מקור', 'מתעניינת ב', 'סיבת הפנייה',
    'תאריך פנייה ראשונה', 'תאריך שיחה אחרונה', 'סטטוס', 'רמת חום',
    'מחיר שהוצע', 'הוצעה הנחה', 'סכום ההנחה', 'מחיר אחרי הנחה',
    'הפעולה הבאה', 'תאריך הפעולה הבאה', 'הערות',
    'מה רכשה', 'מחיר שסוכם', 'תאריך סגירה', 'שולם', 'אמצעי תשלום',
    'מספר תשלומים', 'הערות על העסקה', 'סיבת אי־סגירה',
    'מספר אינטראקציות', 'מזהה',
  ];

  const rows = leads.map((lead) => [
    lead.name,
    lead.phone,
    labelOf(SOURCES, lead.source, lead.customSource),
    lead.products.map((product) => labelOf(PRODUCTS, product)).join(', '),
    lead.interestReason,
    formatFullDate(lead.createdAt),
    formatFullDate(lead.lastInteractionAt),
    labelOf(STATUSES, lead.status),
    labelOf(TEMPERATURES, lead.temperature),
    lead.offeredPrice,
    yesNo(lead.discountOffered),
    lead.discountAmount,
    lead.finalOfferedPrice,
    labelOf(NEXT_ACTIONS, lead.nextAction, lead.customNextAction),
    formatFullDate(lead.nextActionDate),
    lead.notes,
    lead.sale ? labelOf(PRODUCTS, lead.sale.product) : '',
    lead.sale?.agreedPrice,
    lead.sale ? formatFullDate(lead.sale.closedAt) : '',
    lead.sale ? yesNo(lead.sale.paid) : '',
    lead.sale ? labelOf(PAYMENT_METHODS, lead.sale.paymentMethod) : '',
    lead.sale?.installments,
    lead.sale?.notes,
    labelOf(LOST_REASONS, lead.lostReason, lead.customLostReason),
    lead.interactions.length,
    lead.id,
  ]);

  return toCsv([header, ...rows]);
}

/**
 * Every interaction of every lead, one row each, oldest first.
 *
 * @param {import('./model.js').Lead[]} leads
 * @returns {string}
 */
export function interactionsToCsv(leads) {
  const header = ['ליד', 'תאריך', 'סוג', 'הערה', 'מזהה הליד', 'מזהה'];

  const rows = leads.flatMap((lead) =>
    [...lead.interactions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((interaction) => [
        lead.name,
        formatFullDate(interaction.date),
        labelOf(INTERACTION_TYPES, interaction.type),
        interaction.note,
        lead.id,
        interaction.id,
      ])
  );

  return toCsv([header, ...rows]);
}

/**
 * Hands the file to the browser to save.
 *
 * The file is built in memory and offered as a download: nothing is uploaded
 * anywhere, and the app still needs no server.
 *
 * The text starts with a byte order mark. Without it, Excel opens a UTF-8 file
 * as if it were Windows-1255 and every Hebrew name arrives as gibberish.
 *
 * @param {string} filename
 * @param {string} csv
 */
export function downloadCsv(filename, csv) {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();

  // The browser has the data now; release the memory the URL was holding.
  URL.revokeObjectURL(url);
}

/**
 * A filename that says what it is and when it was made, so successive exports
 * do not overwrite each other in the downloads folder.
 *
 * @param {string} base
 * @param {string} todayISO
 */
export function exportFilename(base, todayISO) {
  return `leadflow-${base}-${todayISO}.csv`;
}
