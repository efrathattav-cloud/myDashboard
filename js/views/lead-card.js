// One lead, shown as a card. Used on the Dashboard and later on the Leads list.

import { formatShortDate } from '../dates.js';
import { escapeHtml } from '../html.js';
import {
  daysSinceLastInteraction,
  isDueToday,
  isOverdue,
  isStale,
} from '../leads.js';
import {
  NEXT_ACTIONS,
  PRODUCTS,
  SOURCES,
  STATUSES,
  TEMPERATURES,
  labelOf,
} from '../model.js';

/**
 * A small pill of text.
 * Accessibility (SPEC section 21): a badge always says what it means in words.
 * Colour only repeats what the text already says, so the card still makes
 * sense in black and white or to a screen reader.
 *
 * @param {string} text
 * @param {string} [variant] Extra class, e.g. 'badge-hot'.
 */
function badge(text, variant = '') {
  return `<span class="badge ${variant}">${escapeHtml(text)}</span>`;
}

/**
 * The warning line at the top of a card that needs the owner's attention.
 *
 * @param {import('../model.js').Lead} lead
 * @param {string} now
 * @returns {string} '' when nothing is wrong.
 */
function attentionFlag(lead, now) {
  if (isOverdue(lead, now)) {
    return `<p class="lead-flag lead-flag-danger">באיחור · ${escapeHtml(
      formatShortDate(lead.nextActionDate)
    )}</p>`;
  }
  if (isDueToday(lead, now)) {
    return '<p class="lead-flag lead-flag-today">לביצוע היום</p>';
  }
  if (isStale(lead, now)) {
    const days = daysSinceLastInteraction(lead, now);
    return `<p class="lead-flag lead-flag-warning">ללא מענה ${days} ימים</p>`;
  }
  return '';
}

/**
 * The next step line: what to do and when.
 *
 * @param {import('../model.js').Lead} lead
 */
function nextStepRow(lead) {
  if (!lead.nextAction) {
    return `
      <div class="lead-row">
        <span class="lead-row-label">הצעד הבא</span>
        <span class="lead-row-value lead-row-muted">לא נקבע</span>
      </div>`;
  }

  const action = labelOf(NEXT_ACTIONS, lead.nextAction, lead.customNextAction);
  const date = formatShortDate(lead.nextActionDate);
  return `
    <div class="lead-row">
      <span class="lead-row-label">הצעד הבא</span>
      <span class="lead-row-value">${escapeHtml(action)}${
        date ? ` · ${escapeHtml(date)}` : ''
      }</span>
    </div>`;
}

/**
 * Renders one lead card.
 *
 * @param {import('../model.js').Lead} lead
 * @param {string} now ISO date treated as today.
 * @returns {string}
 */
export function renderLeadCard(lead, now) {
  const products = lead.products
    .map((product) => labelOf(PRODUCTS, product))
    .join(', ');

  const flag = attentionFlag(lead, now);

  return `
    <article class="card lead-card${flag ? ' lead-card-attention' : ''}">
      ${flag}
      <h3 class="lead-name">
        <a class="lead-name-link" href="#/leads/${encodeURIComponent(lead.id)}">${escapeHtml(lead.name)}</a>
      </h3>
      <p class="lead-badges">
        ${badge(labelOf(STATUSES, lead.status), `badge-status-${lead.status}`)}
        ${badge(labelOf(TEMPERATURES, lead.temperature), `badge-${lead.temperature}`)}
        ${badge(labelOf(SOURCES, lead.source, lead.customSource))}
      </p>
      <div class="lead-rows">
        <div class="lead-row">
          <span class="lead-row-label">מתעניינת ב־</span>
          <span class="lead-row-value">${escapeHtml(products)}</span>
        </div>
        <div class="lead-row">
          <span class="lead-row-label">שיחה אחרונה</span>
          <span class="lead-row-value">${escapeHtml(
            formatShortDate(lead.lastInteractionAt) || 'טרם דיברנו'
          )}</span>
        </div>
        ${nextStepRow(lead)}
      </div>
      <p class="lead-actions">
        <a class="lead-action" href="#/leads/${encodeURIComponent(lead.id)}/edit">
          עריכה<span class="visually-hidden"> של ${escapeHtml(lead.name)}</span>
        </a>
      </p>
    </article>`;
}
