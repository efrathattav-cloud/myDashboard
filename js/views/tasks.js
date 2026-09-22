// Screen 5 – Tasks and follow-up (SPEC.en.md section 12).
//
// The one screen that answers "who do I need to get back to right now?".
// Three groups, most urgent first: what is late, what is due today, what is
// coming. Each task names the lead, what to do, when, and how she is doing.
//
// "Done" does not just tick a box. SPEC section 12 says it should also let you
// record what happened and decide what comes next – which is exactly the panel
// already built into the lead card. So the button opens that panel instead of
// repeating it here, and the lead's full context comes with it.

import { formatShortDate, today } from '../dates.js';
import { escapeHtml } from '../html.js';
import { daysSinceLastInteraction, tasksByUrgency } from '../leads.js';
import {
  NEXT_ACTIONS,
  STATUSES,
  TEMPERATURES,
  labelOf,
} from '../model.js';
import { getLeads } from '../store.js';

/**
 * One task.
 *
 * @param {import('../model.js').Lead} lead
 * @param {'overdue' | 'today' | 'upcoming'} group
 * @param {string} now
 */
function taskCard(lead, group, now) {
  const action = labelOf(NEXT_ACTIONS, lead.nextAction, lead.customNextAction);
  const date = formatShortDate(lead.nextActionDate);
  const leadHref = `#/leads/${encodeURIComponent(lead.id)}`;
  const daysLate = group === 'overdue' ? daysSinceLastInteraction(lead, now) : null;

  // The date always says what it means in words, so the group's colour is
  // never the only thing carrying the message (SPEC section 21).
  const when =
    group === 'overdue'
      ? `באיחור · ${date}`
      : group === 'today'
        ? `להיום · ${date}`
        : `בקרוב · ${date}`;

  return `
    <article class="card task-card task-${group}">
      <p class="task-when task-when-${group}">${escapeHtml(when)}</p>
      <h3 class="task-lead">
        <a class="lead-name-link" href="${leadHref}">${escapeHtml(lead.name)}</a>
      </h3>
      <p class="task-action">${escapeHtml(action)}</p>
      <p class="lead-badges">
        <span class="badge badge-status-${escapeHtml(lead.status)}">${escapeHtml(labelOf(STATUSES, lead.status))}</span>
        <span class="badge badge-${escapeHtml(lead.temperature)}">${escapeHtml(labelOf(TEMPERATURES, lead.temperature))}</span>
        ${
          daysLate !== null && daysLate > 5
            ? `<span class="badge badge-medium">ללא מענה ${daysLate} ימים</span>`
            : ''
        }
      </p>
      <p class="task-actions">
        <a class="btn btn-primary" href="${leadHref}?panel=done">
          סימון כבוצע<span class="visually-hidden"> – ${escapeHtml(action)} עבור ${escapeHtml(lead.name)}</span>
        </a>
      </p>
    </article>`;
}

/**
 * One group of tasks, with its heading and count.
 *
 * @param {object} options
 * @param {string} options.id
 * @param {string} options.title
 * @param {import('../model.js').Lead[]} options.leads
 * @param {'overdue' | 'today' | 'upcoming'} options.group
 * @param {string} options.now
 * @param {string} [options.emptyText] When given, the group is shown even when
 *   it is empty, with this message. Otherwise an empty group is left out.
 */
function taskSection({ id, title, leads, group, now, emptyText }) {
  if (leads.length === 0 && !emptyText) return '';

  const body = leads.length
    ? `<div class="task-list">${leads.map((lead) => taskCard(lead, group, now)).join('')}</div>`
    : `<p class="card empty-state">${escapeHtml(emptyText)}</p>`;

  return `
    <section class="dashboard-section" aria-labelledby="${id}-heading">
      <h2 class="section-title" id="${id}-heading">
        ${escapeHtml(title)}${leads.length ? ` (${leads.length})` : ''}
      </h2>
      ${body}
    </section>`;
}

/** @returns {string} */
export function renderTasks() {
  const now = today();
  const { overdue, today: dueToday, upcoming } = tasksByUrgency(getLeads(), now);
  const total = overdue.length + dueToday.length + upcoming.length;

  if (total === 0) {
    return `
      <header class="page-header">
        <h1 class="page-title">משימות</h1>
        <p class="page-subtitle">למי צריך לחזור, ומתי.</p>
      </header>
      <div class="card empty-state">
        <p>הכל מעודכן 🎉 אין פעולות מעקב פתוחות.</p>
        <a class="btn btn-secondary" href="#/leads">מעבר לרשימת הלידים</a>
      </div>`;
  }

  return `
    <header class="page-header">
      <h1 class="page-title">משימות</h1>
      <p class="page-subtitle">
        ${overdue.length ? `${overdue.length} באיחור · ` : ''}${dueToday.length} להיום · ${upcoming.length} בקרוב
      </p>
    </header>

    ${taskSection({ id: 'overdue', title: 'באיחור', leads: overdue, group: 'overdue', now })}
    ${taskSection({
      id: 'today',
      title: 'להיום',
      leads: dueToday,
      group: 'today',
      now,
      emptyText: 'הכל מעודכן 🎉 אין פעולות מעקב להיום.',
    })}
    ${taskSection({ id: 'upcoming', title: 'בקרוב', leads: upcoming, group: 'upcoming', now })}
  `;
}
