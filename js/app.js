import { icons } from './icons.js';
import { getCurrentPath, matchRoute, startRouter } from './router.js';
import { renderDashboard } from './views/dashboard.js';
import { mountLeads, renderLeads } from './views/leads.js';
import {
  renderAnalytics,
  renderNewLead,
  renderNotFound,
  renderTasks,
} from './views/placeholders.js';

/**
 * @typedef {Object} Route
 * @property {string} path
 * @property {string} title       Used in the browser tab title.
 * @property {() => string} render
 * @property {(main: HTMLElement) => void} [mount] Runs after the HTML is on the
 *   page. This is where a screen attaches its event listeners.
 * @property {string} [navSection] Which nav item is highlighted on this route.
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
  { path: '/dashboard', title: 'דשבורד', render: renderDashboard, navSection: '/dashboard' },
  { path: '/leads', title: 'לידים', render: renderLeads, mount: mountLeads, navSection: '/leads' },
  { path: '/leads/new', title: 'ליד חדש', render: renderNewLead, navSection: '/leads' },
  { path: '/tasks', title: 'משימות', render: renderTasks, navSection: '/tasks' },
  { path: '/analytics', title: 'אנליטיקס', render: renderAnalytics, navSection: '/analytics' },
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
  const route = matchRoute(ROUTES, path);
  const main = document.getElementById('main');

  try {
    main.innerHTML = route ? route.render() : renderNotFound();
    // Listeners can only be attached once the elements exist on the page.
    route?.mount?.(main);
  } catch (error) {
    console.error(error);
    main.innerHTML = `
      <section class="card placeholder" role="alert">
        <strong>משהו השתבש במסך הזה.</strong>
        <a href="#/dashboard">חזרה לדשבורד</a>
      </section>`;
  }

  renderNav(route?.navSection ?? null);
  document.title = route ? `${route.title} · LeadFlow` : 'LeadFlow';
  window.scrollTo(0, 0);
}

startRouter(render);
