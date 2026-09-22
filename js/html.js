// Helpers for safely building HTML strings.

/**
 * Makes a piece of text safe to drop into HTML.
 *
 * The screens build HTML as strings and hand them to innerHTML. That is fine
 * for text we wrote ourselves, but a lead's name, notes and free-text fields
 * are typed by the user. A name like  אורלי <3  would otherwise be read as the
 * start of a tag and quietly break the page – and a name containing a <script>
 * tag would be worse.
 *
 * Every user-supplied value must go through here before it reaches innerHTML.
 *
 * @param {unknown} value
 * @returns {string} '' for null and undefined.
 */
export function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
