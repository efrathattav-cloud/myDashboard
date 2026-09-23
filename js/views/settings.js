// Where the leads are kept, and how to reach them.
//
// The one screen that handles the Airtable token. It is never printed back in
// full, never put in the address bar, and never leaves this browser except to
// go to Airtable.

import { escapeHtml } from '../html.js';
import { testConnection } from '../airtable.js';
import {
  forgetConnection,
  getConnection,
  maskToken,
  saveConnection,
  validateConnection,
} from '../settings.js';
import { getSyncStatus, loadFromAirtable } from '../store.js';
import { textField } from './fields.js';

/** @returns {string} */
export function renderSettings() {
  const connection = getConnection();
  const status = getSyncStatus();
  const connected = status.source === 'airtable';

  return `
    <header class="page-header">
      <h1 class="page-title">הגדרות</h1>
      <p class="page-subtitle">איפה נשמרים הלידים.</p>
    </header>

    <section class="card detail-card" aria-labelledby="source-heading">
      <h2 class="section-title" id="source-heading">מקור הנתונים</h2>
      <p class="source-state ${connected ? 'source-state-connected' : ''}">
        ${connected ? '✓ מחובר לאיירטייבל' : 'הלידים נשמרים בדפדפן הזה בלבד'}
      </p>
      ${
        status.state === 'error'
          ? `<p class="form-summary" role="alert">שגיאה בסנכרון: ${escapeHtml(status.message)}</p>`
          : ''
      }
      <p class="field-hint">
        חיבור לאיירטייבל טוען את הלידים משם בכל פתיחה של האפליקציה, וכל שינוי
        נכתב בחזרה לטבלה. עותק נשאר גם בדפדפן, כדי שניתוק זמני לא ישאיר מסך ריק.
      </p>
    </section>

    <section class="card detail-card" aria-labelledby="security-heading">
      <h2 class="section-title" id="security-heading">לפני שמתחברים</h2>
      <p class="field-hint">
        מפתח הגישה הוא מפתח לכל ה־base שלך. הוא נשמר <strong>רק בדפדפן הזה</strong> —
        לא בקוד, לא בגיטהאב, ולא נשלח לשום מקום חוץ מאיירטייבל עצמה.
      </p>
      <ol class="help-list">
        <li>נכנסים ל־<span dir="ltr">airtable.com/create/tokens</span> ויוצרים Personal access token.</li>
        <li>בהרשאות בוחרים <span dir="ltr">data.records:read</span> ו־<span dir="ltr">data.records:write</span>.</li>
        <li>ב־Access בוחרים <strong>רק את ה־base הזה</strong>, לא את כל החשבון.</li>
        <li>מעתיקים את המפתח — הוא מוצג פעם אחת בלבד.</li>
      </ol>
      <p class="field-hint">
        מזהה ה־base נמצא בכתובת של איירטייבל: החלק שמתחיל ב־<span dir="ltr">app</span>.
      </p>
    </section>

    <form class="lead-form" id="connection-form" novalidate>
      <section class="form-section">
        <h2 class="form-section-title">פרטי החיבור</h2>
        <p class="form-summary" data-role="connection-message" role="alert" hidden></p>

        ${textField({
          name: 'token',
          label: 'מפתח גישה (Personal access token)',
          type: 'password',
          value: '',
          placeholder: connection.token ? maskToken(connection.token) : 'pat…',
          hint: connection.token
            ? 'מפתח כבר שמור. השאירי ריק כדי להשאיר אותו, או הדביקי חדש כדי להחליף.'
            : 'מתחיל ב־pat.',
        })}
        ${textField({
          name: 'baseId',
          label: 'מזהה ה־base',
          value: connection.baseId,
          placeholder: 'app…',
        })}
        ${textField({
          name: 'tableName',
          label: 'שם הטבלה',
          value: connection.tableName,
          placeholder: 'לידים',
        })}

        <div class="form-actions">
          <button class="btn btn-secondary" type="button" data-action="test">בדיקת חיבור</button>
          <button class="btn btn-primary" type="submit">שמירה והתחברות</button>
        </div>
      </section>
    </form>

    ${
      connection.token || connection.baseId
        ? `<section class="danger-zone">
             <button class="btn btn-danger" type="button" data-action="ask-forget">ניתוק ומחיקת המפתח</button>
             <div class="delete-confirm" data-role="forget-confirm" hidden>
               <p class="delete-question">
                 למחוק את המפתח מהדפדפן? הלידים באיירטייבל לא יימחקו, והאפליקציה תחזור
                 לעבוד מול הדפדפן בלבד.
               </p>
               <div class="form-actions">
                 <button class="btn btn-danger" type="button" data-action="confirm-forget">כן, לנתק</button>
                 <button class="btn btn-secondary" type="button" data-action="cancel-forget">ביטול</button>
               </div>
             </div>
           </section>`
        : ''
    }
  `;
}

/**
 * @param {HTMLElement} screen The element holding this screen's HTML.
 */
export function mountSettings(screen) {
  const form = screen.querySelector('#connection-form');
  const message = screen.querySelector('[data-role="connection-message"]');

  /** @param {string} text @param {'ok'|'error'} tone */
  function say(text, tone) {
    message.textContent = text;
    message.classList.toggle('form-summary-ok', tone === 'ok');
    message.hidden = false;
  }

  /**
   * The connection as the form currently describes it.
   * An empty token field means "keep the one already saved", so a saved token
   * never has to be pasted again to change the table name.
   */
  function readForm() {
    const saved = getConnection();
    const typed = form.elements.token.value.trim();
    return {
      source: 'airtable',
      token: typed || saved.token,
      baseId: form.elements.baseId.value.trim(),
      tableName: form.elements.tableName.value.trim(),
    };
  }

  /** @returns {object | null} null when something is missing. */
  function readValidForm() {
    const connection = readForm();
    const errors = validateConnection(connection);

    for (const field of form.querySelectorAll('.field')) field.classList.remove('field-invalid');
    for (const name of Object.keys(errors)) {
      form.elements[name]?.closest('.field')?.classList.add('field-invalid');
    }

    if (Object.keys(errors).length) {
      say(Object.values(errors).join(' '), 'error');
      return null;
    }
    return connection;
  }

  /** Redraws this screen in a fresh element, as the other screens do. */
  function redraw() {
    const fresh = document.createElement('div');
    fresh.innerHTML = renderSettings();
    screen.replaceWith(fresh);
    mountSettings(fresh);
    return fresh;
  }

  screen.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    if (action === 'test') {
      const connection = readValidForm();
      if (!connection) return;

      say('בודק…', 'ok');
      const result = await testConnection(connection);
      if (result.ok) say('החיבור תקין. הטבלה נמצאה.', 'ok');
      else say(`החיבור נכשל — ${result.message}`, 'error');
      return;
    }

    if (action === 'ask-forget') {
      screen.querySelector('[data-role="forget-confirm"]').hidden = false;
    } else if (action === 'cancel-forget') {
      screen.querySelector('[data-role="forget-confirm"]').hidden = true;
    } else if (action === 'confirm-forget') {
      forgetConnection();
      const fresh = redraw();
      fresh.querySelector('[data-role="connection-message"]').hidden = true;
      window.location.reload();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const connection = readValidForm();
    if (!connection) return;

    say('מתחבר…', 'ok');
    const test = await testConnection(connection);
    if (!test.ok) {
      // Nothing is saved until it is known to work, so a typo cannot leave the
      // app pointing at a table that is not there.
      say(`החיבור נכשל — ${test.message}`, 'error');
      return;
    }

    if (!saveConnection(connection)) {
      say('הדפדפן חוסם שמירה, ולכן לא ניתן לשמור את החיבור.', 'error');
      return;
    }

    const loaded = await loadFromAirtable();
    if (!loaded.ok) {
      say(`החיבור נשמר אך הטעינה נכשלה — ${loaded.message}`, 'error');
      return;
    }

    const skipped = loaded.skipped.length
      ? ` ${loaded.skipped.length} שורות דולגו (ללא שם).`
      : '';
    redraw().querySelector('[data-role="connection-message"]');
    window.location.hash = '#/dashboard';
    window.setTimeout(() => {
      window.alert(`נטענו ${loaded.count} לידים מאיירטייבל.${skipped}`);
    }, 50);
  });
}
