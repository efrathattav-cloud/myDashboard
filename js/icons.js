// Simple inline SVG icons (stroke style). Decorative: labels are always shown next to them.

const svg = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

export const icons = {
  dashboard: svg('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  leads: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18.5 14.8c1.6.8 2.7 2.6 3 5.2"/>'),
  tasks: svg('<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2.5v3M16 2.5v3M4 9h16"/><path d="m8.5 14.5 2.2 2.2 4.8-4.7"/>'),
  analytics: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  // Points left, the direction "forward" runs in a right-to-left interface.
  // Drawn rather than typed: the characters < and > are mirrored automatically
  // inside RTL text, which makes them point the wrong way.
  chevronForward: svg('<path d="m14 6-6 6 6 6"/>'),
};
