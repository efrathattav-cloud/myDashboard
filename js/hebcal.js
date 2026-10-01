// Reading the Jewish calendar from Hebcal.
//
// https://www.hebcal.com/home/developer-apis — free, no key, CORS allowed.
//
// This file is the only place that knows Hebcal exists. It fetches, checks
// what came back, and hands over plain objects in the app's own shape. It
// builds no HTML and touches no screen, so the screen can be changed without
// touching the network code and the other way round.
//
// That separation is the pattern to copy for the next API: one file per
// service, exporting functions that return the app's own shapes.

const HOLIDAYS_URL = 'https://www.hebcal.com/hebcal';
const SHABBAT_URL = 'https://www.hebcal.com/shabbat';

/** How long to wait before giving up, so a hanging request does not spin forever. */
const TIMEOUT_MS = 12000;

/**
 * Hebcal's titles carry nikud, which is lovely to read and awkward to scan.
 * The `hebrew` field is already plain; this is the fallback for when it is not
 * there.
 *
 * @param {string} text
 */
function stripNikud(text) {
  // Deliberately not the whole ֑-ׇ block. Sitting inside it are
  // punctuation marks that are part of the word: ־ is the maqaf, the
  // Hebrew hyphen, and removing it turns "בן־גוריון" into one run-on word.
  return (text ?? '').replace(/[֑-ׇֽֿׁׂׅׄ]/g, '');
}

/**
 * One request, with a timeout and a message that says what actually went
 * wrong rather than "failed".
 *
 * @param {string} url
 * @returns {Promise<any>}
 */
async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Hebcal ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Hebcal לא ענה בזמן.');
    }
    // A failed fetch here is almost always no connection, or a blocker.
    throw new Error(error.message?.includes('Hebcal') ? error.message : 'לא ניתן להגיע ל־Hebcal.');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @typedef {Object} Holiday
 * @property {string} date      ISO date, 'YYYY-MM-DD'.
 * @property {string} title     In Hebrew, without nikud.
 * @property {'major' | 'minor' | 'modern'} kind
 * @property {boolean} restDay  A day of rest – nothing happens in business.
 * @property {boolean} blocking Whether it rules a week out for a campaign.
 * @property {string} [note]
 * @property {string} [link]
 */

/**
 * Holidays and observances between two dates, by the Israeli calendar.
 *
 * Only the major ones block a week. A modern observance such as Yom HaAliyah
 * or the Rabin memorial is worth knowing about and worth mentioning in a
 * campaign, but it is a working day and should not rule the week out.
 *
 * @param {object} range
 * @param {string} range.from ISO date.
 * @param {string} range.to   ISO date.
 * @returns {Promise<Holiday[]>}
 */
export async function fetchHolidays({ from, to }) {
  const query = new URLSearchParams({
    v: '1',
    cfg: 'json',
    maj: 'on',       // major holidays
    min: 'on',       // minor ones
    mod: 'on',       // modern Israeli observances
    i: 'on',         // the Israeli calendar, not the diaspora one
    lg: 'he',        // Hebrew
    start: from,
    end: to,
  });

  const data = await getJson(`${HOLIDAYS_URL}?${query}`);
  const items = Array.isArray(data?.items) ? data.items : [];

  return items
    .filter((item) => item.category === 'holiday' && typeof item.date === 'string')
    .map((item) => {
      const kind = item.subcat === 'major' ? 'major' : item.subcat === 'modern' ? 'modern' : 'minor';
      return {
        // A holiday item is a single day; a date-time would be a candle time.
        date: item.date.slice(0, 10),
        title: item.hebrew ? stripNikud(item.hebrew) : stripNikud(item.title),
        kind,
        restDay: item.yomtov === true,
        blocking: kind === 'major',
        note: item.memo ? stripNikud(item.memo) : undefined,
        link: item.link,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * @typedef {Object} ShabbatTimes
 * @property {string} city
 * @property {string} [parasha]
 * @property {{date: string, time: string, forWhat?: string}} [start]
 * @property {{date: string, time: string, forWhat?: string}} [end]
 */

/**
 * Candle lighting and havdalah for the coming Shabbat.
 *
 * The time is taken from the text of the timestamp rather than through a Date.
 * Hebcal returns it already in Israel time; turning it into a Date and
 * formatting it would convert it to whatever timezone the viewer's computer is
 * set to, which for someone travelling would quietly show the wrong time.
 *
 * Around a festival this endpoint answers with the festival's times instead,
 * which is correct and worth saying out loud – so what each time belongs to is
 * carried along.
 *
 * @param {object} options
 * @param {number|string} options.geonameid
 * @returns {Promise<ShabbatTimes>}
 */
export async function fetchShabbat({ geonameid }) {
  const query = new URLSearchParams({
    cfg: 'json',
    geonameid: String(geonameid),
    M: 'on',     // havdalah by nightfall rather than a fixed number of minutes
    lg: 'he',
  });

  const data = await getJson(`${SHABBAT_URL}?${query}`);
  const items = Array.isArray(data?.items) ? data.items : [];

  const pick = (category) => {
    const item = items.find((entry) => entry.category === category);
    if (!item || typeof item.date !== 'string') return undefined;
    return {
      date: item.date.slice(0, 10),
      time: item.date.slice(11, 16),
      // The memo is kept with its nikud. It is the only form Hebcal gives for
      // this one, and stripping it produces a defective spelling that reads as
      // a typo – "סכות" where everyone writes "סוכות".
      forWhat: item.memo || undefined,
    };
  };

  const parasha = items.find((entry) => entry.category === 'parashat');

  return {
    city: data?.location?.city ?? '',
    parasha: parasha ? stripNikud(parasha.hebrew ?? parasha.title) : undefined,
    start: pick('candles'),
    end: pick('havdalah'),
  };
}
