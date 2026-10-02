// Screen 7 – the marketing calendar.
//
// Answers one question: when can a campaign or a new round actually run,
// without landing on a holiday or asking someone to read an email on Shabbat.
//
// This is the first screen whose content comes from somewhere else, so it is
// also the first that cannot be drawn in one go. render() puts up the frame
// and a loading line; mount() fetches and fills it in. Nothing in app.js
// changed for this – a screen is still a string plus a mount function.

import { daysFromToday, formatFullDate, formatShortDate, today } from '../dates.js';
import { freeWeeks, groupHolidays } from '../calendar.js';
import { fetchHolidays, fetchShabbat } from '../hebcal.js';
import { escapeHtml } from '../html.js';
import { getCurrentQuery } from '../router.js';

/** Ashkelon. Hebcal's own id for the city, from geonames.org. */
const CITY_ID = 295620;

/** How far ahead to plan. */
const DAYS_AHEAD = 92;

/** @param {string} iso */
function weekday(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('he-IL', { weekday: 'long' });
}

/** The holidays list. */
function holidaysSection(holidays) {
  const groups = groupHolidays(holidays);

  if (groups.length === 0) {
    return '<p class="empty-state">אין חגים או מועדים בשלושת החודשים הקרובים.</p>';
  }

  return `
    <ul class="calendar-list">
      ${groups
        .map((group) => {
          const span =
            group.from === group.to
              ? formatShortDate(group.from)
              : `${formatShortDate(group.from)}–${formatShortDate(group.to)}`;

          // The label says what it means for the business, which is the only
          // reason this screen exists. Colour repeats it, never replaces it.
          const label =
            group.kind === 'major'
              ? group.restDay
                ? 'יום מנוחה'
                : 'חג'
              : 'ציון, יום עבודה רגיל';

          return `
            <li class="calendar-row calendar-row-${escapeHtml(group.kind)}">
              <span class="calendar-when">${escapeHtml(span)}</span>
              <span class="calendar-title">${escapeHtml(group.title)}</span>
              <span class="calendar-tag">${escapeHtml(label)}${group.days > 1 ? ` · ${group.days} ימים` : ''}</span>
            </li>`;
        })
        .join('')}
    </ul>`;
}

/** The free weeks. */
function windowsSection(holidays) {
  const windows = freeWeeks(holidays, { from: today(), to: daysFromToday(DAYS_AHEAD) });

  if (windows.length === 0) {
    return '<p class="empty-state">אין שבוע שלם בלי חג בשלושת החודשים הקרובים.</p>';
  }

  return `
    <ul class="calendar-list">
      ${windows
        .map((week) => {
          const minor = week.holidays.filter((holiday) => !holiday.blocking);
          return `
            <li class="calendar-row calendar-row-free">
              <span class="calendar-when">${escapeHtml(formatShortDate(week.start))}–${escapeHtml(formatShortDate(week.end))}</span>
              <span class="calendar-title">שבוע פנוי</span>
              <span class="calendar-tag">
                ${minor.length ? escapeHtml(`${minor[0].title} — יום עבודה רגיל`) : 'בלי חגים'}
              </span>
            </li>`;
        })
        .join('')}
    </ul>`;
}

/** Candle lighting and havdalah. */
function shabbatSection(shabbat) {
  if (!shabbat.start && !shabbat.end) {
    return '<p class="empty-state">לא התקבלו זמנים.</p>';
  }

  // Around a festival Hebcal answers with the festival's times. Saying so is
  // more useful than printing them under the word "Shabbat" and being wrong.
  const occasion = shabbat.start?.forWhat ?? shabbat.end?.forWhat;

  return `
    <div class="shabbat-times">
      <div class="shabbat-time">
        <span class="shabbat-label">כניסה</span>
        <span class="shabbat-clock">${escapeHtml(shabbat.start?.time ?? '—')}</span>
        <span class="shabbat-date">${escapeHtml(shabbat.start ? `${weekday(shabbat.start.date)} ${formatFullDate(shabbat.start.date)}` : '')}</span>
      </div>
      <div class="shabbat-time">
        <span class="shabbat-label">יציאה</span>
        <span class="shabbat-clock">${escapeHtml(shabbat.end?.time ?? '—')}</span>
        <span class="shabbat-date">${escapeHtml(shabbat.end ? `${weekday(shabbat.end.date)} ${formatFullDate(shabbat.end.date)}` : '')}</span>
      </div>
    </div>
    ${occasion ? `<p class="field-hint">${escapeHtml(`הזמנים הם של ${occasion}.`)}</p>` : ''}
    <p class="field-hint">אשקלון · שעון ישראל</p>`;
}

/**
 * A post idea carried over from the "what works in content" screen, so it
 * stays in view while a free week is picked for it. It lives only in the
 * address: nothing is saved, and the card is gone once the idea is dealt with.
 */
function ideaCard() {
  const idea = getCurrentQuery().get('idea')?.trim();
  if (!idea) return '';

  return `
    <section class="card content-idea calendar-idea" aria-labelledby="idea-heading">
      <h2 class="section-title" id="idea-heading">הרעיון שבחרת לתכנן</h2>
      <p class="content-idea-hook">״${escapeHtml(idea)}״</p>
      <p class="field-hint">בחרי לו אחד מהשבועות הפנויים למטה, ורצוי לא ערב חג, כשהקהל פחות גולל.</p>
      <div class="export-buttons">
        <a class="btn btn-secondary" href="#/content">חזרה לרעיונות</a>
        <a class="btn btn-secondary" href="#/calendar">הסתרת הרעיון</a>
      </div>
    </section>`;
}

/** @returns {string} */
export function renderMarketingCalendar() {
  return `
    <header class="page-header">
      <h1 class="page-title">לוח תכנון שיווק</h1>
      <p class="page-subtitle">מתי אפשר לפתוח קמפיין בלי להתנגש בחג או בשבת.</p>
    </header>

    ${ideaCard()}

    <div data-role="calendar-body">
      <p class="card empty-state" data-role="loading">טוען מלוח השנה…</p>
    </div>
  `;
}

/**
 * @param {HTMLElement} screen The element holding this screen's HTML.
 */
export function mountMarketingCalendar(screen) {
  const body = screen.querySelector('[data-role="calendar-body"]');

  async function load() {
    body.innerHTML = '<p class="card empty-state" data-role="loading">טוען מלוח השנה…</p>';

    const from = today();
    const to = daysFromToday(DAYS_AHEAD);

    // Both at once rather than one after the other, and allSettled rather than
    // all: if the Shabbat times fail there is no reason to throw away the
    // holidays that did arrive.
    const [holidaysResult, shabbatResult] = await Promise.allSettled([
      fetchHolidays({ from, to }),
      fetchShabbat({ geonameid: CITY_ID }),
    ]);

    if (holidaysResult.status === 'rejected' && shabbatResult.status === 'rejected') {
      body.innerHTML = `
        <div class="card empty-state" role="alert">
          <p>לא הצלחנו לטעון את לוח השנה.</p>
          <p class="field-hint">${escapeHtml(holidaysResult.reason?.message ?? '')}</p>
          <button class="btn btn-primary" type="button" data-action="retry">ניסיון חוזר</button>
        </div>`;
      return;
    }

    const holidays = holidaysResult.status === 'fulfilled' ? holidaysResult.value : [];
    const shabbat = shabbatResult.status === 'fulfilled' ? shabbatResult.value : null;

    body.innerHTML = `
      <section class="card detail-card" aria-labelledby="shabbat-heading">
        <h2 class="section-title" id="shabbat-heading">השבת הקרובה</h2>
        ${
          shabbat
            ? shabbatSection(shabbat)
            : `<p class="empty-state">זמני השבת לא נטענו.
                 <button class="btn btn-secondary" type="button" data-action="retry">ניסיון חוזר</button>
               </p>`
        }
      </section>

      <section class="dashboard-section" aria-labelledby="windows-heading">
        <h2 class="section-title" id="windows-heading">חלונות פנויים לקמפיין</h2>
        <p class="chart-hint">שבועות שלמים, מראשון עד שבת, בלי אף חג.</p>
        ${
          holidaysResult.status === 'fulfilled'
            ? windowsSection(holidays)
            : '<p class="card empty-state">רשימת החגים לא נטענה, ולכן אי אפשר לחשב חלונות.</p>'
        }
      </section>

      <section class="dashboard-section" aria-labelledby="holidays-heading">
        <h2 class="section-title" id="holidays-heading">חגים ומועדים</h2>
        <p class="chart-hint">${escapeHtml(`${formatFullDate(from)} עד ${formatFullDate(to)} · לוח ישראל.`)}</p>
        ${
          holidaysResult.status === 'fulfilled'
            ? holidaysSection(holidays)
            : `<div class="card empty-state" role="alert">
                 <p>רשימת החגים לא נטענה.</p>
                 <p class="field-hint">${escapeHtml(holidaysResult.reason?.message ?? '')}</p>
                 <button class="btn btn-primary" type="button" data-action="retry">ניסיון חוזר</button>
               </div>`
        }
      </section>

      <p class="field-hint calendar-source">
        הנתונים מ־<a href="https://www.hebcal.com" target="_blank" rel="noopener">Hebcal</a>,
        לוח שנה עברי חופשי.
      </p>`;
  }

  screen.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="retry"]')) load();
  });

  load();
}
