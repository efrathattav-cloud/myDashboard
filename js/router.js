// Hash-based router. Works on static hosting (GitHub Pages) with no server config,
// and page refresh always lands on the right screen.

const DEFAULT_PATH = '/dashboard';

/** @returns {string} The current path, e.g. "/leads" or "/leads/new". */
export function getCurrentPath() {
  const hash = window.location.hash.replace(/^#/, '');
  return hash.startsWith('/') ? hash : DEFAULT_PATH;
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
