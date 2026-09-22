# LeadFlow – Smart Lead Dashboard

LeadFlow is a simple, mobile-first dashboard for managing leads in a small coaching business. It helps the business owner see where her business stands, who she needs to get back to, and which marketing channels bring in paying clients.

This is an MVP demo: it runs entirely in the browser, with fictional demo data and no backend or database.

- Product requirements: [`SPEC.en.md`](SPEC.en.md)
- Development practices: [`PRACTICE.md`](PRACTICE.md)

## Status

Work in progress. Done so far:

- [x] Project foundation and layout (mobile bottom navigation, desktop sidebar, "New Lead" button, screen routing)
- [x] Hebrew interface with RTL layout

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

## Live demo

Not deployed yet.

## Project structure

```text
index.html        App shell (navigation, main area), lang="he" dir="rtl"
css/styles.css    All styles (mobile first, desktop from 900px, RTL-safe)
js/app.js         Routes and navigation rendering
js/router.js      Hash router
js/views.js       Screen views
js/icons.js       Inline SVG icons
dev-server.py     Local no-cache dev server (not deployed)
```
