import { icons } from './icons.js';
import { getCurrentPath, matchRoute, startRouter } from './router.js';
import {
  renderAnalytics,
  renderDashboard,
  renderLeads,
  renderNewLead,
  renderNotFound,
  renderTasks,
} from './views.js';

/**
 * @typedef {Object} Route
 * @property {string} path
 * @property {string} title       Used in the browser tab title.
 * @property {() => string} render
 * @property {string} [navSection] Which nav item is highlighted on this route.
 */

/** Main navigation items (Bottom Navigation on mobile, sidebar on desktop). */
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
  { path: '/leads', label: 'Leads', icon: icons.leads },
  { path: '/tasks', label: 'Tasks', icon: icons.tasks },
  { path: '/analytics', label: 'Analytics', icon: icons.analytics },
];

/** @type {Route[]} */
const ROUTES = [
  { path: '/dashboard', title: 'Dashboard', render: renderDashboard, navSection: '/dashboard' },
  { path: '/leads', title: 'Leads', render: renderLeads, navSection: '/leads' },
  { path: '/leads/new', title: 'New Lead', render: renderNewLead, navSection: '/leads' },
  { path: '/tasks', title: 'Tasks', render: renderTasks, navSection: '/tasks' },
  { path: '/analytics', title: 'Analytics', render: renderAnalytics, navSection: '/analytics' },
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
  } catch (error) {
    console.error(error);
    main.innerHTML = `
      <section class="card placeholder" role="alert">
        <strong>Something went wrong on this screen.</strong>
        <a href="#/dashboard">Back to Dashboard</a>
      </section>`;
  }

  renderNav(route?.navSection ?? null);
  document.title = route ? `${route.title} · LeadFlow` : 'LeadFlow';
  window.scrollTo(0, 0);
}

startRouter(render);
