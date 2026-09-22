// The numbers behind the Analytics screen (SPEC.en.md section 13).
//
// One rule decides what belongs to the selected period: **a lead belongs to
// the period it came in.** Every figure on the screen follows it – leads,
// clients, revenue, funnel and products – so they always add up against each
// other. Counting leads by arrival and revenue by closing date would mean the
// conversion rate compared two different groups of people.

import { startOfMonth, startOfWeek } from './dates.js';
import { PRODUCTS, SOURCES } from './model.js';

/** The periods offered at the top of the screen (SPEC section 13.1). */
export const PERIODS = {
  week: 'השבוע',
  month: 'החודש',
  quarter: '3 חודשים',
  all: 'הכל',
};

/**
 * The earliest date that still counts as inside a period.
 *
 * @param {string} period One of PERIODS.
 * @returns {string} '' for "all", which means no lower bound.
 */
export function periodStart(period) {
  switch (period) {
    case 'week':
      return startOfWeek();
    case 'quarter':
      return startOfMonth(2);
    case 'all':
      return '';
    case 'month':
    default:
      return startOfMonth(0);
  }
}

/**
 * The leads that came in during a period.
 *
 * @param {import('./model.js').Lead[]} leads
 * @param {string} period
 */
export function leadsInPeriod(leads, period) {
  const from = periodStart(period);
  if (!from) return [...leads];
  return leads.filter((lead) => lead.createdAt >= from);
}

/**
 * Counts leads per source, always listing every source – including the ones
 * with nothing, so a channel that brought nobody is visible rather than
 * missing (SPEC section 13.2).
 *
 * @param {import('./model.js').Lead[]} leads
 * @returns {Array<{key: string, label: string, value: number}>}
 */
export function countBySource(leads) {
  return Object.entries(SOURCES).map(([key, label]) => ({
    key,
    label,
    value: leads.filter((lead) => lead.source === key).length,
  }));
}

/**
 * Counts paying clients per source (SPEC section 13.3), together with how many
 * leads that source brought. The pair is the whole point of this chart: a
 * channel with many enquiries is not the same as a channel with many clients.
 *
 * @param {import('./model.js').Lead[]} leads
 * @returns {Array<{key: string, label: string, value: number, outOf: number}>}
 */
export function clientsBySource(leads) {
  return Object.entries(SOURCES).map(([key, label]) => {
    const fromSource = leads.filter((lead) => lead.source === key);
    return {
      key,
      label,
      value: fromSource.filter((lead) => lead.status === 'won').length,
      outOf: fromSource.length,
    };
  });
}

/**
 * Revenue per source, using the price actually agreed (SPEC section 13.6).
 *
 * @param {import('./model.js').Lead[]} leads
 * @returns {Array<{key: string, label: string, value: number}>}
 */
export function revenueBySource(leads) {
  return Object.entries(SOURCES).map(([key, label]) => ({
    key,
    label,
    value: leads
      .filter((lead) => lead.source === key && lead.status === 'won' && lead.sale)
      .reduce((total, lead) => total + lead.sale.agreedPrice, 0),
  }));
}

/**
 * How many leads showed interest in each product (SPEC section 13.7).
 * A lead interested in two products counts in both, so these do not add up to
 * the number of leads – and the screen says so.
 *
 * @param {import('./model.js').Lead[]} leads
 * @returns {Array<{key: string, label: string, value: number}>}
 */
export function countByProduct(leads) {
  return Object.entries(PRODUCTS).map(([key, label]) => ({
    key,
    label,
    value: leads.filter((lead) => lead.products.includes(key)).length,
  }));
}

/**
 * How far a lead got in the sales process.
 *
 * The app stores only where a lead stands now, not every stage she passed
 * through. So a status of "lost" says nothing about how far she got. Two
 * pieces of evidence fill that gap:
 *   - a price was offered  -> she reached the offer stage
 *   - she reached the offer stage, or her status is at least "intro call
 *     scheduled" -> she reached the intro call
 *
 * That way a lead who was quoted a price and then said no still counts in the
 * stages she really passed, instead of dropping out at the first one.
 */
const STATUS_RANK = {
  new: 0,
  contacted: 1,
  intro_call_scheduled: 2,
  after_intro_call: 3,
  considering: 4,
  follow_up: 4,
  won: 5,
  lost: 0,
};

/**
 * The sales funnel (SPEC section 13.5).
 *
 * @param {import('./model.js').Lead[]} leads
 * @returns {Array<{key: string, label: string, value: number}>}
 */
export function funnelStages(leads) {
  const reachedOffer = (lead) =>
    lead.offeredPrice != null || STATUS_RANK[lead.status] >= 4;
  const reachedIntro = (lead) =>
    reachedOffer(lead) || STATUS_RANK[lead.status] >= 2;

  return [
    { key: 'leads', label: 'לידים', value: leads.length },
    { key: 'intro', label: 'הגיעו לשיחת היכרות', value: leads.filter(reachedIntro).length },
    { key: 'offer', label: 'קיבלו הצעה / בהתלבטות', value: leads.filter(reachedOffer).length },
    { key: 'clients', label: 'הפכו ללקוחות', value: leads.filter((lead) => lead.status === 'won').length },
  ];
}
