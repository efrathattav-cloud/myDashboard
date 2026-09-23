// Where the leads live, and the details needed to reach them.
//
// Two sources are possible:
//   'browser'  – this browser's own storage, which is how the app has always
//                worked and what it falls back to.
//   'airtable' – an Airtable table, loaded when the app starts and written
//                back as changes are made.
//
// ## The token
//
// The Airtable token is a key to the whole base. It is kept here and nowhere
// else: never in the code, never in the repository, never sent anywhere except
// to Airtable itself. It lives in this browser, on this device, exactly like
// the leads do – so opening the published site on another computer shows an
// app asking for a token, not this one's data.
//
// Clearing the browser's site data removes it, which is the intended way to
// revoke it locally. Revoking it properly is done at Airtable.

const STORAGE_KEY = 'leadflow.connection.v1';

/**
 * @typedef {Object} Connection
 * @property {'browser' | 'airtable'} source
 * @property {string} token      Airtable personal access token.
 * @property {string} baseId     Starts with "app".
 * @property {string} tableName  The table's name, or its id.
 */

/** @returns {Connection} */
function blank() {
  return { source: 'browser', token: '', baseId: '', tableName: '' };
}

/**
 * The saved connection, or the default of staying in this browser.
 * @returns {Connection}
 */
export function getConnection() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    // Spread the blank first, so a stored value missing a field still works.
    return { ...blank(), ...parsed };
  } catch {
    // Blocked storage, or text that is not the JSON we wrote.
    return blank();
  }
}

/**
 * @param {Connection} connection
 * @returns {boolean} false when storage refused to keep it.
 */
export function saveConnection(connection) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
    return true;
  } catch {
    return false;
  }
}

/** Forgets the connection, token included. */
export function forgetConnection() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: there is no other copy to remove.
  }
}

/**
 * Is this connection complete enough to try?
 *
 * @param {Connection} connection
 * @returns {Record<string, string>} Empty when it is.
 */
export function validateConnection(connection) {
  /** @type {Record<string, string>} */
  const errors = {};
  const filled = (value) => typeof value === 'string' && value.trim() !== '';

  if (!filled(connection.token)) errors.token = 'יש להדביק מפתח גישה.';
  else if (!connection.token.trim().startsWith('pat')) {
    errors.token = 'מפתח גישה אישי של איירטייבל מתחיל ב־pat.';
  }

  if (!filled(connection.baseId)) errors.baseId = 'יש להזין מזהה base.';
  else if (!connection.baseId.trim().startsWith('app')) {
    errors.baseId = 'מזהה base מתחיל ב־app.';
  }

  if (!filled(connection.tableName)) errors.tableName = 'יש להזין את שם הטבלה.';

  return errors;
}

/**
 * Is the app set up to use Airtable right now?
 * @param {Connection} [connection]
 */
export function usingAirtable(connection = getConnection()) {
  return (
    connection.source === 'airtable' &&
    Object.keys(validateConnection(connection)).length === 0
  );
}

/**
 * A token with its middle hidden, for showing back on screen.
 * The whole point of keeping it out of sight is lost if the interface prints
 * it in full.
 *
 * @param {string} token
 */
export function maskToken(token) {
  const value = (token ?? '').trim();
  if (value.length <= 10) return value ? '•'.repeat(value.length) : '';
  return `${value.slice(0, 6)}${'•'.repeat(12)}${value.slice(-4)}`;
}
