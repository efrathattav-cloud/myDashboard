// Screen 2 – Leads (SPEC.en.md section 7).
//
// The search text and the five filters live in the address bar, as
// "#/leads?source=instagram&followup=overdue". That means a filtered view
// survives a refresh, can be linked to from the Dashboard, and the browser's
// back button undoes a filter.
//
// Typing does not redraw the whole screen. Only the list and the result count
// are replaced, so the search field keeps focus and the cursor stays put.

import { today } from '../dates.js';
import { escapeHtml } from '../html.js';
import { countActiveFilters, filterLeads, sortLeadsForList } from '../leads.js';
import {
  FOLLOW_UP_FILTERS,
  PRODUCTS,
  SOURCES,
  STATUSES,
  TEMPERATURES,
} from '../model.js';
import { getCurrentQuery, replaceQuery } from '../router.js';
import { getLeads } from '../store.js';
import { renderLeadCard } from './lead-card.js';

const PATH = '/leads';

/** Which URL parameter holds which filter. */
const FILTER_PARAMS = {
  source: 'source',
  status: 'status',
  temperature: 'temperature',
  product: 'product',
  followUp: 'followup',
};

/**
 * Reads the current filters out of the address bar.
 *
 * @returns {import('../leads.js').LeadFilters}
 */
function readFilters() {
  const query = getCurrentQuery();
  const filters = { query: query.get('q') ?? '' };
  for (const [name, param] of Object.entries(FILTER_PARAMS)) {
    filters[name] = query.get(param) ?? '';
  }
  return filters;
}

/**
 * Writes the filters back to the address bar, leaving out the empty ones so
 * the URL stays short and readable.
 *
 * @param {import('../leads.js').LeadFilters} filters
 */
function writeFilters(filters) {
  const query = new URLSearchParams();
  if (filters.query.trim()) query.set('q', filters.query.trim());
  for (const [name, param] of Object.entries(FILTER_PARAMS)) {
    if (filters[name]) query.set(param, filters[name]);
  }
  replaceQuery(PATH, query);
}

/**
 * A labelled dropdown built from one of the model maps.
 *
 * @param {string} name       Matches a key of FILTER_PARAMS.
 * @param {string} label      Visible label (SPEC section 21: never a placeholder only).
 * @param {Record<string, string>} options
 * @param {string} selected
 * @param {string} anyLabel   Text for "no filter".
 */
function filterSelect(name, label, options, selected, anyLabel) {
  const choices = Object.entries(options)
    .map(
      ([value, text]) =>
        `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(text)}</option>`
    )
    .join('');

  return `
    <p class="field">
      <label class="field-label" for="filter-${name}">${escapeHtml(label)}</label>
      <select class="field-input" id="filter-${name}" data-filter="${name}">
        <option value=""${selected ? '' : ' selected'}>${escapeHtml(anyLabel)}</option>
        ${choices}
      </select>
    </p>`;
}

/**
 * The list itself plus its result count. Re-rendered on its own as the user
 * types, which is why it is separate from the rest of the screen.
 *
 * @param {import('../leads.js').LeadFilters} filters
 */
function renderResults(filters) {
  const all = getLeads();
  const now = today();
  const matches = sortLeadsForList(filterLeads(all, filters, now), now);

  if (all.length === 0) {
    return {
      count: '',
      list: `
        <div class="card empty-state">
          <p>עדיין אין לידים. הוסיפי את הליד הראשון שלך.</p>
          <a class="btn btn-primary" href="#/leads/new">+ הוספת ליד</a>
        </div>`,
    };
  }

  if (matches.length === 0) {
    return {
      count: 'אין תוצאות',
      list: `
        <div class="card empty-state">
          <p>לא נמצאו לידים שמתאימים לחיפוש או לסינון.</p>
          <button class="btn btn-secondary" type="button" data-action="clear-filters">
            ניקוי החיפוש והסינון
          </button>
        </div>`,
    };
  }

  const count =
    matches.length === all.length
      ? `${all.length} לידים`
      : `${matches.length} מתוך ${all.length} לידים`;

  return {
    count,
    list: matches.map((lead) => renderLeadCard(lead, now)).join(''),
  };
}

/** @returns {string} */
export function renderLeads() {
  const filters = readFilters();
  const active = countActiveFilters(filters);
  const { count, list } = renderResults(filters);

  return `
    <header class="page-header">
      <h1 class="page-title">לידים</h1>
      <p class="page-subtitle">כל הלידים שלך במקום אחד.</p>
    </header>

    <section class="filters" aria-label="חיפוש וסינון">
      <p class="field">
        <label class="field-label" for="lead-search">חיפוש</label>
        <input
          class="field-input"
          id="lead-search"
          type="search"
          inputmode="search"
          placeholder="שם, טלפון או הערה"
          value="${escapeHtml(filters.query)}"
        >
      </p>

      <details class="filter-panel"${active ? ' open' : ''}>
        <summary class="filter-summary">
          סינון${active ? ` (${active})` : ''}
        </summary>
        <div class="filter-fields">
          ${filterSelect('source', 'מקור', SOURCES, filters.source, 'כל המקורות')}
          ${filterSelect('status', 'סטטוס', STATUSES, filters.status, 'כל הסטטוסים')}
          ${filterSelect('temperature', 'רמת חום', TEMPERATURES, filters.temperature, 'כל הרמות')}
          ${filterSelect('product', 'מוצר', PRODUCTS, filters.product, 'כל המוצרים')}
          ${filterSelect('followUp', 'מעקב', FOLLOW_UP_FILTERS, filters.followUp, 'הכל')}
        </div>
        <button class="btn btn-secondary filter-clear" type="button" data-action="clear-filters">
          ניקוי הסינון
        </button>
      </details>
    </section>

    <p class="result-count" id="result-count" aria-live="polite">${escapeHtml(count)}</p>
    <div class="lead-list" id="lead-list">${list}</div>
  `;
}

/**
 * Attaches the screen's behaviour after its HTML is on the page.
 *
 * @param {HTMLElement} main
 */
export function mountLeads(main) {
  const search = main.querySelector('#lead-search');
  const listElement = main.querySelector('#lead-list');
  const countElement = main.querySelector('#result-count');

  /** Redraws only the results, and keeps the address bar in step. */
  function refresh() {
    const filters = readFiltersFromControls();
    writeFilters(filters);
    const { count, list } = renderResults(filters);
    countElement.textContent = count;
    listElement.innerHTML = list;
  }

  /** @returns {import('../leads.js').LeadFilters} */
  function readFiltersFromControls() {
    const filters = { query: search.value };
    for (const name of Object.keys(FILTER_PARAMS)) {
      filters[name] = main.querySelector(`[data-filter="${name}"]`)?.value ?? '';
    }
    return filters;
  }

  search.addEventListener('input', refresh);
  for (const select of main.querySelectorAll('[data-filter]')) {
    select.addEventListener('change', refresh);
  }

  // The clear button also appears inside the "no results" card, which is
  // redrawn on every keystroke. Listening on `main` keeps working after the
  // button has been replaced.
  main.addEventListener('click', (event) => {
    if (!event.target.closest('[data-action="clear-filters"]')) return;
    search.value = '';
    for (const select of main.querySelectorAll('[data-filter]')) select.value = '';
    refresh();
    search.focus();
  });
}
