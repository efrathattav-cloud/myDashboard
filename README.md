# LeadFlow – Smart Lead Dashboard

LeadFlow is a simple, mobile-first dashboard for managing leads in a small coaching business. It helps the business owner see where her business stands, who she needs to get back to, and which marketing channels bring in paying clients.

This is an MVP demo: it runs entirely in the browser, with fictional demo data and no backend or database.

- Product requirements: [`SPEC.md`](SPEC.md) (Hebrew), [`SPEC.en.md`](SPEC.en.md) (English)
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

- **Dashboard** – four KPIs each with a line of context, revenue for the
  current month, the leads waiting on you *by name* with a "done" button,
  where the paying clients come from, and the most recent leads.
- **Leads** – search by name, phone or notes, and five filters that combine.
  The search and filters live in the address bar, so a filtered view survives a
  refresh and can be linked to.
- **Lead form** – add, edit and delete, with validation, multiple products,
  conditional sections for a sale or a reason a lead did not close.
- **Lead card** – every detail, the conversation history, and quick actions:
  record an interaction, mark the pending action done, change the status.
- **Tasks** – overdue, today and upcoming, each group collapsible, each task
  with a "done" action.
- **Analytics** – conversion rate, sales funnel, why leads did not close,
  leads and clients by source, revenue by source, interest by product, over
  four periods.
- Changes are saved in the browser, and can be reset to the demo data.
- **Optional Airtable backend** – keep the leads in an Airtable table instead.
- **CSV export** – two files, ready to import into Airtable or a spreadsheet.

## Using Airtable as the database

**Settings** (linked from the bottom of the Dashboard) can point the app at an
Airtable table instead of this browser. The leads are then fetched when the app
starts and every change is written back in the background.

### About the token

Airtable needs a personal access token, and that token is a key to the whole
base. This site is static and public, so a token written into the code would be
readable by anyone who opened the page or this repository — and bots scan
public repositories for exactly that.

So **the token is never in the code and never in this repository**. It is typed
into the app and kept in that browser's own storage, like the leads. Someone
else opening the published site sees an app asking for their own token, not
this one's data. Clearing site data removes it locally; revoking it properly is
done at Airtable.

When creating the token, give it `data.records:read` and `data.records:write`,
and scope its access to **that one base** rather than the whole account.

### What is and is not synced

| | |
|---|---|
| Lead fields, status, prices, the sale, the reason one did not close | Written to Airtable |
| Interactions | Kept in the browser — one row cannot hold many conversations |
| "Reset demo data" | Only ever touches this browser, never the Airtable table |

A failed write is reported in a status line under the header; the change is not
lost, because the browser keeps its own copy either way. If the app cannot
reach Airtable at startup it carries on with that copy rather than showing an
empty screen.

The table must have the Hebrew column names the export produces — the two match
on purpose, so a table built by importing the CSV works as-is.

## Exporting to Airtable

At the bottom of the Dashboard, **ייצוא הנתונים** downloads two files:

| File | One row per | Key columns |
|---|---|---|
| `leadflow-leads-<date>.csv` | lead | everything about her, plus `מזהה` (her id) |
| `leadflow-interactions-<date>.csv` | conversation | `ליד` (her name), `מזהה הליד` (her id) |

Two files rather than one, because a lead has many conversations and a single
row cannot hold them. That is also how the data wants to be modelled in
Airtable: a table of leads, a table of interactions, and a link between them.

To import:

1. In Airtable, **Add a table → Import data → CSV file**, and upload the leads
   file. Airtable creates a field per column.
2. Set **מתעניינת ב** to *Multiple select*. The values are comma-separated, so
   Airtable splits them into separate options.
3. Set the date columns to *Date* and the price columns to *Number*.
4. Import the interactions file the same way, into a second table.
5. In the interactions table, change **ליד** to *Link to another record* and
   point it at the leads table. Airtable matches on the lead's name.

Both files are UTF-8 with a byte order mark, so Hebrew opens correctly in
Excel as well as in Airtable and Google Sheets. The files are built in the
browser and never leave the computer.

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

**https://efrathattav-cloud.github.io/myDashboard/**

Fictional demo data. Anything you change is saved in your own browser only,
and "Reset Demo Data" at the bottom of the Dashboard puts it back.

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
js/store.js       Holds the app's leads; saves to the browser and to Airtable
js/airtable.js    Airtable API client and the mapping to and from a lead
js/settings.js    Where the leads live, and the token (browser only)
js/dates.js       Date helpers ('YYYY-MM-DD' strings)
js/demo-data.js   16 fictional demo leads
js/html.js        escapeHtml, for user text going into HTML
js/icons.js       Inline SVG icons
dev-server.py     Local no-cache dev server (not deployed)
```
