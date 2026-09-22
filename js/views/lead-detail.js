// Screen 4 – the lead card (SPEC.en.md section 9).
//
// Everything known about one lead, in the order the SPEC lists it: who she is
// and what needs doing, then the details, then the history of the
// conversations with her.
//
// Rows with nothing in them are left out rather than shown empty, so the card
// stays short and what is there is what matters.

import { formatFullDate, formatShortDate, today } from '../dates.js';
import { escapeHtml } from '../html.js';
import {
  daysSinceLastInteraction,
  isDueToday,
  isOverdue,
  isStale,
} from '../leads.js';
import {
  INTERACTION_TYPES,
  LOST_REASONS,
  NEXT_ACTIONS,
  PAYMENT_METHODS,
  PRODUCTS,
  SOURCES,
  STATUSES,
  TEMPERATURES,
  formatCurrency,
  labelOf,
} from '../model.js';
import { getLead } from '../store.js';

/**
 * One label-and-value row. Returns '' when there is nothing to show, which is
 * what keeps empty rows off the screen.
 *
 * @param {string} label
 * @param {string | number | undefined | null} value
 * @param {object} [options]
 * @param {boolean} [options.raw] Value is already safe HTML.
 */
function row(label, value, { raw = false } = {}) {
  if (value === undefined || value === null || value === '') return '';
  return `
    <div class="detail-row">
      <dt class="detail-label">${escapeHtml(label)}</dt>
      <dd class="detail-value">${raw ? value : escapeHtml(String(value))}</dd>
    </div>`;
}

/**
 * The banner naming what, if anything, is wrong right now.
 *
 * @param {import('../model.js').Lead} lead
 * @param {string} now
 */
function attentionBanner(lead, now) {
  if (isOverdue(lead, now)) {
    const action = labelOf(NEXT_ACTIONS, lead.nextAction, lead.customNextAction);
    return `<p class="detail-banner detail-banner-danger">
      פעולה באיחור: ${escapeHtml(action)}, נקבעה ל־${escapeHtml(formatFullDate(lead.nextActionDate))}
    </p>`;
  }
  if (isDueToday(lead, now)) {
    const action = labelOf(NEXT_ACTIONS, lead.nextAction, lead.customNextAction);
    return `<p class="detail-banner detail-banner-today">לביצוע היום: ${escapeHtml(action)}</p>`;
  }
  if (isStale(lead, now)) {
    return `<p class="detail-banner detail-banner-warning">
      ללא מענה ${daysSinceLastInteraction(lead, now)} ימים
    </p>`;
  }
  return '';
}

/**
 * The price block: what was offered, and what a discount left it at.
 *
 * @param {import('../model.js').Lead} lead
 */
function priceRows(lead) {
  if (lead.offeredPrice == null && !lead.discountOffered) return '';

  return (
    row('מחיר שהוצע', lead.offeredPrice != null ? formatCurrency(lead.offeredPrice) : '') +
    row('הנחה', lead.discountOffered && lead.discountAmount != null ? formatCurrency(lead.discountAmount) : '') +
    row('מחיר אחרי הנחה', lead.finalOfferedPrice != null ? formatCurrency(lead.finalOfferedPrice) : '')
  );
}

/**
 * The sale, shown only for a lead that became a client (SPEC section 10).
 *
 * @param {import('../model.js').Lead} lead
 */
function saleSection(lead) {
  if (lead.status !== 'won' || !lead.sale) return '';
  const sale = lead.sale;

  return `
    <section class="card detail-card" aria-labelledby="sale-heading">
      <h2 class="section-title" id="sale-heading">העסקה</h2>
      <dl class="detail-list">
        ${row('מה רכשה', labelOf(PRODUCTS, sale.product))}
        ${row('מחיר שסוכם', formatCurrency(sale.agreedPrice))}
        ${row('תאריך סגירה', formatFullDate(sale.closedAt))}
        ${row('תשלום', sale.paid ? 'שולם' : 'טרם שולם')}
        ${row('אמצעי תשלום', labelOf(PAYMENT_METHODS, sale.paymentMethod))}
        ${row('מספר תשלומים', sale.installments)}
        ${row('הערות על העסקה', sale.notes)}
      </dl>
    </section>`;
}

/**
 * Why a lead did not close (SPEC section 11).
 *
 * @param {import('../model.js').Lead} lead
 */
function lostSection(lead) {
  if (lead.status !== 'lost' || !lead.lostReason) return '';

  return `
    <section class="card detail-card" aria-labelledby="lost-heading">
      <h2 class="section-title" id="lost-heading">למה לא נסגרה</h2>
      <dl class="detail-list">
        ${row('סיבה', labelOf(LOST_REASONS, lead.lostReason, lead.customLostReason))}
      </dl>
    </section>`;
}

/**
 * The conversation history (SPEC section 9.3).
 * Oldest first, so it reads from the first contact forward.
 *
 * @param {import('../model.js').Lead} lead
 */
function interactionsSection(lead) {
  const interactions = [...lead.interactions].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const body = interactions.length
    ? `<ol class="timeline">
        ${interactions
          .map(
            (interaction) => `
              <li class="timeline-item">
                <p class="timeline-head">
                  <span class="timeline-date">${escapeHtml(formatShortDate(interaction.date))}</span>
                  <span class="timeline-type">${escapeHtml(labelOf(INTERACTION_TYPES, interaction.type))}</span>
                </p>
                ${interaction.note ? `<p class="timeline-note">${escapeHtml(interaction.note)}</p>` : ''}
              </li>`
          )
          .join('')}
      </ol>`
    : '<p class="empty-state">עדיין לא נרשמו אינטראקציות.</p>';

  return `
    <section class="card detail-card" aria-labelledby="history-heading">
      <h2 class="section-title" id="history-heading">
        היסטוריית אינטראקציות${interactions.length ? ` (${interactions.length})` : ''}
      </h2>
      ${body}
    </section>`;
}

/**
 * Status, temperature, source and phone are all in the header already, so the
 * details list below does not repeat them.
 *
 * @param {Record<string, string>} params
 * @returns {string}
 */
export function renderLeadDetail(params) {
  const lead = getLead(params.id);

  if (!lead) {
    return `
      <header class="page-header">
        <h1 class="page-title">הליד לא נמצא</h1>
        <p class="page-subtitle">ייתכן שהליד נמחק.</p>
      </header>
      <a class="btn btn-primary" href="#/leads">חזרה לרשימת הלידים</a>`;
  }

  const now = today();
  const editHref = `#/leads/${encodeURIComponent(lead.id)}/edit`;
  const products = lead.products.map((product) => labelOf(PRODUCTS, product)).join(', ');
  const nextAction = lead.nextAction
    ? `${labelOf(NEXT_ACTIONS, lead.nextAction, lead.customNextAction)}${
        lead.nextActionDate ? ` · ${formatFullDate(lead.nextActionDate)}` : ''
      }`
    : '';

  return `
    <p class="back-link-row">
      <a class="back-link" href="#/leads">› חזרה לרשימת הלידים</a>
    </p>

    <header class="page-header detail-header">
      <h1 class="page-title">${escapeHtml(lead.name)}</h1>
      <p class="lead-badges">
        <span class="badge badge-status-${escapeHtml(lead.status)}">${escapeHtml(labelOf(STATUSES, lead.status))}</span>
        <span class="badge badge-${escapeHtml(lead.temperature)}">${escapeHtml(labelOf(TEMPERATURES, lead.temperature))}</span>
        <span class="badge">${escapeHtml(labelOf(SOURCES, lead.source, lead.customSource))}</span>
      </p>
      <p class="detail-phone">${escapeHtml(lead.phone)}</p>
    </header>

    ${attentionBanner(lead, now)}

    <div class="detail-actions">
      <a class="btn btn-primary" href="${editHref}">עריכת הליד</a>
    </div>

    <section class="card detail-card" aria-labelledby="details-heading">
      <h2 class="section-title" id="details-heading">פרטי הליד</h2>
      <dl class="detail-list">
        ${row('מקור', labelOf(SOURCES, lead.source, lead.customSource))}
        ${row('מתעניינת ב־', products)}
        ${row('מה גרם לה לפנות', lead.interestReason)}
        ${row('פנייה ראשונה', formatFullDate(lead.createdAt))}
        ${row('שיחה אחרונה', lead.lastInteractionAt ? formatFullDate(lead.lastInteractionAt) : 'טרם דיברנו')}
        ${priceRows(lead)}
        ${row('הפעולה הבאה', nextAction || 'לא נקבעה')}
        ${row('הערות', lead.notes)}
      </dl>
    </section>

    ${saleSection(lead)}
    ${lostSection(lead)}
    ${interactionsSection(lead)}
  `;
}
