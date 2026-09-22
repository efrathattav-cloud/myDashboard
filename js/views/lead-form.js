// Screen 3 – adding and editing a lead (SPEC.en.md sections 8, 10 and 11).
//
// One screen serves both jobs. With no id in the address it starts a new lead;
// with an id it loads that lead. Everything below is the same either way, so
// the two can never drift apart.
//
// Some parts of the form only make sense sometimes: the free-text box for
// "other", the discount amounts, the sale details, the reason a lead did not
// close. They are always rendered and simply hidden until they apply, which
// keeps the rendering straightforward and the toggling to one small function.

import { today } from '../dates.js';
import { escapeHtml } from '../html.js';
import {
  LOST_REASONS,
  NEXT_ACTIONS,
  PAYMENT_METHODS,
  PRODUCTS,
  SOURCES,
  STATUSES,
  TEMPERATURES,
  formatCurrency,
} from '../model.js';
import { createId, deleteLead, getLead, saveLead } from '../store.js';
import { isValid, validateLead } from '../validation.js';
import {
  checkboxGroup,
  radioGroup,
  selectField,
  textField,
  textareaField,
  toggleField,
} from './fields.js';

/**
 * Errors from the last failed save, shown once and then cleared.
 * Kept here rather than in the lead itself: they belong to this attempt at
 * filling the form, not to the lead.
 * @type {{leadId: string, errors: Record<string, string>, draft: object} | null}
 */
let lastAttempt = null;

/** A blank lead, used when adding. */
function emptyLead() {
  return {
    id: '',
    name: '',
    phone: '',
    source: '',
    customSource: '',
    products: [],
    interestReason: '',
    createdAt: today(),
    lastInteractionAt: '',
    status: 'new',
    temperature: '',
    offeredPrice: undefined,
    discountOffered: false,
    discountAmount: undefined,
    finalOfferedPrice: undefined,
    nextAction: '',
    customNextAction: '',
    nextActionDate: '',
    notes: '',
    interactions: [],
  };
}

/**
 * The values the form should show: the saved lead, or – if the last save
 * failed – whatever the user had typed, so nothing is lost.
 *
 * @param {string} [id]
 */
function formValues(id) {
  const saved = id ? getLead(id) : null;
  const base = saved ? { ...saved } : emptyLead();

  if (lastAttempt && lastAttempt.leadId === (id ?? '')) {
    return { values: { ...base, ...lastAttempt.draft }, errors: lastAttempt.errors };
  }
  return { values: base, errors: {} };
}

/**
 * A block that is only shown in certain situations.
 *
 * @param {string} key    Matched against the form's current state in mount().
 * @param {boolean} shown
 * @param {string} content
 */
function conditional(key, shown, content) {
  return `<div class="conditional" data-when="${escapeHtml(key)}"${shown ? '' : ' hidden'}>${content}</div>`;
}

/**
 * @param {Record<string, string>} params
 * @returns {string}
 */
export function renderLeadForm(params) {
  const id = params.id ?? '';

  if (id && !getLead(id)) {
    return `
      <header class="page-header">
        <h1 class="page-title">הליד לא נמצא</h1>
        <p class="page-subtitle">ייתכן שהליד נמחק.</p>
      </header>
      <a class="btn btn-primary" href="#/leads">חזרה לרשימת הלידים</a>`;
  }

  const { values, errors } = formValues(id);
  const isEdit = Boolean(id);
  const sale = values.sale ?? {};
  const errorCount = Object.keys(errors).length;

  return `
    <header class="page-header">
      <h1 class="page-title">${isEdit ? 'עריכת ליד' : 'ליד חדש'}</h1>
      <p class="page-subtitle">
        ${isEdit ? escapeHtml(values.name) : 'שדות המסומנים ב־* הם חובה.'}
      </p>
    </header>

    ${
      errorCount
        ? `<p class="form-summary" role="alert" tabindex="-1" id="form-summary">
             לא ניתן לשמור: ${errorCount === 1 ? 'יש שדה אחד שדורש תיקון' : `יש ${errorCount} שדות שדורשים תיקון`}.
           </p>`
        : ''
    }

    <form class="lead-form" id="lead-form" novalidate>
      <section class="form-section">
        <h2 class="form-section-title">פרטים בסיסיים</h2>
        ${textField({ name: 'name', label: 'שם', value: values.name, required: true, error: errors.name })}
        ${textField({ name: 'phone', label: 'טלפון', type: 'tel', inputMode: 'tel', value: values.phone, required: true, error: errors.phone, placeholder: '050-0000000' })}
        ${selectField({ name: 'source', label: 'מקור הליד', options: SOURCES, value: values.source, required: true, error: errors.source })}
        ${conditional(
          'source-other',
          values.source === 'other',
          textField({ name: 'customSource', label: 'פירוט המקור', value: values.customSource, error: errors.customSource, placeholder: 'למשל: הרצאה בספרייה' })
        )}
        ${checkboxGroup({ name: 'products', legend: 'מתעניינת ב־', options: PRODUCTS, values: values.products, hint: 'אפשר לסמן יותר ממוצר אחד.' })}
        ${textareaField({ name: 'interestReason', label: 'מה גרם לה לפנות?', value: values.interestReason, placeholder: 'מה היא רוצה לשנות או לפתור?' })}
      </section>

      <section class="form-section">
        <h2 class="form-section-title">סטטוס ומעקב</h2>
        ${selectField({ name: 'status', label: 'סטטוס', options: STATUSES, value: values.status, required: true, error: errors.status, placeholder: 'בחרי סטטוס' })}
        ${radioGroup({ name: 'temperature', legend: 'רמת חום', options: TEMPERATURES, value: values.temperature, required: true, error: errors.temperature })}
        ${textField({ name: 'createdAt', label: 'תאריך פנייה ראשונה', type: 'date', value: values.createdAt, required: true, error: errors.createdAt })}
        ${textField({ name: 'lastInteractionAt', label: 'תאריך שיחה אחרונה', type: 'date', value: values.lastInteractionAt, error: errors.lastInteractionAt })}
        ${selectField({ name: 'nextAction', label: 'הפעולה הבאה', options: NEXT_ACTIONS, value: values.nextAction, placeholder: 'לא נקבעה פעולה' })}
        ${conditional(
          'next-action-other',
          values.nextAction === 'other',
          textField({ name: 'customNextAction', label: 'פירוט הפעולה', value: values.customNextAction, error: errors.customNextAction })
        )}
        ${conditional(
          'next-action-any',
          Boolean(values.nextAction),
          textField({ name: 'nextActionDate', label: 'תאריך הפעולה הבאה', type: 'date', value: values.nextActionDate, error: errors.nextActionDate })
        )}
      </section>

      <section class="form-section">
        <h2 class="form-section-title">מחיר</h2>
        ${textField({ name: 'offeredPrice', label: 'מחיר שהוצע (₪)', type: 'number', inputMode: 'numeric', min: 0, value: values.offeredPrice ?? '', error: errors.offeredPrice })}
        ${toggleField({ name: 'discountOffered', label: 'הוצעה הנחה', checked: values.discountOffered })}
        ${conditional(
          'discount',
          values.discountOffered,
          textField({ name: 'discountAmount', label: 'סכום ההנחה (₪)', type: 'number', inputMode: 'numeric', min: 0, value: values.discountAmount ?? '', error: errors.discountAmount }) +
            `<p class="computed-value" id="final-price">
               מחיר אחרי הנחה: <strong>${escapeHtml(formatCurrency(values.finalOfferedPrice ?? 0))}</strong>
             </p>`
        )}
      </section>

      ${conditional(
        'status-won',
        values.status === 'won',
        `<section class="form-section">
          <h2 class="form-section-title">סגירה כלקוחה</h2>
          ${selectField({ name: 'saleProduct', label: 'מה רכשה', options: PRODUCTS, value: sale.product ?? '', required: true, error: errors.saleProduct })}
          ${textField({ name: 'agreedPrice', label: 'המחיר שסוכם בפועל (₪)', type: 'number', inputMode: 'numeric', min: 0, value: sale.agreedPrice ?? '', required: true, error: errors.agreedPrice, hint: 'זהו הסכום שמופיע בהכנסות.' })}
          ${textField({ name: 'closedAt', label: 'תאריך הסגירה', type: 'date', value: sale.closedAt ?? '', required: true, error: errors.closedAt })}
          ${toggleField({ name: 'paid', label: 'שילמה', checked: Boolean(sale.paid) })}
          ${selectField({ name: 'paymentMethod', label: 'אמצעי תשלום', options: PAYMENT_METHODS, value: sale.paymentMethod ?? '' })}
          ${textField({ name: 'installments', label: 'מספר תשלומים', type: 'number', inputMode: 'numeric', min: 1, value: sale.installments ?? '', error: errors.installments })}
          ${textareaField({ name: 'saleNotes', label: 'הערות על העסקה', value: sale.notes ?? '', rows: 2 })}
        </section>`
      )}

      ${conditional(
        'status-lost',
        values.status === 'lost',
        `<section class="form-section">
          <h2 class="form-section-title">למה לא נסגרה</h2>
          ${selectField({ name: 'lostReason', label: 'סיבה', options: LOST_REASONS, value: values.lostReason ?? '', required: true, error: errors.lostReason })}
          ${conditional(
            'lost-reason-other',
            values.lostReason === 'other',
            textareaField({ name: 'customLostReason', label: 'פירוט הסיבה', value: values.customLostReason ?? '', rows: 2, error: errors.customLostReason })
          )}
        </section>`
      )}

      <section class="form-section">
        <h2 class="form-section-title">הערות</h2>
        ${textareaField({ name: 'notes', label: 'הערות', value: values.notes, rows: 4 })}
      </section>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit">${isEdit ? 'שמירת השינויים' : 'הוספת הליד'}</button>
        <a class="btn btn-secondary" href="#/leads">ביטול</a>
      </div>
    </form>

    ${
      isEdit
        ? `<section class="danger-zone">
             <button class="btn btn-danger" type="button" data-action="ask-delete">מחיקת הליד</button>
             <div class="delete-confirm" data-role="delete-confirm" hidden>
               <p class="delete-question">למחוק את ${escapeHtml(values.name)}? הפעולה אינה הפיכה.</p>
               <div class="form-actions">
                 <button class="btn btn-danger" type="button" data-action="confirm-delete">כן, למחוק</button>
                 <button class="btn btn-secondary" type="button" data-action="cancel-delete">ביטול</button>
               </div>
             </div>
           </section>`
        : ''
    }
  `;
}

/**
 * Turns the form's fields into a lead object.
 *
 * @param {HTMLFormElement} form
 * @param {import('../model.js').Lead | null} existing The lead being edited.
 * @returns {import('../model.js').Lead}
 */
function readForm(form, existing) {
  const data = new FormData(form);
  const text = (name) => (data.get(name) ?? '').toString().trim();
  const number = (name) => {
    const raw = text(name);
    return raw === '' ? undefined : Number(raw);
  };
  const checked = (name) => data.get(name) === 'yes';

  const status = text('status');
  const offeredPrice = number('offeredPrice');
  const discountOffered = checked('discountOffered');
  const discountAmount = discountOffered ? number('discountAmount') : undefined;
  const nextAction = text('nextAction');

  /** @type {import('../model.js').Lead} */
  const lead = {
    ...(existing ?? {}),
    id: existing?.id || createId(),
    name: text('name'),
    phone: text('phone'),
    source: text('source'),
    products: data.getAll('products').map(String),
    createdAt: text('createdAt'),
    status,
    temperature: text('temperature'),
    discountOffered,
    interactions: existing?.interactions ?? [],
  };

  // Optional values are stored only when they have something in them, so a
  // cleared field really disappears instead of being kept as an empty string.
  const setOrDrop = (key, value) => {
    if (value === undefined || value === '' || value === null) delete lead[key];
    else lead[key] = value;
  };

  setOrDrop('customSource', lead.source === 'other' ? text('customSource') : '');
  setOrDrop('interestReason', text('interestReason'));
  setOrDrop('lastInteractionAt', text('lastInteractionAt'));
  setOrDrop('offeredPrice', offeredPrice);
  setOrDrop('discountAmount', discountAmount);
  setOrDrop(
    'finalOfferedPrice',
    discountOffered && offeredPrice != null && discountAmount != null
      ? offeredPrice - discountAmount
      : undefined
  );
  setOrDrop('nextAction', nextAction);
  setOrDrop('customNextAction', nextAction === 'other' ? text('customNextAction') : '');
  setOrDrop('nextActionDate', nextAction ? text('nextActionDate') : '');
  setOrDrop('notes', text('notes'));

  // A finished lead has nothing pending (the rule leads.js relies on).
  if (status === 'won' || status === 'lost') {
    delete lead.nextAction;
    delete lead.customNextAction;
    delete lead.nextActionDate;
  }

  if (status === 'won') {
    const product = text('saleProduct');
    lead.sale = {
      product,
      agreedPrice: number('agreedPrice'),
      closedAt: text('closedAt'),
      paid: checked('paid'),
    };
    const paymentMethod = text('paymentMethod');
    if (paymentMethod) lead.sale.paymentMethod = paymentMethod;
    const installments = number('installments');
    if (installments != null) lead.sale.installments = installments;
    const saleNotes = text('saleNotes');
    if (saleNotes) lead.sale.notes = saleNotes;

    // She clearly was interested in what she bought.
    if (product && !lead.products.includes(product)) lead.products.push(product);
  } else {
    delete lead.sale;
  }

  if (status === 'lost') {
    lead.lostReason = text('lostReason');
    setOrDrop('customLostReason', lead.lostReason === 'other' ? text('customLostReason') : '');
  } else {
    delete lead.lostReason;
    delete lead.customLostReason;
  }

  return lead;
}

/**
 * Shows and hides the parts of the form that only apply sometimes.
 *
 * @param {HTMLFormElement} form
 */
function updateConditionals(form) {
  const value = (name) => form.elements[name]?.value ?? '';
  const status = value('status');
  const nextAction = value('nextAction');
  const discountOffered = form.elements.discountOffered?.checked ?? false;

  const shown = {
    'source-other': value('source') === 'other',
    'next-action-any': Boolean(nextAction),
    'next-action-other': nextAction === 'other',
    discount: discountOffered,
    'status-won': status === 'won',
    'status-lost': status === 'lost',
    'lost-reason-other': value('lostReason') === 'other',
  };

  for (const block of form.querySelectorAll('.conditional')) {
    const key = block.dataset.when;
    if (key in shown) block.hidden = !shown[key];
  }
}

/**
 * Keeps "price after discount" in step with the two numbers above it.
 *
 * @param {HTMLFormElement} form
 */
function updateFinalPrice(form) {
  const target = form.querySelector('#final-price strong');
  if (!target) return;
  const offered = Number(form.elements.offeredPrice?.value || 0);
  const discount = Number(form.elements.discountAmount?.value || 0);
  target.textContent = formatCurrency(Math.max(offered - discount, 0));
}

/**
 * @param {HTMLElement} screen The element holding this screen's HTML.
 * @param {Record<string, string>} params
 */
export function mountLeadForm(screen, params) {
  const id = params.id ?? '';
  const form = screen.querySelector('#lead-form');
  if (!form) return; // the "lead not found" screen has no form

  // Errors from a previous attempt have now been shown; do not repeat them.
  lastAttempt = null;

  updateConditionals(form);
  updateFinalPrice(form);

  form.addEventListener('change', () => {
    updateConditionals(form);
    updateFinalPrice(form);
  });
  form.addEventListener('input', () => updateFinalPrice(form));

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const existing = id ? getLead(id) : null;
    const lead = readForm(form, existing);
    const errors = validateLead(lead);

    if (!isValid(errors)) {
      // Keep what was typed so nothing has to be entered again.
      lastAttempt = { leadId: id, errors, draft: lead };
      renderAgain();
      return;
    }

    saveLead(lead);
    window.location.hash = '#/leads';
  });

  // Delete, behind one confirmation step.
  const confirmBox = screen.querySelector('[data-role="delete-confirm"]');
  screen.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'ask-delete') {
      confirmBox.hidden = false;
      confirmBox.querySelector('[data-action="confirm-delete"]').focus();
    } else if (action === 'cancel-delete') {
      confirmBox.hidden = true;
      screen.querySelector('[data-action="ask-delete"]').focus();
    } else if (action === 'confirm-delete') {
      deleteLead(id);
      window.location.hash = '#/leads';
    }
  });

  /**
   * Redraws this screen after a failed save. The hash has not changed, so the
   * router would not fire on its own.
   *
   * A replacement element is built rather than refilling the current one, for
   * the same reason app.js does it: the old element takes its listeners with
   * it when it goes.
   */
  function renderAgain() {
    const fresh = document.createElement('div');
    fresh.innerHTML = renderLeadForm(params);
    screen.replaceWith(fresh);
    mountLeadForm(fresh, params);
    fresh.querySelector('#form-summary')?.focus();
    fresh.querySelector('.field-invalid')?.scrollIntoView({ block: 'center' });
  }
}
