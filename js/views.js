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
      <strong>בקרוב</strong>
      <span>${comingNext}</span>
    </section>
  `;
}

export const renderDashboard = () =>
  placeholderPage(
    'דשבורד',
    'תמונת המצב של העסק במבט אחד.',
    'כאן יוצגו כרטיסי KPI, הכנסות והתראות מעקב.'
  );

export const renderLeads = () =>
  placeholderPage(
    'לידים',
    'כל הלידים שלך במקום אחד.',
    'כאן יוצגו חיפוש, סינון ורשימת הלידים המלאה.'
  );

export const renderTasks = () =>
  placeholderPage(
    'משימות',
    'למי צריך לחזור, ומתי.',
    'כאן יוצגו משימות להיום, משימות באיחור ומשימות קרובות.'
  );

export const renderAnalytics = () =>
  placeholderPage(
    'אנליטיקס',
    'מאיפה מגיעים הלידים והלקוחות שלך.',
    'כאן יוצגו גרפים לפי מקור, אחוז המרה ומשפך המכירה.'
  );

export const renderNewLead = () =>
  placeholderPage(
    'ליד חדש',
    'הוספת ליד בכמה שניות.',
    'כאן יוצג טופס הוספת הליד.'
  );

export const renderNotFound = () => `
  <header class="page-header">
    <h1 class="page-title">הדף לא נמצא</h1>
    <p class="page-subtitle">הדף שחיפשת לא קיים.</p>
  </header>
  <a class="btn btn-primary" href="#/dashboard">חזרה לדשבורד</a>
`;
