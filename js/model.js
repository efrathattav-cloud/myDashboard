// The business vocabulary of LeadFlow, in one place.
//
// Each map below does two jobs at once:
//   1. It defines which values are valid (the keys).
//   2. It defines how each value is written in Hebrew (the labels).
//
// Keys are in English because they are stored in the data and never change.
// Labels are in Hebrew because they are what the user reads on screen.
// Screens should never hard-code a Hebrew label – they look it up here.
//
// The shapes of Lead, Interaction and Sale are defined in SPEC.en.md section 14.

/** How the lead first reached the business. */
export const SOURCES = {
  whatsapp: 'וואטסאפ',
  instagram: 'אינסטגרם',
  facebook: 'פייסבוק',
  referral: 'פה לאוזן / המלצה',
  other: 'אחר',
};

/** Where the lead stands in the sales process. */
export const STATUSES = {
  new: 'חדש',
  contacted: 'יצרתי קשר',
  intro_call_scheduled: 'נקבעה שיחת היכרות',
  after_intro_call: 'אחרי שיחת היכרות',
  considering: 'בהתלבטות',
  follow_up: 'במעקב',
  won: 'נסגרה כלקוחה',
  lost: 'לא נסגרה',
};

/**
 * How interested the lead is. Set manually by the business owner.
 * Temperature is not a status: a lead can be "בהתלבטות" and still be "חם".
 */
export const TEMPERATURES = {
  cold: 'קר',
  medium: 'פושר',
  hot: 'חם',
};

/** What the business sells. A lead can be interested in more than one. */
export const PRODUCTS = {
  personal_coaching: 'אימון אישי',
  starting_to_move: 'מתחילות לזוז',
  five_day_challenge: 'אתגר 5 ימים',
};

/** The single next thing to do with this lead. */
export const NEXT_ACTIONS = {
  send_message: 'לשלוח הודעה',
  call: 'להתקשר',
  schedule_intro_call: 'לקבוע שיחת היכרות',
  send_details: 'לשלוח פרטים',
  send_offer: 'לשלוח הצעה',
  follow_up: 'מעקב',
  other: 'אחר',
};

/** How a past conversation happened. */
export const INTERACTION_TYPES = {
  phone: 'שיחת טלפון',
  whatsapp: 'וואטסאפ',
  zoom: 'זום',
  instagram: 'אינסטגרם',
  facebook: 'פייסבוק',
  email: 'אימייל',
  other: 'אחר',
};

/** How a closed client paid. */
export const PAYMENT_METHODS = {
  credit_card: 'כרטיס אשראי',
  bank_transfer: 'העברה בנקאית',
  bit: 'ביט',
  cash: 'מזומן',
  other: 'אחר',
};

/** Why a lead did not become a client. */
export const LOST_REASONS = {
  price_too_high: 'המחיר גבוה מדי',
  not_the_right_time: 'לא הזמן הנכון',
  chose_another: 'בחרה בפתרון / מטפלת אחרת',
  no_response: 'לא חזרה אליי',
  not_a_good_fit: 'לא מתאים לה',
  changed_her_mind: 'שינתה את דעתה',
  other: 'אחר',
};

/** The follow-up situations a lead can be filtered by (SPEC section 7.2). */
export const FOLLOW_UP_FILTERS = {
  today: 'לביצוע היום',
  overdue: 'באיחור',
  none: 'ללא פעולה הבאה',
  stale: 'ללא מענה מעל 5 ימים',
};

/**
 * Statuses of a lead that is still in play.
 * Won and lost leads are finished, so follow-up rules do not apply to them.
 */
export const ACTIVE_STATUSES = Object.keys(STATUSES).filter(
  (status) => status !== 'won' && status !== 'lost'
);

/**
 * Reads the Hebrew label for a stored key.
 * When the key is "other" and free text was typed, the free text wins.
 *
 * @param {Record<string, string>} map One of the maps above.
 * @param {string} [key]
 * @param {string} [customText] Free text typed by the user for "other".
 * @returns {string} The label to show, or '' when there is no value.
 */
export function labelOf(map, key, customText) {
  if (!key) return '';
  if (key === 'other' && customText) return customText;
  return map[key] ?? key;
}

/**
 * Money, the way it is written in the app: ₪8,680.
 * Whole shekels only – the business does not quote agorot.
 *
 * @param {number} [amount]
 * @returns {string} '₪0' when there is no amount.
 */
export function formatCurrency(amount) {
  return `₪${Math.round(amount ?? 0).toLocaleString('he-IL')}`;
}

// ---------- Data shapes ----------
// These @typedef comments give editors autocomplete and catch typos.
// They describe the data; they do not run.

/**
 * @typedef {Object} Interaction
 * @property {string} id
 * @property {string} date                 ISO date, 'YYYY-MM-DD'.
 * @property {keyof INTERACTION_TYPES} type
 * @property {string} [note]
 */

/**
 * @typedef {Object} Sale
 * @property {keyof PRODUCTS} product      What she actually bought.
 * @property {string} closedAt             ISO date the deal closed.
 * @property {number} agreedPrice          The real price. Revenue uses this.
 * @property {boolean} paid
 * @property {keyof PAYMENT_METHODS} [paymentMethod]
 * @property {number} [installments]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Lead
 * @property {string} id
 * @property {string} name
 * @property {string} phone
 * @property {keyof SOURCES} source
 * @property {string} [customSource]       Free text when source is 'other'.
 * @property {Array<keyof PRODUCTS>} products
 * @property {string} [interestReason]     What made her reach out.
 * @property {string} createdAt            ISO date the lead came in.
 * @property {string} [lastInteractionAt]  ISO date of the most recent contact.
 * @property {keyof STATUSES} status
 * @property {keyof TEMPERATURES} temperature
 * @property {number} [offeredPrice]
 * @property {boolean} discountOffered
 * @property {number} [discountAmount]
 * @property {number} [finalOfferedPrice]
 * @property {keyof NEXT_ACTIONS} [nextAction]  Missing means nothing is pending.
 * @property {string} [customNextAction]
 * @property {string} [nextActionDate]     ISO date the next action is due.
 * @property {string} [notes]
 * @property {Interaction[]} interactions
 * @property {Sale} [sale]                 Present only when status is 'won'.
 * @property {keyof LOST_REASONS} [lostReason]  Present only when status is 'lost'.
 * @property {string} [customLostReason]
 */
