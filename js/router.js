// Hash-based router. Works on static hosting (GitHub Pages) with no server config,
// and page refresh always lands on the right screen.

const DEFAULT_PATH = '/dashboard';

/**
 * The hash without its leading '#', e.g. "/leads?source=instagram".
 * @returns {string}
 */
function currentHash() {
  return window.location.hash.replace(/^#/, '');
}

/** @returns {string} The current path, e.g. "/leads" or "/leads/new". */
export function getCurrentPath() {
  const path = currentHash().split('?')[0];
  return path.startsWith('/') ? path : DEFAULT_PATH;
}

/**
 * The parameters after '?' in the hash, e.g. "#/leads?followup=stale".
 *
 * Screens keep their filters here instead of in a variable, so that a filtered
 * view survives a refresh, can be linked to from another screen, and works
 * with the browser's back button.
 *
 * @returns {URLSearchParams} Empty when the hash has no parameters.
 */
export function getCurrentQuery() {
  const hash = currentHash();
  const start = hash.indexOf('?');
  return new URLSearchParams(start === -1 ? '' : hash.slice(start + 1));
}

/**
 * Rewrites the parameters of the current screen without reloading it.
 *
 * Uses replaceState rather than assigning to location.hash: assigning would
 * fire a hashchange, the router would redraw the whole screen, and the search
 * field would lose focus in the middle of typing.
 *
 * @param {string} path
 * @param {URLSearchParams} query
 */
export function replaceQuery(path, query) {
  const search = query.toString();
  window.history.replaceState(null, '', `#${path}${search ? `?${search}` : ''}`);
}

/**
 * Finds the route that matches a path.
 * @param {Array<{path: string}>} routes
 * @param {string} path
 */
export function matchRoute(routes, path) {
  return routes.find((route) => route.path === path) ?? null;
}

/** @param {() => void} onChange */
export function startRouter(onChange) {
  window.addEventListener('hashchange', onChange);
  if (!window.location.hash) {
    window.location.replace(`#${DEFAULT_PATH}`);
  }
  onChange();
}
