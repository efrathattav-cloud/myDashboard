# LeadFlow – Development Practices

## 1. Purpose of This File

This file defines the development practices for the LeadFlow project.

`SPEC.en.md` is the source of truth for **what the product should do**.  
`PRACTICE.md` defines **how the project should be developed, changed, tested, documented, and maintained in Git and GitHub**.

When working on the project, always read the relevant parts of `SPEC.en.md` before implementing or changing a feature.

If there is a conflict between an implementation idea and the specification, follow the specification unless the specification is explicitly updated.

---

## 2. Core Development Principles

The project should remain:

- Simple.
- Easy to understand.
- Mobile First.
- Friendly for a single small-business owner.
- Easy to maintain.
- Compatible with Hebrew and RTL.
- Suitable for a demo without a backend or real database.
- Easy to deploy to GitHub Pages.

Do not turn LeadFlow into a complex CRM.

Prefer the simplest implementation that fully satisfies the MVP requirements.

Do not implement items from the Future Roadmap unless explicitly requested.

---

## 3. Before Making Changes

Before starting a new feature or significant change:

1. Read the relevant section of `SPEC.en.md`.
2. Identify the acceptance criteria related to the feature.
3. Check the existing code before creating new components, utilities, types, or styles.
4. Reuse existing project patterns where possible.
5. Avoid unnecessary dependencies.
6. Keep the change focused on one clear goal.

If a requested change is unclear, choose the interpretation that is most consistent with the SPEC and the existing product behavior.

Do not silently change business rules.

---

## 4. Scope Discipline

The first version is an MVP.

The following should remain outside the MVP unless explicitly requested:

- Real database.
- Authentication or permissions.
- Multiple users.
- Real WhatsApp integration.
- Real Facebook or Instagram integration.
- Real form integrations.
- Sending messages from the application.
- Payment processing.
- Real AI.
- Automatic Lead Score.

Use fictional demo data only.

Do not use real client information.

---

## 5. Code Quality

### General

- Keep the code readable and straightforward.
- Prefer clear code over clever code.
- Use descriptive English names for variables, functions, components, and types.
- Avoid duplicated business logic.
- Extract reusable logic when it is used in more than one place.
- Keep components reasonably small and focused.
- Remove dead code and unused imports.
- Do not leave commented-out code unless there is a clear reason.

### Types

Use the data structures defined in `SPEC.en.md` as the basis for the application's types.

Important entities include:

- `Lead`
- `Product`
- `LeadStatus`
- `NextAction`
- `Interaction`
- `Sale`

Do not create conflicting versions of the same business model in different files.

### Business Logic

Business rules such as overdue actions, stale leads, conversion rate, revenue, and KPI calculations should preferably be implemented in reusable helper functions rather than duplicated inside UI components.

Examples:

- A lead is overdue when its next-action date is before today and the action is still pending.
- A lead is stale after more than 5 days without interaction while still active.
- Won and lost leads should not be marked as stale.
- Revenue should use the actual agreed sale price.
- Temperature and status are separate concepts.

---

## 6. UI and UX Practices

### Mobile First

Mobile is the primary target.

Build and verify the mobile experience first, then adapt it to larger screens.

On mobile:

- Forms should normally use one field per row.
- Tap targets should be comfortably sized.
- Important actions should be easy to reach.
- Lead information should remain readable on a narrow screen.
- Avoid horizontal scrolling where possible.
- Bottom navigation should remain clear and usable.

### Hebrew and RTL

The main interface language is Hebrew.

The application must support RTL correctly.

Check:

- Text alignment.
- Form layout.
- Icons next to text.
- Navigation direction.
- Tables or cards.
- Dates and numbers.
- Modal and dropdown layout.

Code identifiers may remain in English.

### Accessibility

Do not rely only on color to communicate meaning.

Always provide:

- Visible labels for form fields.
- Clear button text.
- Sufficient contrast.
- Text or icon support for statuses and warnings.
- Accessible labels or tooltips for icon-only controls.
- Keyboard-friendly controls where practical.

---

## 7. Data and Demo Persistence

The MVP does not require a backend.

Prefer `localStorage` for demo persistence when practical.

The app should:

- Load fictional demo leads on first use.
- Preserve user changes after refresh when LocalStorage is used.
- Allow adding, editing, and deleting leads.
- Persist interactions and sales.
- Include a `Reset Demo Data` action.
- Restore the original demo dataset when reset is confirmed.

Demo data should cover different:

- Lead sources.
- Products.
- Statuses.
- Temperatures.
- Follow-up situations.
- Won leads.
- Lost leads.
- Sale amounts.

Never include real client data, private information, passwords, tokens, or secrets.

---

## 8. Validation and Error Handling

Implement the validation rules defined in the SPEC.

At minimum:

- Name is required.
- Phone is required.
- Source is required.
- Status is required.
- Temperature is required.
- If a next action exists, a date should normally be provided.
- If a lead becomes a client, purchased product, agreed price, and closing date are required.

Validation messages should be clear and shown near the relevant field.

The interface should fail gracefully.

Do not allow a UI error in one lead or chart to break the entire application.

---

## 9. Testing and Verification

Before considering a feature complete, verify the relevant behavior manually.

For significant changes, check at least:

1. The application starts successfully.
2. There are no obvious console errors.
3. Existing features still work.
4. The new feature works with the demo data.
5. The new feature works after adding or editing data.
6. Mobile layout remains usable.
7. Hebrew and RTL remain correct.
8. Data persists after refresh if LocalStorage is enabled.
9. The production build completes successfully.

When relevant, also test:

- Empty states.
- Search with no results.
- Multiple filters.
- Overdue follow-ups.
- Today's tasks.
- Stale leads.
- Won leads.
- Lost leads.
- Multiple product selection.
- Revenue calculations.
- Conversion rate.
- Reset Demo Data.

Fix errors before creating a final commit for the feature.

---

## 10. Git Workflow

Git should document meaningful progress through the project.

### Before Editing

Before making changes:

- Check the current repository status.
- Understand any existing uncommitted changes.
- Do not overwrite unrelated work.

Useful command:

```bash
git status
```

### Commits

Create commits after meaningful, working milestones.

A commit should represent one understandable unit of work.

Examples:

```text
feat: add lead creation form
feat: add follow-up task screen
feat: add analytics dashboard
fix: correct overdue lead calculation
fix: improve mobile lead cards
style: improve RTL dashboard layout
refactor: centralize lead status helpers
docs: update project documentation
```

Prefer concise commit messages that describe what changed.

Do not create meaningless messages such as:

```text
update
changes
fix stuff
final
```

### Before Each Commit

Before committing:

1. Review the changed files.
2. Check for accidental changes.
3. Run the application or relevant checks.
4. Run the production build when practical.
5. Confirm that no secrets or personal information were added.
6. Confirm that the change matches the SPEC.

Useful commands:

```bash
git status
git diff
```

### Git Safety

Do not:

- Force-push unless explicitly requested.
- Rewrite published history without a clear reason.
- Delete large parts of the project without reviewing them first.
- Commit secrets, API keys, passwords, `.env` files containing secrets, or real client information.
- Commit generated dependency folders such as `node_modules`.

Use an appropriate `.gitignore`.

---

## 11. GitHub Practices

The GitHub repository should contain at least:

- Application source code.
- `SPEC.en.md`.
- `PRACTICE.md`.
- `README.md`.
- Dependency/configuration files required to run the project.
- `.gitignore`.

The README should explain:

- What LeadFlow is.
- The purpose of the project.
- Main features.
- How to run it locally.
- How to build it.
- The technologies used.
- Where the live GitHub Pages demo can be found, once available.

Push working milestones to GitHub regularly instead of keeping all work only locally until the end.

---

## 12. GitHub Pages Compatibility

The project should be kept compatible with GitHub Pages when possible.

Before publishing:

1. Confirm the production build works.
2. Confirm asset paths work under the repository's GitHub Pages path.
3. Confirm page refresh and navigation behave correctly.
4. Confirm the deployed application loads demo data.
5. Test the deployed version on mobile.
6. Verify Hebrew and RTL in the deployed version.

If client-side routing causes refresh errors on GitHub Pages, use a routing approach or deployment configuration that is compatible with static hosting.

Do not introduce a server dependency only for deployment.

---

## 13. Documentation Updates

Update documentation when a change affects how the project works.

Update `README.md` when:

- Setup instructions change.
- A major user-facing feature is added.
- Deployment steps change.
- The technology stack changes.

Update `SPEC.en.md` only when the actual product requirements change.

Do not modify the SPEC merely to make an implementation easier.

Update `PRACTICE.md` when the team's development rules or workflow change.

---

## 14. Recommended Development Order

Unless there is a reason to work differently, prefer this order:

1. Project foundation and layout.
2. Demo data and data types.
3. Main Dashboard.
4. Leads list.
5. Add / Edit / Delete lead.
6. Lead details.
7. Interaction history.
8. Follow-up and tasks.
9. Won / Lost lead flows.
10. Analytics and funnel.
11. LocalStorage persistence.
12. Empty states and validation.
13. Mobile and RTL polish.
14. Accessibility review.
15. Final acceptance-criteria review.
16. GitHub Pages deployment.

Each step should leave the project in a working state.

---

## 15. Definition of Done for a Feature

A feature is considered done when:

- It matches the relevant SPEC requirement.
- It works with the current demo data.
- It does not break existing functionality.
- It works on a mobile-sized screen.
- It supports the Hebrew/RTL interface where relevant.
- Validation and empty states are handled where needed.
- There are no obvious console errors.
- The production build succeeds.
- The change is documented if necessary.
- It is committed with a clear Git message.

---

## 16. Final Project Review

Before declaring the MVP complete:

1. Review all acceptance criteria in `SPEC.en.md`.
2. Test the main user journey:
   - Open the Dashboard.
   - Add a lead.
   - Edit the lead.
   - Add an interaction.
   - Set a next action.
   - Mark an overdue action.
   - Close a lead as a client.
   - Confirm revenue changes.
   - Mark another lead as not closed.
   - Search and filter leads.
   - Review Tasks.
   - Review Analytics.
   - Refresh the page.
   - Reset Demo Data.
3. Test the application on a narrow mobile viewport.
4. Test Hebrew and RTL.
5. Run the production build.
6. Review `git status`.
7. Confirm no private information or secrets exist in the repository.
8. Confirm the GitHub repository contains the required documentation.
9. Confirm the GitHub Pages version works, if deployed.

---

## 17. Instructions for Claude Code

When working on LeadFlow, Claude Code should:

1. Read `SPEC.en.md` and this file before major implementation work.
2. Follow the SPEC as the product source of truth.
3. Make focused changes rather than rewriting unrelated parts of the project.
4. Preserve working features unless a change is required.
5. Prefer simple solutions suitable for an educational MVP.
6. Explain any important architectural decision briefly.
7. Avoid adding dependencies without a clear benefit.
8. Check the existing code before creating duplicate logic.
9. Verify the application after meaningful changes.
10. Use clear Git commits at logical milestones.
11. Never commit secrets or real client information.
12. Keep the project deployable as a static GitHub Pages application.
13. Stop scope creep: do not implement Future Roadmap items unless explicitly requested.
14. Before declaring the project complete, review the acceptance criteria in the SPEC.

---

## Guiding Rule

**Build only what is needed, keep it understandable, and leave the repository in a working state after every meaningful step.**
