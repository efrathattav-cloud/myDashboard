// Screen 8 – what works in content.
//
// What kind of Instagram content gets a response from women like the ones
// this business serves, judged by coaches who speak to the same audience.
//
// The question it is built to answer is "what do I post next", so it opens
// with three post ideas and only then shows the evidence behind them.
//
// Every figure is relative: a post's likes plus comments divided by its own
// account's usual post (see scripts/build_content_insights.py). Raw counts
// would mostly measure who has more followers.
//
// The figures come from data/content-insights.json, built offline. The page
// only reads that summary: no token, no call to Apify, and no commenter's
// name ever reaches the browser.
//
// Like the marketing calendar, render() draws the frame and mount() fetches
// and fills it in.

import { escapeHtml } from '../html.js';
import { barChart } from './bar-chart.js';

const DATA_URL = 'data/content-insights.json';

/** @param {number} value */
const number = (value) => value.toLocaleString('he-IL');

/** "פי 1.7" – how many times the account's usual response. */
const times = (lift) => `פי ${lift.toLocaleString('he-IL', { maximumFractionDigits: 1 })}`;

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

function ideasSection(ideas) {
  return `
    <section class="dashboard-section" aria-labelledby="ideas-heading">
      <h2 class="section-title" id="ideas-heading">3 רעיונות לפוסטים הבאים שלי</h2>
      <p class="chart-hint">כל רעיון בנוי ממה שעבד בנתונים: נושא, פורמט, פתיחה, והמילים של הקהל עצמו.</p>
      <ol class="content-ideas">
        ${ideas
          .map(
            (idea) => `
              <li class="card content-idea${idea.experiment ? ' content-idea-experiment' : ''}">
                <p class="content-idea-tags">
                  ${idea.experiment ? '<span class="badge badge-medium">ניסוי</span>' : ''}
                  ${escapeHtml(`${idea.topic} · ${idea.format} · פתיחה ב${idea.opening}`)}
                </p>
                <h3 class="content-idea-hook">״${escapeHtml(idea.hook)}״</h3>
                <p class="content-idea-scene">${escapeHtml(idea.scene)}</p>
                <p class="content-idea-phrase">
                  <span class="content-idea-label">במילים שלהן:</span> ״${escapeHtml(idea.phrase)}״
                </p>
                <p class="content-idea-why">${escapeHtml(idea.why)}</p>
                <a class="btn btn-secondary content-idea-plan"
                   href="#/calendar?idea=${encodeURIComponent(idea.hook)}">לתכנן בלוח השיווק</a>
              </li>`
          )
          .join('')}
      </ol>
    </section>`;
}

/**
 * Opening lines that worked, grouped by the kind of opening, strongest kind
 * first. These are the first line of the caption: for a reel the spoken or
 * on-screen hook may differ, and the hint says so.
 */
function hooksSection(groups) {
  return `
    <section class="dashboard-section" aria-labelledby="hooks-heading">
      <h2 class="section-title" id="hooks-heading">הוקים שעבדו</h2>
      <p class="chart-hint">שורות פתיחה של פוסטים שבלטו, לפי סוג הפתיחה. זו השורה הראשונה בכיתוב: ברילס, ההוק שנאמר או שמופיע על המסך יכול להיות שונה.</p>
      <div class="content-hook-groups">
        ${groups
          .map(
            (group) => `
              <section class="card content-hook-group" aria-label="${escapeHtml(group.opening)}">
                <h3 class="content-hook-type">
                  ${escapeHtml(group.opening)}
                  <span class="content-hook-type-lift">${escapeHtml(`${times(group.lift)} מהרגיל · ${group.posts} פוסטים`)}</span>
                </h3>
                <p class="content-hook-pattern"><span class="content-idea-label">התבנית:</span> ${escapeHtml(group.pattern)}</p>
                <ul class="content-hooks">
                  ${group.hooks
                    .map(
                      (hook) => `
                        <li class="content-hook">
                          <span class="content-hook-text">״${escapeHtml(hook.text)}״</span>
                          <span class="content-hook-meta">
                            ${escapeHtml(`${times(hook.lift)} · ${hook.topic} · @${hook.account}`)}
                            · <a href="${escapeHtml(hook.url)}" target="_blank" rel="noopener">לפוסט<span class="visually-hidden"> (נפתח בחלון חדש)</span></a>
                          </span>
                        </li>`
                    )
                    .join('')}
                </ul>
              </section>`
          )
          .join('')}
      </div>
    </section>`;
}

/**
 * A thin group is still shown, because hiding it would hide that the data is
 * thin. It goes last, paler, and says why.
 */
function liftRows(rows) {
  return rows.map((row) => ({
    label: row.label,
    value: row.lift,
    text: times(row.lift),
    note: row.enough ? `${row.posts} פוסטים` : `רק ${row.posts} ${row.posts === 1 ? 'פוסט' : 'פוסטים'}, מעט מדי כדי להסיק`,
    muted: !row.enough,
  }));
}

const LIFT_HINT = 'פי כמה מהתגובה הרגילה של אותו חשבון (לייקים + תגובות). 1 = פוסט רגיל.';

function topPostsSection(posts) {
  return `
    <section class="dashboard-section" aria-labelledby="top-posts-heading">
      <h2 class="section-title" id="top-posts-heading">10 הפוסטים שהכי בלטו</h2>
      <p class="chart-hint">ביחס לפוסט הרגיל של כל חשבון, כך שגם חשבון קטן יכול להופיע כאן.</p>
      <ol class="calendar-list content-top">
        ${posts
          .map(
            (post) => `
              <li class="calendar-row content-post">
                <span class="content-post-score">${escapeHtml(times(post.lift))}</span>
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
      <h2 class="section-title" id="insights-heading">למה דווקא הרעיונות האלה</h2>
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
  const { totals, leadingTopic, leadingFormat, leadingOpening } = data;

  return `
    ${ideasSection(data.ideas)}

    <section class="kpi-grid" aria-label="מה הכי עובד">
      ${kpiCard('הנושא שהכי עובד', leadingTopic.label, `${times(leadingTopic.lift)} מהרגיל · ${leadingTopic.posts} פוסטים`)}
      ${kpiCard('הפורמט שהכי עובד', leadingFormat.label, `${times(leadingFormat.lift)} מהרגיל · ${leadingFormat.posts} פוסטים`)}
      ${kpiCard('הפתיחה שהכי עובדת', leadingOpening.label, `${times(leadingOpening.lift)} מהרגיל · ${leadingOpening.posts} פוסטים`)}
      ${kpiCard('הבסיס', `${number(totals.posts)} פוסטים`, `מ־${totals.accounts} חשבונות · ${totals.withHiddenLikes} עם לייקים מוסתרים`)}
    </section>

    ${hooksSection(data.hookPatterns)}

    ${insightsSection(data.insights)}

    ${barChart({ id: 'by-topic', title: 'מה עובד לפי נושא', hint: `${LIFT_HINT} פוסטים אישיים שלא בנושא לא נכללים.`, rows: liftRows(data.byTopic) })}
    ${barChart({ id: 'by-opening', title: 'מה עובד לפי סוג פתיחה', hint: LIFT_HINT, rows: liftRows(data.byOpening) })}
    ${barChart({ id: 'by-format', title: 'מה עובד לפי סוג פוסט', hint: LIFT_HINT, rows: liftRows(data.byFormat) })}

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
      <p class="page-subtitle">מה לפרסם בשבוע הבא, לפי מה שעובד אצל מאמנות לקהל דומה.</p>
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
