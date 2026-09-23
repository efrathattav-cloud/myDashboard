import { icons } from './icons.js';
import { getCurrentPath, matchRoute, startRouter } from './router.js';
import { getSyncStatus, loadFromAirtable, watchSync } from './store.js';
import { usingAirtable } from './settings.js';
import { mountDashboard, renderDashboard } from './views/dashboard.js';
import { mountLeadDetail, renderLeadDetail } from './views/lead-detail.js';
import { mountLeadForm, renderLeadForm } from './views/lead-form.js';
import { mountLeads, renderLeads } from './views/leads.js';
import { renderAnalytics } from './views/analytics.js';
import { renderNotFound } from './views/not-found.js';
import { mountSettings, renderSettings } from './views/settings.js';
import { mountTasks, renderTasks } from './views/tasks.js';

/**
 * @typedef {Object} Route
 * @property {string} path
 * @property {string} title       Used in the browser tab title.
 * @property {(params: Record<string, string>) => string} render
 * @property {(screen: HTMLElement, params: Record<string, string>) => void} [mount]
 *   Runs after the HTML is on the page. This is where a screen attaches its
 *   event listeners. The element is created fresh for each render.
 * @property {string} [navSection] Which nav item is highlighted on this route.
 * @property {boolean} [hideFab] Hides the floating "New Lead" button, on
 *   screens where offering it again makes no sense.
 */

/** Main navigation items (Bottom Navigation on mobile, sidebar on desktop). */
const NAV_ITEMS = [
  { path: '/dashboard', label: 'דשבורד', icon: icons.dashboard },
  { path: '/leads', label: 'לידים', icon: icons.leads },
  { path: '/tasks', label: 'משימות', icon: icons.tasks },
  { path: '/analytics', label: 'אנליטיקס', icon: icons.analytics },
];

/** @type {Route[]} */
const ROUTES = [
  { path: '/dashboard', title: 'דשבורד', render: renderDashboard, mount: mountDashboard, navSection: '/dashboard' },
  { path: '/leads', title: 'לידים', render: renderLeads, mount: mountLeads, navSection: '/leads' },
  // A fixed path must come before a pattern with the same number of segments.
  { path: '/leads/new', title: 'ליד חדש', render: renderLeadForm, mount: mountLeadForm, navSection: '/leads', hideFab: true },
  { path: '/leads/:id/edit', title: 'עריכת ליד', render: renderLeadForm, mount: mountLeadForm, navSection: '/leads', hideFab: true },
  { path: '/leads/:id', title: 'כרטיס ליד', render: renderLeadDetail, mount: mountLeadDetail, navSection: '/leads', hideFab: true },
  { path: '/tasks', title: 'משימות', render: renderTasks, mount: mountTasks, navSection: '/tasks' },
  { path: '/analytics', title: 'אנליטיקס', render: renderAnalytics, navSection: '/analytics' },
  { path: '/settings', title: 'הגדרות', render: renderSettings, mount: mountSettings, hideFab: true },
];

function renderNav(activeSection) {
  const links = NAV_ITEMS.map(
    (item) => `
      <a class="nav-link" href="#${item.path}" ${item.path === activeSection ? 'aria-current="page"' : ''}>
        ${item.icon}
        <span>${item.label}</span>
      </a>`
  ).join('');

  document.getElementById('nav').innerHTML = links;
  document.getElementById('bottom-nav').innerHTML = links;
}

function render() {
  const path = getCurrentPath();
  const match = matchRoute(ROUTES, path);
  const route = match?.route ?? null;
  const main = document.getElementById('main');

  try {
    // Every screen gets a brand new element to live in. Any listener a screen
    // attaches to it is thrown away together with the element on the next
    // navigation, so listeners can never pile up.
    const screen = document.createElement('div');
    screen.innerHTML = match ? route.render(match.params) : renderNotFound();
    main.replaceChildren(screen);
    // Listeners can only be attached once the elements exist on the page.
    route?.mount?.(screen, match.params);
  } catch (error) {
    console.error(error);
    main.innerHTML = `
      <section class="card placeholder" role="alert">
        <strong>משהו השתבש במסך הזה.</strong>
        <a href="#/dashboard">חזרה לדשבורד</a>
      </section>`;
  }

  renderNav(route?.navSection ?? null);
  document.querySelector('.app-shell').classList.toggle('no-fab', Boolean(route?.hideFab));
  document.title = route ? `${route.title} · LeadFlow` : 'LeadFlow';
  window.scrollTo(0, 0);
}

/**
 * The one line in the app that shows what the background writing to Airtable
 * is doing. Silent while everything is fine and the leads are local.
 */
function renderSyncStatus() {
  const bar = document.getElementById('sync-status');
  const { source, state, message } = getSyncStatus();

  if (source !== 'airtable' && state !== 'error') {
    bar.hidden = true;
    return;
  }

  const text =
    state === 'saving' ? 'שומר באיירטייבל…'
    : state === 'error' ? `שמירה באיירטייבל נכשלה — ${message}`
    : 'מסונכרן עם איירטייבל';

  bar.className = `sync-status sync-status-${state}`;
  bar.textContent = text;
  bar.hidden = false;
}

watchSync(renderSyncStatus);

/**
 * Starts the app.
 *
 * When Airtable is set up, its leads are fetched before the first screen is
 * drawn, so nothing flashes the browser's copy and then replaces it. If that
 * fetch fails the app carries on with the browser's own leads – a connection
 * problem should not leave someone staring at an empty screen.
 */
async function start() {
  if (usingAirtable()) {
    await loadFromAirtable();
  }
  startRouter(render);
  renderSyncStatus();
}

start();
