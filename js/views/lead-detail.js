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
  hasPendingAction,
  isDueToday,
  isOverdue,
  isStale,
} from '../leads.js';
import {
  ACTIVE_STATUSES,
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
import { getCurrentQuery, replaceQuery } from '../router.js';
import { addInteraction, changeStatus, createId, getLead } from '../store.js';
import { isValid, validateInteraction } from '../validation.js';
import { selectField, textField, textareaField } from './fields.js';

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
 * Changing the status without opening the whole form (SPEC section 9.1).
 *
 * Only the statuses of a lead still in play are offered. Closing a lead as won
 * or lost needs a sale or a reason, and those live in the form – so the panel
 * says so rather than quietly saving a lead that is missing them.
 *
 * @param {import('../model.js').Lead} lead
 */
function quickStatus(lead) {
  const choices = ACTIVE_STATUSES.map(
    (status) =>
      `<option value="${escapeHtml(status)}"${status === lead.status ? ' selected' : ''}>${escapeHtml(STATUSES[status])}</option>`
  ).join('');

  const finished = lead.status === 'won' || lead.status === 'lost';

  return `
    <section class="card quick-status" aria-labelledby="quick-status-heading">
      <h2 class="section-title" id="quick-status-heading">שינוי סטטוס</h2>
      ${
        finished
          ? `<p class="field-hint">
               הליד סגור (${escapeHtml(labelOf(STATUSES, lead.status))}).
               כדי לפתוח אותו מחדש יש לעבור לעריכה.
             </p>`
          : `<div class="quick-status-row">
               <label class="visually-hidden" for="quick-status">סטטוס</label>
               <select class="field-input" id="quick-status" data-role="quick-status">${choices}</select>
               <button class="btn btn-secondary" type="button" data-action="save-status">שמירה</button>
             </div>
             <p class="field-hint">
               לסגירת הליד כלקוחה או כלא־נסגרה יש לעבור לעריכה, שם נרשמים גם פרטי העסקה או הסיבה.
             </p>`
      }
    </section>`;
}

/**
 * The panel for recording a conversation (SPEC section 9.4) and deciding what
 * comes next (SPEC section 12).
 *
 * One panel does both jobs, because in practice they are the same moment: you
 * write down what was said, and then you decide what to do about it. Leaving
 * the next action empty is what marks the previous one as done.
 *
 * @param {import('../model.js').Lead} lead
 */
function interactionPanel(lead) {
  return `
    <section class="card interaction-panel" data-role="interaction-panel" hidden
             aria-labelledby="interaction-heading">
      <h2 class="section-title" id="interaction-heading" tabindex="-1">הוספת אינטראקציה</h2>
      <p class="form-summary" data-role="interaction-summary" role="alert" hidden></p>

      <!--
        novalidate turns off the browser's own checks, exactly as in the lead
        form. Without it the browser blocks the submit with an English bubble
        before validateInteraction ever runs, and the Hebrew messages below
        never appear.
      -->
      <form id="interaction-form" novalidate>
        ${textField({ name: 'interactionDate', label: 'תאריך', type: 'date', value: today(), required: true })}
        ${selectField({ name: 'interactionType', label: 'סוג האינטראקציה', options: INTERACTION_TYPES, value: '', required: true, placeholder: 'בחרי סוג' })}
        ${textareaField({ name: 'interactionNote', label: 'הערה', rows: 3, placeholder: 'מה נאמר בשיחה?' })}

        <hr class="panel-divider">

        ${selectField({
          name: 'newNextAction',
          label: 'הפעולה הבאה',
          options: NEXT_ACTIONS,
          value: lead.nextAction ?? '',
          placeholder: 'אין פעולה ממתינה',
          hint: 'השארה ריקה מסמנת שהפעולה הקודמת בוצעה ואין משימה פתוחה.',
        })}
        <div class="conditional" data-when="new-next-action-other" hidden>
          ${textField({ name: 'newCustomNextAction', label: 'פירוט הפעולה', value: lead.customNextAction ?? '' })}
        </div>
        <div class="conditional" data-when="new-next-action-any" hidden>
          ${textField({ name: 'newNextActionDate', label: 'תאריך הפעולה הבאה', type: 'date', value: lead.nextActionDate ?? '' })}
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" type="submit">שמירה</button>
          <button class="btn btn-secondary" type="button" data-action="close-interaction">ביטול</button>
        </div>
      </form>
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
      <button class="btn btn-primary" type="button" data-action="open-interaction">
        + הוספת אינטראקציה
      </button>
      ${
        hasPendingAction(lead)
          ? `<button class="btn btn-secondary" type="button" data-action="mark-done">
               סימון הפעולה כבוצעה
             </button>`
          : ''
      }
      <a class="btn btn-secondary" href="${editHref}">עריכת הליד</a>
    </div>

    ${quickStatus(lead)}
    ${interactionPanel(lead)}

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

/**
 * @param {HTMLElement} screen The element holding this screen's HTML.
 * @param {Record<string, string>} params
 */
export function mountLeadDetail(screen, params) {
  const lead = getLead(params.id);
  if (!lead) return; // the "lead not found" screen has nothing to attach to

  const panel = screen.querySelector('[data-role="interaction-panel"]');
  const form = screen.querySelector('#interaction-form');
  const summary = screen.querySelector('[data-role="interaction-summary"]');

  /** Shows or hides the parts of the panel that depend on the next action. */
  function updateConditionals() {
    const chosen = form.elements.newNextAction.value;
    const shown = {
      'new-next-action-any': Boolean(chosen),
      'new-next-action-other': chosen === 'other',
    };
    for (const block of form.querySelectorAll('.conditional')) {
      block.hidden = !shown[block.dataset.when];
    }
  }

  /**
   * Opens the panel.
   * @param {boolean} clearNextAction true when the pending action is being
   *   marked as done, so the field starts empty instead of repeating it.
   */
  function openPanel(clearNextAction) {
    if (clearNextAction) form.elements.newNextAction.value = '';
    updateConditionals();
    panel.hidden = false;
    panel.scrollIntoView({ block: 'nearest' });
    screen.querySelector('#interaction-heading').focus();
  }

  function closePanel() {
    panel.hidden = true;
    summary.hidden = true;
    form.reset();
  }

  /** Redraws the whole card, the way app.js does, so no listener is left behind. */
  function redraw() {
    const fresh = document.createElement('div');
    fresh.innerHTML = renderLeadDetail(params);
    screen.replaceWith(fresh);
    mountLeadDetail(fresh, params);
  }

  /**
   * Marks the fields an error belongs to. The keys returned by
   * validateInteraction are the field names, so they line up directly.
   *
   * @param {Record<string, string>} errors
   */
  function markInvalidFields(errors) {
    for (const field of form.querySelectorAll('.field')) {
      field.classList.remove('field-invalid');
    }
    for (const input of form.querySelectorAll('[aria-invalid]')) {
      input.removeAttribute('aria-invalid');
    }
    for (const name of Object.keys(errors)) {
      const input = form.elements[name];
      if (!input) continue;
      input.setAttribute('aria-invalid', 'true');
      input.closest('.field')?.classList.add('field-invalid');
    }
  }

  // Arriving from the Tasks screen with "?panel=done" opens the panel ready to
  // mark the pending action as done. The parameter is then removed, so that
  // redrawing the card later does not reopen it.
  if (getCurrentQuery().get('panel') === 'done' && hasPendingAction(lead)) {
    openPanel(true);
    replaceQuery(`/leads/${encodeURIComponent(params.id)}`, new URLSearchParams());
  }

  form.addEventListener('change', updateConditionals);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const value = (name) => form.elements[name].value.trim();
    const draft = {
      date: value('interactionDate'),
      type: value('interactionType'),
      note: value('interactionNote'),
      nextAction: value('newNextAction'),
      customNextAction: value('newCustomNextAction'),
      nextActionDate: value('newNextActionDate'),
    };

    const errors = validateInteraction(draft, lead);
    markInvalidFields(errors);

    if (!isValid(errors)) {
      // The panel is short, so one message at the top reads better than
      // scattering them, and it is what a screen reader announces first. The
      // fields themselves are still marked, so it is clear which ones they are.
      summary.textContent = Object.values(errors).join(' ');
      summary.hidden = false;
      return;
    }

    summary.hidden = true;

    addInteraction(params.id, {
      interaction: {
        id: createId('interaction'),
        date: draft.date,
        type: draft.type,
        ...(draft.note ? { note: draft.note } : {}),
      },
      nextAction: draft.nextAction,
      customNextAction: draft.customNextAction,
      nextActionDate: draft.nextActionDate,
    });

    redraw();
  });

  screen.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'open-interaction') openPanel(false);
    else if (action === 'mark-done') openPanel(true);
    else if (action === 'close-interaction') closePanel();
    else if (action === 'save-status') {
      const chosen = screen.querySelector('[data-role="quick-status"]').value;
      if (changeStatus(params.id, chosen)) redraw();
    }
  });
}
