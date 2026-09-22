// Screen 1 – the Dashboard (SPEC.en.md section 6).
//
// Order on the screen follows the SPEC: the business picture first, follow-up
// second. Everything shown here is calculated in leads.js, never inline.

import { currentMonth, formatMonth, previousMonth, today } from '../dates.js';
import { icons } from '../icons.js';
import { escapeHtml } from '../html.js';
import {
  attentionSummary,
  createdInMonth,
  hotLeads,
  recentLeads,
  revenueInMonth,
  wonLeads,
} from '../leads.js';
import { formatCurrency } from '../model.js';
import { getLeads } from '../store.js';
import { renderLeadCard } from './lead-card.js';

/**
 * One KPI card.
 *
 * @param {string} label
 * @param {string | number} value
 * @param {string} [comparison] Optional line comparing to the previous period.
 */
function kpiCard(label, value, comparison = '') {
  return `
    <article class="card kpi">
      <p class="kpi-label">${escapeHtml(label)}</p>
      <p class="kpi-value">${escapeHtml(String(value))}</p>
      ${comparison ? `<p class="kpi-comparison">${escapeHtml(comparison)}</p>` : ''}
    </article>`;
}

/**
 * Describes a change against the previous month in words.
 * Written out rather than shown as a coloured arrow, so it reads the same
 * without colour (SPEC section 21).
 *
 * @param {number} current
 * @param {number} previous
 * @param {string} unit What is being counted, e.g. 'לידים'.
 */
function comparisonText(current, previous, unit) {
  const difference = current - previous;
  if (previous === 0 && current === 0) return 'גם בחודש שעבר לא היו';
  if (difference === 0) return `כמו בחודש שעבר (${previous})`;
  if (difference > 0) return `${difference}+ ${unit} לעומת החודש שעבר`;
  return `${Math.abs(difference)}− ${unit} לעומת החודש שעבר`;
}

/**
 * One row in the "needs attention" section.
 * Rendered only when the count is above zero.
 *
 * @param {number} count
 * @param {string} text
 * @param {string} href Where clicking the alert goes.
 * @param {string} variant
 */
function alertRow(count, text, href, variant) {
  if (count === 0) return '';
  return `
    <a class="alert-row alert-${variant}" href="${href}">
      <span class="alert-count">${count}</span>
      <span class="alert-text">${escapeHtml(text)}</span>
      <span class="alert-chevron">${icons.chevronForward}</span>
    </a>`;
}

/**
 * The "needs attention" section (SPEC section 6.3).
 *
 * @param {import('../model.js').Lead[]} leads
 * @param {string} now
 */
function attentionSection(leads, now) {
  const { overdue, dueToday, stale } = attentionSummary(leads, now);

  if (overdue + dueToday + stale === 0) {
    return `
      <section class="dashboard-section" aria-labelledby="attention-heading">
        <h2 class="section-title" id="attention-heading">דורש תשומת לב</h2>
        <p class="card empty-state">הכל מעודכן 🎉 אין לידים שממתינים לך כרגע.</p>
      </section>`;
  }

  return `
    <section class="dashboard-section" aria-labelledby="attention-heading">
      <h2 class="section-title" id="attention-heading">דורש תשומת לב</h2>
      <div class="alert-list">
        ${alertRow(overdue, overdue === 1 ? 'פעולת מעקב באיחור' : 'פעולות מעקב באיחור', '#/tasks', 'danger')}
        ${alertRow(dueToday, dueToday === 1 ? 'פעולת מעקב להיום' : 'פעולות מעקב להיום', '#/tasks', 'today')}
        ${alertRow(stale, stale === 1 ? 'לידה שלא קיבלה מענה מעל 5 ימים' : 'לידים שלא קיבלו מענה מעל 5 ימים', '#/leads?followup=stale', 'warning')}
      </div>
    </section>`;
}

/**
 * The recent leads list (SPEC section 6.4).
 *
 * @param {import('../model.js').Lead[]} leads
 * @param {string} now
 */
function recentSection(leads, now) {
  if (leads.length === 0) {
    return `
      <section class="dashboard-section" aria-labelledby="recent-heading">
        <h2 class="section-title" id="recent-heading">לידים אחרונים</h2>
        <div class="card empty-state">
          <p>עדיין אין לידים. הוסיפי את הליד הראשון שלך.</p>
          <a class="btn btn-primary" href="#/leads/new">+ הוספת ליד</a>
        </div>
      </section>`;
  }

  const cards = recentLeads(leads, 5)
    .map((lead) => renderLeadCard(lead, now))
    .join('');

  return `
    <section class="dashboard-section" aria-labelledby="recent-heading">
      <div class="section-header">
        <h2 class="section-title" id="recent-heading">לידים אחרונים</h2>
        <a class="section-link" href="#/leads">לכל הלידים</a>
      </div>
      <div class="lead-list">${cards}</div>
    </section>`;
}

/** @returns {string} */
export function renderDashboard() {
  const leads = getLeads();
  const now = today();
  const thisMonth = currentMonth();
  const lastMonth = previousMonth(thisMonth);

  const newThisMonth = createdInMonth(leads, thisMonth).length;
  const newLastMonth = createdInMonth(leads, lastMonth).length;
  const revenueThisMonth = revenueInMonth(leads, thisMonth);
  const revenueLastMonth = revenueInMonth(leads, lastMonth);

  const revenueComparison =
    revenueLastMonth === 0
      ? 'בחודש שעבר לא נרשמו הכנסות'
      : `לעומת ${formatCurrency(revenueLastMonth)} בחודש שעבר`;

  return `
    <header class="page-header">
      <h1 class="page-title">דשבורד</h1>
      <p class="page-subtitle">תמונת המצב של העסק · ${escapeHtml(formatMonth(thisMonth))}</p>
    </header>

    <section class="kpi-grid" aria-label="מדדים מרכזיים">
      ${kpiCard('סה״כ לידים', leads.length)}
      ${kpiCard('לידים חדשים החודש', newThisMonth, comparisonText(newThisMonth, newLastMonth, 'לידים'))}
      ${kpiCard('לידים חמים', hotLeads(leads).length)}
      ${kpiCard('לקוחות שנסגרו', wonLeads(leads).length)}
    </section>

    <section class="card revenue-card" aria-labelledby="revenue-heading">
      <p class="revenue-label" id="revenue-heading">הכנסות מלידים שנסגרו החודש</p>
      <p class="revenue-value">${escapeHtml(formatCurrency(revenueThisMonth))}</p>
      <p class="revenue-comparison">${escapeHtml(revenueComparison)}</p>
    </section>

    ${attentionSection(leads, now)}
    ${recentSection(leads, now)}
  `;
}
