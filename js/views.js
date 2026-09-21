// Screen views. For now each screen is a placeholder; real content is added
// step by step, following the development order in PRACTICE.md.

/**
 * @param {string} title
 * @param {string} subtitle
 * @param {string} comingNext
 */
function placeholderPage(title, subtitle, comingNext) {
  return `
    <header class="page-header">
      <h1 class="page-title">${title}</h1>
      <p class="page-subtitle">${subtitle}</p>
    </header>
    <section class="card placeholder">
      <strong>Coming soon</strong>
      <span>${comingNext}</span>
    </section>
  `;
}

export const renderDashboard = () =>
  placeholderPage(
    'Dashboard',
    'Your business at a glance.',
    'KPI cards, revenue, and follow-up alerts will appear here.'
  );

export const renderLeads = () =>
  placeholderPage(
    'Leads',
    'All your leads in one place.',
    'Search, filters, and the full leads list will appear here.'
  );

export const renderTasks = () =>
  placeholderPage(
    'Tasks',
    'Who to get back to, and when.',
    'Today, overdue, and upcoming follow-ups will appear here.'
  );

export const renderAnalytics = () =>
  placeholderPage(
    'Analytics',
    'Where your leads and clients come from.',
    'Charts by source, conversion rate, and the sales funnel will appear here.'
  );

export const renderNewLead = () =>
  placeholderPage(
    'New Lead',
    'Add a lead in a few seconds.',
    'The new lead form will appear here.'
  );

export const renderNotFound = () => `
  <header class="page-header">
    <h1 class="page-title">Page not found</h1>
    <p class="page-subtitle">This page doesn't exist.</p>
  </header>
  <a class="btn btn-primary" href="#/dashboard">Back to Dashboard</a>
`;
