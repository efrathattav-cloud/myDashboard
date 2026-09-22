// Form field building blocks, shared by every form in the app.
//
// Each one renders the same three things together: a visible label, the input,
// and a place for an error message (SPEC section 21 – a placeholder is never a
// substitute for a label).
//
// When a field has an error it gets aria-invalid and aria-describedby, so a
// screen reader announces the message with the field instead of leaving the
// error as loose red text somewhere on the page.

import { escapeHtml } from '../html.js';

/**
 * The label, and the error line underneath.
 *
 * @param {object} options
 * @param {string} options.name
 * @param {string} options.label
 * @param {boolean} [options.required]
 * @param {string} [options.error]
 * @param {string} [options.hint]
 * @param {string} options.control The input, select or textarea HTML.
 */
function wrap({ name, label, required, error, hint, control }) {
  return `
    <div class="field${error ? ' field-invalid' : ''}">
      <label class="field-label" for="field-${name}">
        ${escapeHtml(label)}${required ? ' <span class="field-required">*</span>' : ''}
      </label>
      ${control}
      ${hint ? `<span class="field-hint" id="hint-${name}">${escapeHtml(hint)}</span>` : ''}
      ${error ? `<span class="field-error" id="error-${name}">${escapeHtml(error)}</span>` : ''}
    </div>`;
}

/** The attributes that tie an input to its hint and error text. */
function describedBy(name, error, hint) {
  const ids = [hint ? `hint-${name}` : '', error ? `error-${name}` : '']
    .filter(Boolean)
    .join(' ');
  return `${error ? ' aria-invalid="true"' : ''}${ids ? ` aria-describedby="${ids}"` : ''}`;
}

/**
 * A single-line input: text, tel, number or date.
 *
 * @param {object} options
 * @param {string} options.name
 * @param {string} options.label
 * @param {string} [options.type]
 * @param {string | number} [options.value]
 * @param {boolean} [options.required]
 * @param {string} [options.error]
 * @param {string} [options.hint]
 * @param {string} [options.placeholder]
 * @param {string} [options.inputMode]
 * @param {number} [options.min]
 * @param {boolean} [options.readOnly]
 */
export function textField(options) {
  const {
    name, type = 'text', value = '', placeholder = '', inputMode, min, readOnly,
    required, error, hint,
  } = options;

  const control = `
    <input
      class="field-input"
      id="field-${name}"
      name="${escapeHtml(name)}"
      type="${escapeHtml(type)}"
      value="${escapeHtml(value)}"
      ${placeholder ? `placeholder="${escapeHtml(placeholder)}"` : ''}
      ${inputMode ? `inputmode="${escapeHtml(inputMode)}"` : ''}
      ${min != null ? `min="${escapeHtml(min)}"` : ''}
      ${readOnly ? 'readonly' : ''}
      ${required ? 'required' : ''}
      ${describedBy(name, error, hint)}
    >`;

  return wrap({ ...options, control });
}

/**
 * A dropdown built from one of the model maps.
 *
 * @param {object} options
 * @param {string} options.name
 * @param {string} options.label
 * @param {Record<string, string>} options.options
 * @param {string} [options.value]
 * @param {string} [options.placeholder] The first, empty choice.
 * @param {boolean} [options.required]
 * @param {string} [options.error]
 * @param {string} [options.hint]
 */
export function selectField(options) {
  const { name, value = '', placeholder = 'בחרי…', required, error, hint } = options;

  const choices = Object.entries(options.options)
    .map(
      ([key, text]) =>
        `<option value="${escapeHtml(key)}"${key === value ? ' selected' : ''}>${escapeHtml(text)}</option>`
    )
    .join('');

  const control = `
    <select
      class="field-input"
      id="field-${name}"
      name="${escapeHtml(name)}"
      ${required ? 'required' : ''}
      ${describedBy(name, error, hint)}
    >
      <option value=""${value ? '' : ' selected'}>${escapeHtml(placeholder)}</option>
      ${choices}
    </select>`;

  return wrap({ ...options, control });
}

/**
 * A multi-line input.
 *
 * @param {object} options
 * @param {string} options.name
 * @param {string} options.label
 * @param {string} [options.value]
 * @param {number} [options.rows]
 * @param {string} [options.placeholder]
 * @param {string} [options.error]
 * @param {string} [options.hint]
 */
export function textareaField(options) {
  const { name, value = '', rows = 3, placeholder = '', error, hint } = options;

  const control = `
    <textarea
      class="field-input field-textarea"
      id="field-${name}"
      name="${escapeHtml(name)}"
      rows="${rows}"
      ${placeholder ? `placeholder="${escapeHtml(placeholder)}"` : ''}
      ${describedBy(name, error, hint)}
    >${escapeHtml(value)}</textarea>`;

  return wrap({ ...options, control });
}

/**
 * A group of checkboxes – used where more than one answer is allowed.
 *
 * @param {object} options
 * @param {string} options.name
 * @param {string} options.legend
 * @param {Record<string, string>} options.options
 * @param {string[]} [options.values]
 * @param {string} [options.hint]
 */
export function checkboxGroup({ name, legend, options, values = [], hint }) {
  const boxes = Object.entries(options)
    .map(
      ([key, text], index) => `
        <label class="choice">
          <input
            type="checkbox"
            name="${escapeHtml(name)}"
            id="field-${name}-${index}"
            value="${escapeHtml(key)}"
            ${values.includes(key) ? 'checked' : ''}
          >
          <span>${escapeHtml(text)}</span>
        </label>`
    )
    .join('');

  return `
    <fieldset class="field choice-group">
      <legend class="field-label">${escapeHtml(legend)}</legend>
      ${hint ? `<span class="field-hint">${escapeHtml(hint)}</span>` : ''}
      <div class="choices">${boxes}</div>
    </fieldset>`;
}

/**
 * A group of radio buttons – used where exactly one answer is allowed and all
 * the options are worth seeing at once.
 *
 * @param {object} options
 * @param {string} options.name
 * @param {string} options.legend
 * @param {Record<string, string>} options.options
 * @param {string} [options.value]
 * @param {boolean} [options.required]
 * @param {string} [options.error]
 */
export function radioGroup({ name, legend, options, value = '', required, error }) {
  const buttons = Object.entries(options)
    .map(
      ([key, text], index) => `
        <label class="choice">
          <input
            type="radio"
            name="${escapeHtml(name)}"
            id="field-${name}-${index}"
            value="${escapeHtml(key)}"
            ${key === value ? 'checked' : ''}
          >
          <span>${escapeHtml(text)}</span>
        </label>`
    )
    .join('');

  return `
    <fieldset class="field choice-group${error ? ' field-invalid' : ''}">
      <legend class="field-label">
        ${escapeHtml(legend)}${required ? ' <span class="field-required">*</span>' : ''}
      </legend>
      <div class="choices">${buttons}</div>
      ${error ? `<span class="field-error" id="error-${name}">${escapeHtml(error)}</span>` : ''}
    </fieldset>`;
}

/**
 * A single yes/no checkbox.
 *
 * @param {object} options
 * @param {string} options.name
 * @param {string} options.label
 * @param {boolean} [options.checked]
 */
export function toggleField({ name, label, checked }) {
  return `
    <div class="field">
      <label class="choice">
        <input
          type="checkbox"
          id="field-${name}"
          name="${escapeHtml(name)}"
          value="yes"
          ${checked ? 'checked' : ''}
        >
        <span>${escapeHtml(label)}</span>
      </label>
    </div>`;
}
