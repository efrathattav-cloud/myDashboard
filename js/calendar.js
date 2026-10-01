// Finding the weeks a campaign can actually run in.
//
// Pure arithmetic over dates and a list of holidays: no network, no screen.
// That makes it the part of the Marketing Calendar that can be checked without
// Hebcal being reachable, which is most of what can go wrong.

import { daysFromToday, toISO, today } from './dates.js';

/**
 * The Sunday of the week a date falls in. The week runs Sunday to Saturday, as
 * the working week does in Israel – a campaign starts on a Sunday.
 *
 * @param {string} iso
 * @returns {string}
 */
export function startOfWeekFor(iso) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() - date.getDay());
  return toISO(date);
}

/**
 * @param {string} iso
 * @param {number} days
 * @returns {string}
 */
function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

/**
 * @typedef {Object} Week
 * @property {string} start           Sunday, ISO.
 * @property {string} end             Saturday, ISO.
 * @property {boolean} free           No major holiday falls in it.
 * @property {import('./hebcal.js').Holiday[]} holidays Everything in it, blocking or not.
 */

/**
 * Every week in a range, each with the holidays that fall in it.
 *
 * A week counts as free when no *major* holiday falls in it. Minor and modern
 * observances are listed but do not rule a week out: Yom HaAliyah is a working
 * day, and a campaign can run through it – in fact it might be the hook.
 *
 * The current week is included only from today onwards, because a campaign
 * cannot start on a day that has already gone.
 *
 * @param {import('./hebcal.js').Holiday[]} holidays
 * @param {object} [range]
 * @param {string} [range.from] ISO date. Defaults to today.
 * @param {string} [range.to]   ISO date. Defaults to three months out.
 * @returns {Week[]}
 */
export function weeksInRange(holidays, { from = today(), to = daysFromToday(92) } = {}) {
  const weeks = [];

  for (let start = startOfWeekFor(from); start <= to; start = addDays(start, 7)) {
    const end = addDays(start, 6);
    const inWeek = holidays.filter(
      (holiday) => holiday.date >= start && holiday.date <= end
    );

    weeks.push({
      start,
      end,
      free: !inWeek.some((holiday) => holiday.blocking),
      holidays: inWeek,
    });
  }

  return weeks;
}

/**
 * The weeks worth opening a campaign in: free, and not already underway.
 *
 * A week that started before today is left out even when it is free – there is
 * no point suggesting a launch window that is half gone.
 *
 * @param {import('./hebcal.js').Holiday[]} holidays
 * @param {object} [options]
 * @param {string} [options.from]
 * @param {string} [options.to]
 * @param {number} [options.limit]
 * @returns {Week[]}
 */
export function freeWeeks(holidays, { from = today(), to = daysFromToday(92), limit = 6 } = {}) {
  return weeksInRange(holidays, { from, to })
    .filter((week) => week.free && week.start >= from)
    .slice(0, limit);
}

/**
 * The next holiday from a date onwards, or undefined when there is none.
 *
 * @param {import('./hebcal.js').Holiday[]} holidays
 * @param {string} [from]
 */
export function nextHoliday(holidays, from = today()) {
  return holidays.find((holiday) => holiday.date >= from);
}

/**
 * Consecutive days of the same holiday, gathered into one entry.
 *
 * Hebcal returns a seven-day festival as seven items – "Sukkot I", "Sukkot II"
 * and so on – which is right for a calendar and wrong for a list someone is
 * scanning. Grouping them gives "Sukkot, 26/09–02/10" instead of seven rows.
 *
 * Entries are grouped only when they run on consecutive days and share the
 * part of the name before the first comma or bracket, so two unrelated
 * holidays that happen to touch stay apart.
 *
 * @param {import('./hebcal.js').Holiday[]} holidays
 * @returns {Array<{title: string, from: string, to: string, kind: string, restDay: boolean, days: number, note?: string, link?: string}>}
 */
export function groupHolidays(holidays) {
  // Hebcal names the days of a festival in several ways: "Sukkot I",
  // "Sukkot VI (CH''M)", "Chanukah: 1 Candle". Everything from the first
  // comma, colon or bracket onwards is the day, not the festival.
  const familyOf = (title) =>
    title.split(/[,:(]/)[0].trim().replace(/\s+[א-ת]׳$/, '').trim();

  // Gathered by name first and only then split into runs of consecutive days.
  // A single pass down the list would break Chanukah in two, because another
  // observance - חג הבנות - falls on one of its days and comes between them.
  const byFamily = new Map();
  for (const holiday of holidays) {
    const family = familyOf(holiday.title);
    if (!byFamily.has(family)) byFamily.set(family, []);
    byFamily.get(family).push(holiday);
  }

  const groups = [];
  for (const [family, items] of byFamily) {
    items.sort((a, b) => a.date.localeCompare(b.date));

    let run = null;
    for (const holiday of items) {
      const continues = run && (holiday.date === run.to || addDays(run.to, 1) === holiday.date);

      if (continues) {
        // Two entries on the same day are one day, not two.
        if (holiday.date !== run.to) run.days += 1;
        run.to = holiday.date;
        run.restDay = run.restDay || holiday.restDay;
        continue;
      }

      run = {
        title: family,
        from: holiday.date,
        to: holiday.date,
        kind: holiday.kind,
        restDay: holiday.restDay,
        days: 1,
        note: holiday.note,
        link: holiday.link,
      };
      groups.push(run);
    }
  }

  return groups.sort((a, b) => a.from.localeCompare(b.from));
}
