import { pathToFileURL } from 'node:url';
import path from 'node:path';
// Run from the project folder:  node checks/calendar.mjs
const projectDir = process.argv[2] ?? path.join(import.meta.dirname, '..');
const url = (f) => pathToFileURL(path.join(projectDir, 'js', f)).href;
const C = await import(url('calendar.js'));

let failed = 0;
const is = (n, a, e) => { const ok = JSON.stringify(a) === JSON.stringify(e);
  if (!ok) { failed++; console.log(`  FAIL ${n}\n       got      ${JSON.stringify(a)}\n       expected ${JSON.stringify(e)}`); } else console.log(`  ok   ${n}`); };

const h = (date, title, kind = 'major', restDay = false) => ({ date, title, kind, restDay, blocking: kind === 'major' });

console.log('the week runs Sunday to Saturday');
is('a Thursday belongs to its Sunday', C.startOfWeekFor('2026-10-01'), '2026-09-27');
is('a Sunday is its own start', C.startOfWeekFor('2026-10-04'), '2026-10-04');
is('a Saturday still belongs to that week', C.startOfWeekFor('2026-10-10'), '2026-10-04');

console.log('a week is free only when no major holiday falls in it');
const weeks = C.weeksInRange([h('2026-10-05', 'חג')], { from: '2026-10-04', to: '2026-10-24' });
is('three weeks in the range', weeks.length, 3);
is('the week with the holiday is not free', weeks[0].free, false);
is('the next one is', weeks[1].free, true);
is('the holiday is listed on its week', weeks[0].holidays.map(x => x.title), ['חג']);

console.log('a modern observance does not rule a week out');
const modern = C.weeksInRange([h('2026-10-22', 'יום הזכרון ליצחק רבין', 'modern')], { from: '2026-10-18', to: '2026-10-24' });
is('still free', modern[0].free, true);
is('but still listed, so it can be used as a hook', modern[0].holidays.length, 1);

console.log('a window that has already started is not offered');
const started = C.freeWeeks([], { from: '2026-10-07', to: '2026-10-24' });
is('the current part-week is skipped', started[0].start, '2026-10-11');

console.log('multi-day festivals are gathered into one entry');
const sukkot = [
  h('2026-09-26', 'סוכות א׳', 'major', true),
  h('2026-09-27', 'סוכות ב׳ (חוה״מ)'),
  h('2026-09-28', 'סוכות ג׳ (חוה״מ)'),
  h('2026-10-03', 'שמיני עצרת', 'major', true),
];
const grouped = C.groupHolidays(sukkot);
is('three days of Sukkot become one row', grouped.length, 2);
is('named without the day number', grouped[0].title, 'סוכות');
is('spanning the right dates', [grouped[0].from, grouped[0].to, grouped[0].days], ['2026-09-26', '2026-09-28', 3]);
is('a rest day anywhere in it marks the group', grouped[0].restDay, true);
is('a separate holiday stays separate', grouped[1].title, 'שמיני עצרת');

console.log('Hebcal names days with a colon too, and other days interleave');
const chanukah = C.groupHolidays([
  h('2026-12-04', 'חנוכה: א׳ נר'), h('2026-12-05', 'חנוכה: ב׳ נרות'),
  h('2026-12-06', 'חנוכה: ג׳ נרות'), h('2026-12-07', 'חנוכה: ד׳ נרות'),
  h('2026-12-08', 'חנוכה: ה׳ נרות'), h('2026-12-09', 'חנוכה: ו׳ נרות'),
  h('2026-12-10', 'חג הבנות', 'modern'),
  h('2026-12-10', 'חנוכה: ז׳ נרות'), h('2026-12-11', 'חנוכה: ח׳ נרות'),
  h('2026-12-12', 'חנוכה: יום'),
]);
is('nine days of Chanukah become one row', chanukah.filter(g => g.title === 'חנוכה').length, 1);
is('spanning the whole festival', [chanukah.find(g => g.title === 'חנוכה').from, chanukah.find(g => g.title === 'חנוכה').to], ['2026-12-04', '2026-12-12']);
is('counted as nine days, not ten', chanukah.find(g => g.title === 'חנוכה').days, 9);
is('the observance inside it stays its own row', chanukah.some(g => g.title === 'חג הבנות'), true);
is('rows come back in date order', chanukah.map(g => g.from), [...chanukah.map(g => g.from)].sort());

console.log('two different holidays on consecutive days are not merged');
const touching = C.groupHolidays([h('2026-12-04', 'חנוכה'), h('2026-12-05', 'חג אחר')]);
is('kept apart', touching.map(g => g.title), ['חנוכה', 'חג אחר']);

console.log('empty input');
is('no holidays means every week is free', C.weeksInRange([], { from: '2026-10-04', to: '2026-10-17' }).every(w => w.free), true);
is('freeWeeks respects its limit', C.freeWeeks([], { from: '2026-10-04', to: '2027-01-01', limit: 3 }).length, 3);
is('nextHoliday on an empty list', C.nextHoliday([], '2026-10-01'), undefined);
is('groupHolidays on an empty list', C.groupHolidays([]), []);

console.log('');
console.log(failed ? `FAILED – ${failed} check(s)` : 'PASSED – all checks');
process.exit(failed ? 1 : 0);
