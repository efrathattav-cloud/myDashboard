// Validation rules for a lead (SPEC.en.md section 19).
//
// Kept apart from the form on purpose: these are plain functions that take a
// lead and return messages. They know nothing about inputs, HTML or the DOM,
// which makes them easy to read and easy to check.
//
// The keys of the returned object match the form field names, so the form can
// place each message next to the field it belongs to.

/**
 * Checks a lead and returns one message per problem found.
 *
 * @param {Partial<import('./model.js').Lead>} lead
 * @returns {Record<string, string>} Empty when the lead is valid.
 */
export function validateLead(lead) {
  /** @type {Record<string, string>} */
  const errors = {};
  const filled = (value) => typeof value === 'string' && value.trim() !== '';

  // Always required.
  if (!filled(lead.name)) errors.name = 'יש להזין שם.';
  if (!filled(lead.phone)) errors.phone = 'יש להזין מספר טלפון.';
  if (!lead.source) errors.source = 'יש לבחור מקור.';
  if (!lead.status) errors.status = 'יש לבחור סטטוס.';
  if (!lead.temperature) errors.temperature = 'יש לבחור רמת חום.';
  if (!lead.createdAt) errors.createdAt = 'יש להזין תאריך פנייה ראשונה.';

  // "Other" always needs the free text that explains it.
  if (lead.source === 'other' && !filled(lead.customSource)) {
    errors.customSource = 'יש לפרט מהו המקור.';
  }
  if (lead.nextAction === 'other' && !filled(lead.customNextAction)) {
    errors.customNextAction = 'יש לפרט מהי הפעולה.';
  }

  // An action without a date can never show up in the right place.
  if (lead.nextAction && !lead.nextActionDate) {
    errors.nextActionDate = 'יש להזין תאריך לפעולה הבאה.';
  }

  // A discount has to be a real amount.
  if (lead.discountOffered && !(lead.discountAmount > 0)) {
    errors.discountAmount = 'יש להזין את סכום ההנחה.';
  }
  if (
    lead.discountOffered &&
    lead.discountAmount > 0 &&
    !(lead.offeredPrice > 0)
  ) {
    errors.offeredPrice = 'כדי לחשב מחיר אחרי הנחה יש להזין מחיר שהוצע.';
  }

  // Closing a lead as a client (SPEC section 10).
  if (lead.status === 'won') {
    if (!lead.sale?.product) errors.saleProduct = 'יש לבחור מה נרכש.';
    if (!(lead.sale?.agreedPrice > 0)) errors.agreedPrice = 'יש להזין את המחיר שסוכם.';
    if (!lead.sale?.closedAt) errors.closedAt = 'יש להזין תאריך סגירה.';
    if (lead.sale?.installments != null && lead.sale.installments < 1) {
      errors.installments = 'מספר התשלומים חייב להיות 1 או יותר.';
    }
  }

  // A lead that did not close (SPEC section 11).
  if (lead.status === 'lost') {
    if (!lead.lostReason) errors.lostReason = 'יש לבחור סיבה.';
    if (lead.lostReason === 'other' && !filled(lead.customLostReason)) {
      errors.customLostReason = 'יש לפרט את הסיבה.';
    }
  }

  // Dates that contradict each other.
  if (lead.createdAt && lead.lastInteractionAt && lead.lastInteractionAt < lead.createdAt) {
    errors.lastInteractionAt = 'תאריך השיחה האחרונה מוקדם מתאריך הפנייה הראשונה.';
  }
  if (lead.createdAt && lead.sale?.closedAt && lead.sale.closedAt < lead.createdAt) {
    errors.closedAt = 'תאריך הסגירה מוקדם מתאריך הפנייה הראשונה.';
  }

  return errors;
}

/**
 * @param {Record<string, string>} errors
 * @returns {boolean}
 */
export function isValid(errors) {
  return Object.keys(errors).length === 0;
}

/**
 * Checks one interaction, and the next action recorded alongside it.
 *
 * @param {object} draft
 * @param {string} draft.date
 * @param {string} draft.type
 * @param {string} [draft.nextAction]
 * @param {string} [draft.nextActionDate]
 * @param {string} [draft.customNextAction]
 * @param {import('./model.js').Lead} [lead] Used to catch impossible dates.
 * @returns {Record<string, string>}
 */
export function validateInteraction(draft, lead) {
  /** @type {Record<string, string>} */
  const errors = {};

  if (!draft.date) errors.interactionDate = 'יש להזין תאריך.';
  else if (lead?.createdAt && draft.date < lead.createdAt) {
    errors.interactionDate = 'התאריך מוקדם מתאריך הפנייה הראשונה.';
  }

  if (!draft.type) errors.interactionType = 'יש לבחור סוג אינטראקציה.';

  // Same rule as the lead form: an action needs a date to be findable.
  if (draft.nextAction && !draft.nextActionDate) {
    errors.newNextActionDate = 'יש להזין תאריך לפעולה הבאה.';
  }
  if (draft.nextAction === 'other' && !draft.customNextAction?.trim()) {
    errors.newCustomNextAction = 'יש לפרט מהי הפעולה.';
  }

  return errors;
}
