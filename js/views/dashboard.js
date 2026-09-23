// Screen 1 – the Dashboard (SPEC.en.md section 6).
//
// Order on the screen follows the SPEC: the business picture first, follow-up
// second. Everything shown here is calculated in leads.js, never inline.

import { currentMonth, formatMonth, formatShortDate, previousMonth, today } from '../dates.js';
import { icons } from '../icons.js';
import { escapeHtml } from '../html.js';
import {
  activeBreakdown,
  attentionSummary,
  isOverdue,
  clientsWonInMonth,
  createdInMonth,
  hotLeads,
  mostUrgent,
  recentLeads,
  revenueInMonth,
  sourcesByClients,
  wonLeads,
} from '../leads.js';
import { NEXT_ACTIONS, SOURCES, formatCurrency, labelOf } from '../model.js';
import {
  downloadCsv,
  exportFilename,
  interactionsToCsv,
  leadsToCsv,
} from '../export.js';
import { getLeads, isPersistent, resetDemoData } from '../store.js';
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
 *
 * Written out rather than shown as a coloured arrow, so it reads the same
 * without colour (SPEC section 21). It never repeats the figure printed above
 * it – the card already says that.
 *
 * @param {number} current
 * @param {number} previous
 */
function comparisonText(current, previous) {
  const difference = current - previous;
  if (previous === 0 && current === 0) return 'גם בחודש שעבר לא היו';
  if (difference === 0) return `כמו בחודש שעבר (${previous})`;
  if (difference > 0) return `${difference}+ לעומת החודש שעבר`;
  return `${Math.abs(difference)}− לעומת החודש שעבר`;
}

/**
 * The line under "clients closed".
 *
 * The number on that card counts every client ever, so the line below has to
 * say plainly that its own number is about this month – otherwise the two
 * read as the same figure twice, which is exactly what they are not.
 *
 * @param {number} thisMonth
 * @param {number} lastMonth
 */
function clientsThisMonthText(thisMonth, lastMonth) {
  if (thisMonth === 0) return 'אף לקוחה לא נסגרה החודש';
  const closed = `${thisMonth} ${thisMonth === 1 ? 'נסגרה' : 'נסגרו'} החודש`;
  if (lastMonth === 0) return `${closed} · אף אחת בחודש שעבר`;
  return `${closed} · ${lastMonth} בחודש שעבר`;
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
 * One lead that needs getting back to, named, with the action waiting and a
 * way to deal with it.
 *
 * The counts above answer "how many". This answers "who" – which is the
 * second of the three questions the whole app exists for (SPEC section 25),
 * and it used to take a tap to find out.
 *
 * @param {import('../model.js').Lead} lead
 * @param {string} now
 */
function urgentRow(lead, now) {
  const action = labelOf(NEXT_ACTIONS, lead.nextAction, lead.customNextAction);
  const late = isOverdue(lead, now);
  const href = `#/leads/${encodeURIComponent(lead.id)}`;

  return `
    <li class="urgent-row">
      <span class="urgent-when urgent-when-${late ? 'overdue' : 'today'}">
        ${escapeHtml(late ? `באיחור · ${formatShortDate(lead.nextActionDate)}` : 'להיום')}
      </span>
      <a class="urgent-name" href="${href}">${escapeHtml(lead.name)}</a>
      <span class="urgent-action">${escapeHtml(action)}</span>
      <a class="btn btn-secondary urgent-done" href="${href}?panel=done">
        בוצע<span class="visually-hidden"> – ${escapeHtml(action)} עבור ${escapeHtml(lead.name)}</span>
      </a>
    </li>`;
}

/**
 * The "needs attention" section (SPEC section 6.3).
 *
 * @param {import('../model.js').Lead[]} leads
 * @param {string} now
 */
function attentionSection(leads, now) {
  const { overdue, dueToday, stale } = attentionSummary(leads, now);
  const urgent = mostUrgent(leads, 3, now);
  const waiting = overdue + dueToday;

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

      ${
        urgent.length
          ? `<ul class="urgent-list">
               ${urgent.map((lead) => urgentRow(lead, now)).join('')}
             </ul>
             ${
               waiting > urgent.length
                 ? `<p class="urgent-more">
                      <a class="section-link" href="#/tasks">ועוד ${waiting - urgent.length} במסך המשימות</a>
                    </p>`
                 : ''
             }`
          : ''
      }
    </section>`;
}

/**
 * Where the paying clients actually come from (SPEC section 25, question 3).
 *
 * A source that brings many enquiries is not the same as one that brings
 * clients, so each line says both: how many clients, out of how many leads.
 * Sources that brought nobody are left out – this list is about what works.
 *
 * @param {import('../model.js').Lead[]} leads
 */
function sourcesSection(leads) {
  const sources = sourcesByClients(leads).slice(0, 3);

  if (sources.length === 0) {
    return `
      <section class="dashboard-section" aria-labelledby="sources-heading">
        <h2 class="section-title" id="sources-heading">מאיפה מגיעות הלקוחות</h2>
        <p class="card empty-state">עדיין לא נסגרו לקוחות, אז אין מה להשוות.</p>
      </section>`;
  }

  return `
    <section class="dashboard-section" aria-labelledby="sources-heading">
      <div class="section-header">
        <h2 class="section-title" id="sources-heading">מאיפה מגיעות הלקוחות</h2>
        <a class="section-link" href="#/analytics?period=all">לכל הנתונים</a>
      </div>
      <ul class="source-list card">
        ${sources
          .map(
            (entry) => `
              <li class="source-row">
                <span class="source-name">${escapeHtml(labelOf(SOURCES, entry.source))}</span>
                <span class="source-clients">${entry.clients} ${entry.clients === 1 ? 'לקוחה' : 'לקוחות'}</span>
                <span class="source-rate">${entry.clients} מתוך ${entry.leads} ${entry.leads === 1 ? 'ליד' : 'לידים'} · ${entry.rate}%</span>
              </li>`
          )
          .join('')}
      </ul>
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
  const { active, closed } = activeBreakdown(leads);
  const hot = hotLeads(leads);
  const hotActive = hot.filter((lead) => lead.status !== 'won' && lead.status !== 'lost').length;
  const clients = wonLeads(leads);
  const clientsThisMonth = clientsWonInMonth(leads, thisMonth).length;
  const clientsLastMonth = clientsWonInMonth(leads, lastMonth).length;
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
      ${kpiCard('סה״כ לידים', leads.length, `${active} עדיין פתוחים · ${closed} סגורים`)}
      ${kpiCard('לידים חדשים החודש', newThisMonth, comparisonText(newThisMonth, newLastMonth))}
      ${kpiCard('לידים חמים', hot.length, hotActive === hot.length ? `מתוך ${active} לידים פתוחים` : `${hotActive} מהם עדיין פתוחים`)}
      ${kpiCard('לקוחות שנסגרו', clients.length, clientsThisMonthText(clientsThisMonth, clientsLastMonth))}
    </section>

    <section class="card revenue-card" aria-labelledby="revenue-heading">
      <p class="revenue-label" id="revenue-heading">הכנסות מלידים שנסגרו החודש</p>
      <p class="revenue-value">${escapeHtml(formatCurrency(revenueThisMonth))}</p>
      <p class="revenue-comparison">${escapeHtml(revenueComparison)}</p>
    </section>

    ${attentionSection(leads, now)}
    ${sourcesSection(leads)}
    ${recentSection(leads, now)}

    <section class="demo-zone" aria-labelledby="export-heading">
      <h2 class="section-title" id="export-heading">ייצוא הנתונים</h2>
      <p class="field-hint">
        קובצי CSV לייבוא לאיירטייבל, לגיליון אלקטרוני או לכל כלי אחר.
        שני קבצים, כי לכל ליד יש כמה שיחות ושורה אחת לא יכולה להכיל את כולן.
        הקבצים נוצרים במחשב שלך ולא נשלחים לשום מקום.
      </p>
      <div class="export-buttons">
        <button class="btn btn-secondary" type="button" data-action="export-leads">
          הורדת הלידים (${leads.length})
        </button>
        <button class="btn btn-secondary" type="button" data-action="export-interactions">
          הורדת האינטראקציות (${leads.reduce((sum, lead) => sum + lead.interactions.length, 0)})
        </button>
      </div>
    </section>

    <section class="demo-zone" aria-labelledby="demo-heading">
      <h2 class="section-title" id="demo-heading">נתוני הדגמה</h2>
      <p class="field-hint">
        ${
          isPersistent()
            ? 'זו גרסת הדגמה עם נתונים בדיוניים. השינויים שלך נשמרים בדפדפן הזה בלבד.'
            : 'הדפדפן חוסם שמירה מקומית, ולכן שינויים ייעלמו ברענון. בחלון פרטי זה מצב רגיל.'
        }
      </p>
      <div class="export-buttons">
        <button class="btn btn-secondary" type="button" data-action="ask-reset">
          איפוס נתוני ההדגמה
        </button>
        <a class="btn btn-secondary" href="#/settings">הגדרות ומקור נתונים</a>
      </div>
      <div class="delete-confirm" data-role="reset-confirm" hidden>
        <p class="delete-question">
          לאפס את כל הנתונים? כל הלידים שהוספת או ערכת יימחקו, והנתונים הבדיוניים יחזרו למצבם ההתחלתי.
        </p>
        <div class="form-actions">
          <button class="btn btn-danger" type="button" data-action="confirm-reset">כן, לאפס</button>
          <button class="btn btn-secondary" type="button" data-action="cancel-reset">ביטול</button>
        </div>
      </div>
    </section>
  `;
}

/**
 * @param {HTMLElement} screen The element holding this screen's HTML.
 */
export function mountDashboard(screen) {
  const confirmBox = screen.querySelector('[data-role="reset-confirm"]');

  screen.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'export-leads') {
      const leads = getLeads();
      downloadCsv(exportFilename('leads', today()), leadsToCsv(leads));
    } else if (action === 'export-interactions') {
      const leads = getLeads();
      downloadCsv(exportFilename('interactions', today()), interactionsToCsv(leads));
    } else if (action === 'ask-reset') {
      confirmBox.hidden = false;
      confirmBox.querySelector('[data-action="confirm-reset"]').focus();
    } else if (action === 'cancel-reset') {
      confirmBox.hidden = true;
      screen.querySelector('[data-action="ask-reset"]').focus();
    } else if (action === 'confirm-reset') {
      resetDemoData();
      // The hash does not change, so redraw this screen in a fresh element.
      const dashboard = document.createElement('div');
      dashboard.innerHTML = renderDashboard();
      screen.replaceWith(dashboard);
      mountDashboard(dashboard);
      window.scrollTo(0, 0);
    }
  });
}
