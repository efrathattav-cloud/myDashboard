# LeadFlow – Smart Lead Dashboard

LeadFlow is a simple, mobile-first dashboard for managing leads in a small coaching business. It helps the business owner see where her business stands, who she needs to get back to, and which marketing channels bring in paying clients.

This is an MVP demo: it runs entirely in the browser, with fictional demo data and no backend or database.

- Product requirements: [`SPEC.en.md`](SPEC.en.md)
- Development practices: [`PRACTICE.md`](PRACTICE.md)

## Status

The MVP is complete: all 24 acceptance criteria in `SPEC.en.md` pass.

Done:

- [x] Project foundation and layout (mobile bottom navigation, desktop sidebar, "New Lead" button, screen routing)
- [x] Hebrew interface with RTL layout
- [x] Data model and fictional demo data (16 leads)
- [x] Main Dashboard (KPIs, revenue, follow-up alerts, recent leads)
- [x] Leads screen with search and filters
- [x] Add, edit and delete a lead, with validation
- [x] Lead card with details and interaction history
- [x] Recording interactions, marking actions done, quick status change
- [x] Tasks screen (overdue, today, upcoming)
- [x] Analytics (conversion rate, funnel, by source, by product)
- [x] Changes saved in the browser, with a Reset Demo Data option
- [x] Accessibility, mobile and RTL review
- [x] All 24 acceptance criteria in `SPEC.en.md` verified

## Features

- **Dashboard** – four KPIs, revenue for the current month, a "needs attention"
  section, and the most recent leads.
- **Leads** – search by name, phone or notes, and five filters that combine.
  The search and filters live in the address bar, so a filtered view survives a
  refresh and can be linked to.
- **Lead form** – add, edit and delete, with validation, multiple products,
  conditional sections for a sale or a reason a lead did not close.
- **Lead card** – every detail, the conversation history, and quick actions:
  record an interaction, mark the pending action done, change the status.
- **Tasks** – overdue, today and upcoming, each with a "done" action.
- **Analytics** – conversion rate, sales funnel, leads and clients by source,
  revenue by source, interest by product, over four periods.
- Changes are saved in the browser, and can be reset to the demo data.

## Technologies

- Plain HTML, CSS, and JavaScript (ES modules)
- No dependencies and no build step
- Hash-based routing (`#/dashboard`, `#/leads`, …), so it works on GitHub Pages without server configuration

## Run locally

ES modules don't load from `file://`, so the folder has to be served by a static server.
From the project folder, run:

```bash
python dev-server.py
```

Then open http://localhost:8010.

`dev-server.py` is a plain static server that also tells the browser not to cache
anything, so edits to CSS and JS show up on refresh. It is used for development
only and is not part of the published site.

## Build

There is no build step. The files in this folder are the production site.

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. In the repository, go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**, then the `main` branch and the `/ (root)` folder.
4. The site will be available at `https://<your-username>.github.io/<repository-name>/`.

Nothing needs configuring. Every path in the project is relative, so the app
works from a repository sub-path, and routing uses the URL hash, so refreshing
on any screen lands on that screen instead of a 404. The empty `.nojekyll` file
stops GitHub processing the files as a Jekyll site.

Verified by serving the repository from a sub-folder and walking every screen.

## Live demo

Not deployed yet.

## Project structure

```text
index.html        App shell (navigation, main area), lang="he" dir="rtl"
css/styles.css    All styles (mobile first, desktop from 900px, RTL-safe)
js/app.js         Routes and navigation rendering
js/router.js      Hash router
js/views/         One file per screen, plus shared field and chart pieces
js/analytics.js   Period filtering and the Analytics figures
js/model.js       Business vocabulary (valid values + Hebrew labels) and data shapes
js/leads.js       Business rules: overdue, stale, revenue, conversion rate, filtering
js/validation.js  Form validation rules
js/store.js       Holds the app's leads, and saves them in the browser
js/dates.js       Date helpers ('YYYY-MM-DD' strings)
js/demo-data.js   16 fictional demo leads
js/html.js        escapeHtml, for user text going into HTML
js/icons.js       Inline SVG icons
dev-server.py     Local no-cache dev server (not deployed)
```
