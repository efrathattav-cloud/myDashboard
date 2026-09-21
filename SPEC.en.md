# LeadFlow – Smart Lead Dashboard

## 1. Project Summary

**LeadFlow** is a simple, smart, and friendly Dashboard for managing leads, built for the small business of an independent mental coach who is just starting out.

The system's goal is to help the business owner:
1. See a clear business snapshot of her leads.
2. Know the status of each lead.
3. Understand what the next action is for each lead, and when.
4. Not miss leads that need follow-up.
5. Understand which marketing channels bring in the most leads.
6. Understand which channels actually bring in paying clients.
7. Track revenue from closed leads.

In the first phase, the system is intended for a single user only – the business owner.

---

## 2. Target Audience

The main user is an independent mental coach at the start of her journey, who handles marketing, intro calls, follow-up, and sales herself.

Most leads come through:
- WhatsApp
- Instagram
- Facebook
- Word of mouth / referrals

The system needs to be simple enough for daily use, without feeling like a heavy CRM or a complex enterprise system.

---

## 3. Business Goals

### Main goals
- Don't lose leads due to lack of follow-up.
- Know at any moment what the next step is with each lead.
- Identify hot leads.
- Understand the main source of leads.
- Compare a source that brings many inquiries with a source that brings many paying clients.
- Measure the conversion rate from lead to client.
- Track revenue generated from leads.

### Questions the system should help answer
- How many leads do I have right now?
- How many new leads came in this week / this month?
- How many hot leads do I have?
- How many leads became clients?
- Who needs follow-up from me today?
- Who haven't I spoken with in several days?
- Which source brings the most inquiries?
- Which source brings the most paying clients?
- Which product generates the most interest?
- How much revenue was generated from closed leads?

---

## 4. Scope – First Version (MVP)

In the first version:

### Included
- Adding leads manually.
- Editing leads.
- Deleting leads.
- Displaying a list of leads.
- Filtering and search.
- Statuses.
- Manual temperature level.
- Interaction history.
- Next action + date.
- Alerts for leads that need follow-up.
- Business Dashboard.
- Basic charts.
- Sales funnel.
- Tracking closed clients.
- Tracking the actual sale amount.
- Fictional Demo data.

### Not included in the first version
- A real Database.
- Login / permissions.
- Multiple users.
- Real WhatsApp integration.
- Real Facebook integration.
- Real Instagram integration.
- Integration with a lead form.
- Sending messages from within the system.
- Payment processing.
- Real AI.
- Automatic Lead Score.

The system should be built so that integrations of this kind can be added in the future.

---

## 5. UX/UI Principles

### Mobile First
The system is intended first and foremost for use on a phone.

The interface should be designed with a **Mobile First** approach, and only afterward adapted for Tablet and Desktop screens.

### Design style
- Professional.
- Modern.
- Clean.
- Pleasant.
- Soft colors, but not childish.
- Should not look like a heavy Enterprise system.
- Plenty of whitespace.
- Clear cards.
- Readable typography.
- Prominent action buttons.
- Important information should be understandable at a glance.

### Suggested navigation
On mobile, use Bottom Navigation with 4 sections:

1. Dashboard
2. Leads
3. Tasks / Follow-up
4. Analytics

A prominent `+ New Lead` button should be easily accessible.

---

# 6. Screen 1 – Main Dashboard

This is the first screen that opens.

The top priority on this screen is the **business picture**, and only after that tasks and follow-up.

## 6.1 KPI Cards

At the top, 4 large cards will be displayed:

### Total Leads
The total number of leads in the system.

### New Leads
The number of leads added in the selected period.

Default: the current month.

### Hot Leads
The number of leads whose temperature level is set to "Hot".

### Clients Closed
The number of leads whose status is "Closed as client".

Where possible, a small change compared to the previous period can be shown below the card.

---

## 6.2 Revenue

Show an additional card or a clear section:

**Revenue from leads closed this month**

The calculation will be based on the actual price recorded when the lead was closed.

For example:

`₪8,690 revenue this month`

---

## 6.3 Follow-up Alerts

A prominent section:

### "Needs attention"

Examples:
- `3 leads haven't received a response in more than 5 days`
- `2 follow-up actions scheduled for today`
- `1 overdue follow-up action`

Clicking an alert leads to the list of relevant leads.

### Alert rule
If the "next action" date has passed and it hasn't been marked as done:
- The lead will be shown in the "Needs attention" section.
- The lead's row will get a red / warning marker.
- In Tasks it will be shown as overdue.

If there has been no interaction with a lead for more than 5 days:
- An alert should be shown.
- The lead should be marked as needing attention.

---

## 6.4 Recent Leads Table / List

On mobile, use cards or a Responsive table.

Fields to display:

| Field | Example |
|---|---|
| Name | Dana |
| Source | Instagram |
| Status | New |
| Temperature | Hot |
| Interested in | Personal coaching |
| Last conversation | 15/09 |
| Next step | Send a message |
| Next step date | 18/09 |

Sample data:

| Name | Source | Status | Interest | Last conversation | Next step |
|---|---|---|---|---|---|
| Dana | Instagram | New | Personal coaching | 15/09 | Send a message |
| Michal | Referral | Contacted | Starting to Move | 16/09 | Call |
| Yael | Facebook | Considering | Personal coaching | 17/09 | Send an offer |

Clicking a lead opens the full lead card.

---

# 7. Screen 2 – Leads

The screen that brings together all leads.

## 7.1 Search

Search field by:
- Name
- Phone
- Notes

---

## 7.2 Filters

Option to filter by:

### Source
- WhatsApp
- Instagram
- Facebook
- Referral / word of mouth
- Other

### Status
- New
- Contacted
- Intro call scheduled
- After intro call
- Considering
- In follow-up
- Closed as client
- Not closed

### Temperature
- Cold
- Medium
- Hot

### Product
- Personal coaching
- Starting to Move
- 5-Day Challenge

### Follow-up
- Needs follow-up today
- Overdue
- No next action
- No interaction for over 5 days

---

## 7.3 Leads View

Each lead will be displayed clearly with:
- Name
- Source
- Status
- Temperature
- Product
- Next step
- Action date

Leads that need follow-up will get a clear visual marker.

---

# 8. Screen 3 – Add New Lead

The button:

`+ New Lead`

opens a Form.

## Required fields

- Name
- Phone
- Source
- Status
- Temperature

## Additional fields

### Lead source
Dropdown:
- WhatsApp
- Instagram
- Facebook
- Referral / word of mouth
- Other

If "Other" is selected, allow free text.

### What is she interested in?
Multi-select:
- Personal coaching
- Starting to Move
- 5-Day Challenge

Selecting more than one product must be allowed.

### Reason for interest
Textarea.

The business question:
`What made her reach out / what does she want to change or solve?`

### Date of first contact

### Date of last conversation

### Status

Dropdown:
- New
- Contacted
- Intro call scheduled
- After intro call
- Considering
- In follow-up
- Closed as client
- Not closed

### Temperature

Manual selection:
- Cold
- Medium
- Hot

Important:
Temperature is not a status.

For example:
A lead can have the status "Considering" and a temperature of "Hot".

### Price offered
Number in shekels (ILS).

### Was a discount offered?
Boolean:
- Yes
- No

If yes:
- Discount amount / percentage
- Price after discount

### Next action

Dropdown:
- Send a message
- Call
- Schedule an intro call
- Send details
- Send an offer
- Follow-up
- Other

If "Other" is selected:
Show a free-text field.

### Next action date

### Notes
Textarea.

---

# 9. Screen 4 – Lead Card

Clicking a lead opens the Lead Details Screen.

## 9.1 Header

Display:
- Lead name.
- Phone number.
- Source.
- Status.
- Temperature.

Quick actions:
- Edit.
- Add interaction.
- Change status.
- Mark action as done.

---

## 9.2 Lead Details

Display:
- Name.
- Phone.
- Source.
- Products she was interested in.
- Reason for interest.
- Date of first lead contact.
- Date of last interaction.
- Status.
- Temperature.
- Price offered.
- Whether a discount was offered.
- Price after discount.
- Next action.
- Action date.
- Notes.

---

## 9.3 Interaction History

Chronological timeline.

Each interaction will include:
- Date.
- Action type.
- Short note.

Example:

`17/09 | Phone call | Interested in coaching, wants to check her budget`

`19/09 | WhatsApp | Sent her details about the process`

`22/09 | Follow-up | Asked me to get back to her after the holiday`

---

## 9.4 Add Interaction

Button:
`+ Add Interaction`

Fields:
- Date.
- Interaction type:
  - Phone call
  - WhatsApp
  - Zoom
  - Instagram
  - Facebook
  - Email
  - Other
- Note.

After saving an interaction:
- Automatically update the "Last conversation / interaction date".

---

# 10. Closing a Lead as a Client

When the status changes to:

`Closed as client`

Additional fields should be shown:

- What did she purchase?
- Price offered.
- Actual agreed price.
- Closing date.
- Has she paid?
- Payment method.
- Number of installments.
- Notes.

### Products
- Personal coaching
- Starting to Move
- 5-Day Challenge

The actual price will be used to calculate revenue on the Dashboard.

---

# 11. A Lead That Didn't Close

When the status changes to:

`Not closed`

A field should be shown:

### Reason for not closing

Options:
- Price too high.
- Not the right time.
- Chose another solution / professional.
- Didn't get back to me.
- Not a good fit for her.
- Changed her mind.
- Other.

If "Other" is selected:
Short textarea.

The data should be saved so that Analytics on reasons for not closing can be shown in the future.

---

# 12. Screen 5 – Tasks / Follow-up

A dedicated screen for actions that need to be done.

Sections:

### Today
Actions whose due date is today.

### Overdue
Actions whose due date has passed.

### Upcoming
Actions for the coming days.

Each task will show:
- Lead name.
- Action.
- Date.
- Status.
- Temperature.
- A `Done` button.

Clicking `Done`:
- Marks the action as completed.
- Allows adding an interaction.
- Allows setting a new next action.

---

# 13. Screen 6 – Analytics

The goal is not to create a complex BI system, but to show a few useful business metrics.

## 13.1 Period filter

Options:
- This week.
- This month.
- 3 months.
- All.

---

## 13.2 Leads by Source

A chart showing how many leads came from each source:

- WhatsApp
- Instagram
- Facebook
- Referral / word of mouth
- Other

---

## 13.3 Clients by Source

A separate chart showing how many paying clients came from each source.

The goal is to show the difference between:
**a channel that brings many inquiries**
and:
**a channel that actually brings paying clients.**

---

## 13.4 Conversion Rate

Display:

`Number of clients closed / number of leads × 100`

For example:

`15% Conversion Rate`

---

## 13.5 Sales Funnel

Show a basic Funnel:

`Leads → Intro calls → Offers / Considering → Clients`

For example:

- 30 leads.
- 18 reached an intro call.
- 10 reached the offer / considering stage.
- 5 became clients.

---

## 13.6 Revenue by Source

If there is enough data, show:
- Revenue from Instagram.
- Revenue from Facebook.
- Revenue from WhatsApp.
- Revenue from referrals.

---

## 13.7 Interest by Product

Show how many leads were interested in each product:

- Personal coaching.
- Starting to Move.
- 5-Day Challenge.

---

# 14. Data Model

## Lead

```ts
type Lead = {
  id: string;
  name: string;
  phone: string;

  source:
    | "whatsapp"
    | "instagram"
    | "facebook"
    | "referral"
    | "other";

  customSource?: string;

  products: Product[];

  interestReason?: string;

  createdAt: string;
  lastInteractionAt?: string;

  status: LeadStatus;

  temperature:
    | "cold"
    | "medium"
    | "hot";

  offeredPrice?: number;

  discountOffered: boolean;
  discountAmount?: number;
  finalOfferedPrice?: number;

  nextAction?: NextAction;
  customNextAction?: string;
  nextActionDate?: string;

  notes?: string;

  interactions: Interaction[];

  sale?: Sale;

  lostReason?: LostReason;
  customLostReason?: string;
};
```

---

## Product

```ts
type Product =
  | "personal_coaching"
  | "starting_to_move"
  | "five_day_challenge";
```

---

## LeadStatus

```ts
type LeadStatus =
  | "new"
  | "contacted"
  | "intro_call_scheduled"
  | "after_intro_call"
  | "considering"
  | "follow_up"
  | "won"
  | "lost";
```

---

## NextAction

```ts
type NextAction =
  | "send_message"
  | "call"
  | "schedule_intro_call"
  | "send_details"
  | "send_offer"
  | "follow_up"
  | "other";
```

---

## Interaction

```ts
type Interaction = {
  id: string;
  date: string;

  type:
    | "phone"
    | "whatsapp"
    | "zoom"
    | "instagram"
    | "facebook"
    | "email"
    | "other";

  note?: string;
};
```

---

## Sale

```ts
type Sale = {
  product: Product;
  closedAt: string;
  agreedPrice: number;
  paid: boolean;

  paymentMethod?:
    | "credit_card"
    | "bank_transfer"
    | "bit"
    | "cash"
    | "other";

  installments?: number;
  notes?: string;
};
```

---

# 15. Demo Data

The app should load with at least 12–15 fictional leads.

It's important that the data demonstrates:
- Different sources.
- Different products.
- Different statuses.
- Different temperature levels.
- Several overdue leads.
- Several actions for today.
- Several closed clients.
- Several leads that didn't close.
- At least a few sales with different amounts.

Sample names:
- Dana Levi
- Michal Cohen
- Yael Israeli
- Noa Edri
- Keren Shalom
- Roni Shahar

Do not use real client details.

---

# 16. Persistence in the Demo Version

No real Database is needed.

You can use:
- Local state in the app.
- LocalStorage so changes don't disappear on page refresh.

LocalStorage is preferred if it doesn't significantly complicate the implementation.

Add an option:

`Reset Demo Data`

to restore the demo data to its initial state.

---

# 17. Responsive Design

### Mobile
This is the main target.

- KPI cards in a grid suited to a narrow screen.
- Leads list as cards.
- Bottom Navigation.
- Action buttons large enough to tap.
- Forms with one field per row.
- A Floating Action Button for "New Lead" is an option.

### Desktop
- Sidebar or Top Navigation.
- KPI cards in a row.
- Leads can switch to a full table view.
- Analytics can be displayed in a grid.

---

# 18. Empty States

Create clear states for when there is no data.

Examples:

### No leads
`No leads yet. Add your first lead.`

Button:
`+ Add Lead`

### No tasks for today
`All caught up 🎉 No follow-up actions for today.`

### No search results
`No leads match your search or filters.`

---

# 19. Validation

Perform basic Validation.

### New lead
- Name is required.
- Phone is required.
- Source is required.
- Status is required.
- Temperature is required.

### Action date
If there is a next action, it's recommended to require a date as well.

### Closing a sale
If status = won:
- Purchased product is required.
- Agreed price is required.
- Closing date is required.

---

# 20. Important Behaviors

### Overdue
If:

`nextActionDate < today`

and the action has not yet been done:

- Show a warning.
- Mark the lead in red / an alert color.
- Show it in Tasks under "Overdue".

### Stale Lead
If there has been no interaction for more than 5 days and the lead is still active:
- Show an alert.
- Do not apply to leads with status won or lost.

### New Lead
A lead is considered "new" for KPI purposes when it was created within the selected time range.

---

# 21. Basic Accessibility Requirements

- Clear contrast.
- Readable text.
- Don't rely on color alone to indicate status.
- Every icon should have a tooltip or label.
- Buttons with clear labels.
- Visible form labels.

---

# 22. Language

Main interface language: **Hebrew**.

The system must support RTL.

Variable names in the code can be in English.

---

# 23. Future Roadmap

Not to be implemented in the first phase, but should be taken into account in the architecture:

### Integrations
- Automatic lead capture from a form.
- Lead capture from WhatsApp.
- Facebook / Instagram integration.
- Email integration.

### Communication
- Sending WhatsApp from the lead card.
- Follow-up templates.
- Automatic reminders.

### Intelligence
- Automatic Lead Score.
- Identifying at-risk leads.
- Next action recommendations.
- Marketing source analysis.
- Revenue forecast.

### Business
- Payment management.
- Tracking future payments.
- Active clients.
- Moving from lead to client within a full Coaching system.

---

# 24. Acceptance Criteria

The MVP will be considered ready when:

1. You can enter the system and see a Dashboard with Demo data.
2. You can add a new lead.
3. You can edit a lead.
4. You can delete a lead.
5. You can select more than one product for a lead.
6. You can change status and temperature.
7. You can set a next action and date.
8. An overdue lead is displayed in a clearly visible way.
9. You can add an interaction to a lead card.
10. The last interaction date is updated.
11. You can mark a lead as a client and save the deal amount.
12. The revenue appears on the Dashboard.
13. You can mark a lead as "Not closed" and choose a reason.
14. You can search and filter leads.
15. The Tasks screen shows actions for today, overdue, and upcoming.
16. Analytics shows leads by source.
17. Analytics shows clients by source.
18. Conversion Rate is displayed.
19. A basic Funnel is displayed.
20. The app is comfortable to use on mobile.
21. The app supports Hebrew and RTL.
22. No server or Database is needed for the Demo.
23. Refresh doesn't erase changes if LocalStorage is used.
24. A Reset Demo Data option exists.

---

# 25. Guiding Principle

LeadFlow is not meant to be a complex CRM.

The user should be able to open the app and answer three questions within a few seconds:

1. **What is the current state of my business in terms of leads?**
2. **Who do I need to get back to right now?**
3. **Where do the clients who actually buy come from?**

Every UX decision or feature should be tested against these three questions.
