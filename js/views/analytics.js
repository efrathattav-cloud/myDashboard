// Screen 6 – Analytics (SPEC.en.md section 13).
//
// Not a BI tool: a handful of figures that answer the third question in
// SPEC section 25 – where do the clients who actually buy come from?
//
// The conversion rate is a single number, so it is shown as one, not as a
// chart. Everything else is a comparison across a few named categories, which
// is what the bar charts are for.

import {
  PERIODS,
  clientsBySource,
  countByProduct,
  countBySource,
  funnelStages,
  leadsInPeriod,
  revenueBySource,
} from '../analytics.js';
import { escapeHtml } from '../html.js';
import { conversionRate, wonLeads } from '../leads.js';
import { formatCurrency } from '../model.js';
import { getCurrentQuery } from '../router.js';
import { getLeads } from '../store.js';
import { barChart } from './bar-chart.js';

const PATH = '/analytics';

/** The period currently chosen, defaulting to this month (SPEC section 13.1). */
function currentPeriod() {
  const asked = getCurrentQuery().get('period');
  return asked && asked in PERIODS ? asked : 'month';
}

/**
 * The period buttons. Links rather than a dropdown, so each period has its own
 * address and the browser's back button steps between them.
 *
 * @param {string} active
 */
function periodFilter(active) {
  const buttons = Object.entries(PERIODS)
    .map(
      ([key, label]) => `
        <a class="period-option" href="#${PATH}?period=${escapeHtml(key)}"
           ${key === active ? 'aria-current="true"' : ''}>${escapeHtml(label)}</a>`
    )
    .join('');

  return `
    <nav class="period-filter" aria-label="תקופה">
      ${buttons}
    </nav>`;
}

/** @returns {string} */
export function renderAnalytics() {
  const period = currentPeriod();
  const leads = leadsInPeriod(getLeads(), period);
  const clients = wonLeads(leads);
  const rate = conversionRate(leads);
  const revenue = clients.reduce((total, lead) => total + lead.sale.agreedPrice, 0);

  const header = `
    <header class="page-header">
      <h1 class="page-title">אנליטיקס</h1>
      <p class="page-subtitle">מאיפה מגיעים הלידים, ומאיפה מגיעות הלקוחות.</p>
    </header>
    ${periodFilter(period)}`;

  if (leads.length === 0) {
    return `
      ${header}
      <div class="card empty-state">
        <p>לא נוספו לידים בתקופה שנבחרה.</p>
        <a class="btn btn-secondary" href="#${PATH}?period=all">הצגת כל התקופות</a>
      </div>`;
  }

  return `
    ${header}

    <section class="card headline-card" aria-labelledby="rate-heading">
      <p class="headline-label" id="rate-heading">אחוז המרה מליד ללקוחה</p>
      <p class="headline-value">${rate}%</p>
      <p class="headline-note">
        ${clients.length} מתוך ${leads.length} ${leads.length === 1 ? 'ליד' : 'לידים'} ${clients.length === 1 ? 'הפכה ללקוחה' : 'הפכו ללקוחות'} · ${escapeHtml(formatCurrency(revenue))} הכנסות
      </p>
    </section>

    ${barChart({
      id: 'funnel',
      title: 'משפך המכירה',
      rows: funnelStages(leads),
      hint: 'כמה לידים הגיעו לכל שלב בדרך ללקוחה.',
    })}

    ${barChart({
      id: 'by-source',
      title: 'לידים לפי מקור',
      rows: countBySource(leads),
      hint: 'מאיפה הגיעו הפניות.',
    })}

    ${barChart({
      id: 'clients-by-source',
      title: 'לקוחות לפי מקור',
      rows: clientsBySource(leads).map((row) => ({
        ...row,
        note: row.outOf
          ? `${row.value} מתוך ${row.outOf} ${row.outOf === 1 ? 'ליד' : 'לידים'}`
          : 'לא הגיעו לידים ממקור זה',
      })),
      hint: 'מקור שמביא הרבה פניות הוא לא בהכרח המקור שמביא לקוחות משלמות.',
      emptyText: 'עדיין לא נסגרו לקוחות בתקופה שנבחרה.',
    })}

    ${barChart({
      id: 'revenue-by-source',
      title: 'הכנסות לפי מקור',
      rows: revenueBySource(leads).map((row) => ({
        ...row,
        text: formatCurrency(row.value),
      })),
      hint: 'לפי המחיר שסוכם בפועל.',
      emptyText: 'עדיין לא נרשמו הכנסות בתקופה שנבחרה.',
    })}

    ${barChart({
      id: 'by-product',
      title: 'עניין לפי מוצר',
      rows: countByProduct(leads),
      hint: 'לידה שהתעניינה בשני מוצרים נספרת בשניהם, ולכן הסכום גדול ממספר הלידים.',
    })}
  `;
}
