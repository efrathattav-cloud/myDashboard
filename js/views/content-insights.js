// Screen 8 – what works in content.
//
// What kind of Instagram content gets a response from women like the ones
// this business serves, judged by ten coaches who speak to the same audience.
//
// The figures come from data/content-insights.json, which is built offline
// (scripts/collect_instagram.py, then scripts/build_content_insights.py). The
// page only reads that summary: no token, no call to Apify, and no commenter's
// name ever reaches the browser.
//
// Like the marketing calendar, render() draws the frame and mount() fetches
// and fills it in.

import { escapeHtml } from '../html.js';
import { barChart } from './bar-chart.js';

const DATA_URL = 'data/content-insights.json';

/** @param {number} value */
const number = (value) => value.toLocaleString('he-IL');

/** @param {string} iso */
function formatCollected(iso) {
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function kpiCard(label, value, comparison) {
  return `
    <article class="card kpi">
      <p class="kpi-label">${escapeHtml(label)}</p>
      <p class="kpi-value">${escapeHtml(String(value))}</p>
      <p class="kpi-comparison">${escapeHtml(comparison)}</p>
    </article>`;
}

/**
 * One viral post can carry a whole topic's average, so every bar also says
 * how many posts it stands on and what the middle one got.
 */
function engagementRows(rows) {
  return rows.map((row) => ({
    label: row.label,
    value: row.average,
    text: number(row.average),
    note: `${row.posts} פוסטים · חציון ${number(row.median)}`,
  }));
}

function topPostsSection(posts) {
  return `
    <section class="dashboard-section" aria-labelledby="top-posts-heading">
      <h2 class="section-title" id="top-posts-heading">10 הפוסטים עם המעורבות הגבוהה ביותר</h2>
      <ol class="calendar-list content-top">
        ${posts
          .map(
            (post) => `
              <li class="calendar-row content-post">
                <span class="content-post-score">${escapeHtml(number(post.engagement))}</span>
                <span class="calendar-title">${escapeHtml(post.summary)}</span>
                <span class="calendar-tag">
                  ${escapeHtml(`${post.topic} · ${post.format} · @${post.account}`)}
                  · <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener">לפוסט<span class="visually-hidden"> (נפתח בחלון חדש)</span></a>
                </span>
              </li>`
          )
          .join('')}
      </ol>
    </section>`;
}

function phrasesSection(phrases, commentsRead) {
  return `
    <section class="card detail-card" aria-labelledby="phrases-heading">
      <h2 class="section-title" id="phrases-heading">המילים שלהן</h2>
      <p class="chart-hint">${escapeHtml(`ביטויים שחוזרים ב־${commentsRead} תגובות, בניסוח כללי ובלי פרטים של המגיבות.`)}</p>
      <ul class="content-phrases">
        ${phrases
          .map(
            (phrase) => `
              <li class="content-phrase">
                <span class="content-phrase-text">״${escapeHtml(phrase.text)}״</span>
                <span class="content-phrase-context">${escapeHtml(phrase.context)}</span>
              </li>`
          )
          .join('')}
      </ul>
    </section>`;
}

function insightsSection(insights) {
  return `
    <section class="dashboard-section" aria-labelledby="insights-heading">
      <h2 class="section-title" id="insights-heading">תובנות לתוכן שלי</h2>
      <ol class="content-insights">
        ${insights
          .map(
            (insight) => `
              <li class="card content-insight">
                <h3 class="content-insight-title">${escapeHtml(insight.title)}</h3>
                <p>${escapeHtml(insight.body)}</p>
              </li>`
          )
          .join('')}
      </ol>
    </section>`;
}

function renderData(data) {
  const { totals } = data;
  const leadingTopic = data.byTopic[0];
  const leadingFormat = data.byFormat[0];

  return `
    <section class="kpi-grid" aria-label="מדדים מרכזיים">
      ${kpiCard('פוסטים שנותחו', number(totals.posts), `${totals.withHiddenLikes} מהם עם לייקים מוסתרים`)}
      ${kpiCard('חשבונות', totals.accounts, 'מאמנות ומטפלות לקהל דומה')}
      ${kpiCard('הנושא המוביל', leadingTopic.label, `ממוצע ${number(leadingTopic.average)} · הכי נפוץ: ${data.mostCommonTopic}`)}
      ${kpiCard('הפורמט המוביל', leadingFormat.label, `ממוצע ${number(leadingFormat.average)} לפוסט`)}
    </section>

    ${insightsSection(data.insights)}

      ${barChart({
        id: 'by-topic',
        title: 'ממוצע מעורבות לפי נושא',
        hint: 'לייקים + תגובות לפוסט. פוסטים אישיים שלא בנושא, ופוסטים עם לייקים מוסתרים, לא נכללים.',
        rows: engagementRows(data.byTopic),
      })}
      ${barChart({
        id: 'by-format',
        title: 'ממוצע מעורבות לפי סוג פוסט',
        hint: 'לייקים + תגובות לפוסט.',
        rows: engagementRows(data.byFormat),
      })}

    ${topPostsSection(data.topPosts)}
    ${phrasesSection(data.phrases, totals.comments)}

    <p class="field-hint calendar-source">
      ${escapeHtml(`עודכן לאחרונה: ${formatCollected(data.collectedAt)}.`)}
      הנתונים נאספו מחשבונות אינסטגרם ציבוריים דרך Apify, והסיווג נעשה ידנית בעזרת Claude.
    </p>`;
}

/** @returns {string} */
export function renderContentInsights() {
  return `
    <header class="page-header">
      <h1 class="page-title">מה עובד בתוכן</h1>
      <p class="page-subtitle">איזה תוכן באינסטגרם מקבל תגובה מנשים כמו הלקוחות שלי.</p>
    </header>

    <div data-role="content-body">
      <p class="card empty-state">טוען את הנתונים…</p>
    </div>
  `;
}

/**
 * @param {HTMLElement} screen The element holding this screen's HTML.
 */
export function mountContentInsights(screen) {
  const body = screen.querySelector('[data-role="content-body"]');

  async function load() {
    body.innerHTML = '<p class="card empty-state">טוען את הנתונים…</p>';
    try {
      const response = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`הקובץ לא נמצא (${response.status})`);
      body.innerHTML = renderData(await response.json());
    } catch (error) {
      body.innerHTML = `
        <div class="card empty-state" role="alert">
          <p>לא הצלחנו לטעון את נתוני התוכן.</p>
          <p class="field-hint">${escapeHtml(error.message)}</p>
          <button class="btn btn-primary" type="button" data-action="retry">ניסיון חוזר</button>
        </div>`;
    }
  }

  screen.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="retry"]')) load();
  });

  load();
}
