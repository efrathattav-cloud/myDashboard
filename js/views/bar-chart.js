// A horizontal bar chart, built from plain elements. No chart library.
//
// Design decisions, and why:
//
// * One colour for every bar. These charts each show a single measure, so
//   colour carries no information – the labels do. Giving each source its own
//   hue would spend the only free channel on something the text already says,
//   and would need a legend that adds nothing.
// * Every bar is labelled with its own value, in text, next to it. With five
//   rows that reads faster than an axis, works on a narrow phone, and means
//   the chart is never colour-alone: it is legible in black and white and to
//   a screen reader.
// * Bars are thin and sit in a quiet track, rather than being tall saturated
//   blocks.
// * Horizontal, so category names have room to be written out in full instead
//   of being turned sideways.

import { escapeHtml } from '../html.js';

/**
 * @typedef {Object} BarRow
 * @property {string} label
 * @property {number} value   Drives the bar's length.
 * @property {string} [text]  What is printed as the value. Defaults to the number.
 * @property {string} [note]  A quieter second line, e.g. "2 מתוך 4 לידים".
 */

/**
 * @param {object} options
 * @param {string} options.id       Used to tie the heading to the chart.
 * @param {string} options.title
 * @param {BarRow[]} options.rows
 * @param {string} [options.hint]   A line under the title.
 * @param {string} [options.emptyText] Shown when every value is zero.
 * @returns {string}
 */
export function barChart({ id, title, rows, hint, emptyText = 'אין נתונים לתקופה שנבחרה.' }) {
  const largest = Math.max(...rows.map((row) => row.value), 0);

  const body =
    largest === 0
      ? `<p class="empty-state">${escapeHtml(emptyText)}</p>`
      : `<ul class="bars">
          ${rows
            .map((row) => {
              // A row with a value keeps a sliver of bar, so "1" never looks
              // the same as "0".
              const percent = row.value === 0 ? 0 : Math.max((row.value / largest) * 100, 4);
              return `
                <li class="bar-row">
                  <span class="bar-label">${escapeHtml(row.label)}</span>
                  <span class="bar-track" aria-hidden="true">
                    <span class="bar-fill" style="width: ${percent.toFixed(1)}%"></span>
                  </span>
                  <span class="bar-value">${escapeHtml(row.text ?? String(row.value))}</span>
                  ${row.note ? `<span class="bar-note">${escapeHtml(row.note)}</span>` : ''}
                </li>`;
            })
            .join('')}
        </ul>`;

  return `
    <section class="card chart-card" aria-labelledby="${escapeHtml(id)}-heading">
      <h2 class="section-title" id="${escapeHtml(id)}-heading">${escapeHtml(title)}</h2>
      ${hint ? `<p class="chart-hint">${escapeHtml(hint)}</p>` : ''}
      ${body}
    </section>`;
}
