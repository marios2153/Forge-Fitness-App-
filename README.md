<p align="center">
  <img src="logo.svg" alt="Forge logo" width="96" height="96">
</p>

# Forge — Gym Tracker

A mobile-first workout tracker built as an installable Progressive Web App. Build a workout from scratch, run it set by set with a live timer, and get a detailed breakdown when you finish.

No build step, no framework, no dependencies. Three files and it runs.

---

## Features

### Workout builder
Create a session from nothing: name it, pull exercises from a library of 30+ movements across eight categories, and set the sets, reps and rest for each one individually. Reorder exercises, remove them, or define your own if it isn't in the library. Save it as a template and start it again any time.

### Guided runner
Start a workout and the app walks you through it:

- A circular timer fills at the start of each set and drains as you work.
- Completing a set **stops** the clock. Rest as long as you want; the next set starts only when you tap.
- Finishing an exercise waits for you before moving to the next one.
- Set counts can be adjusted mid-workout if you decide to add or drop one.
- A hydration reminder appears once you pass the halfway mark of the session.

### Session reports
When the last exercise is done you get: total session length, total reps, total sets, and for every exercise its completed-vs-planned sets, working time, the duration of each individual set, plus fastest and average set times. Every report is saved to your history.

### Training calendar
Tap a date to cycle it through **training day → rest day → clear**. Training days carry a start time, a duration and an optional note. Mark sessions complete as you do them. A monthly panel tracks planned days, rest days, completion rate and total scheduled hours.

### Social
Search for other members, send friend requests and gym invites. An inbox surfaces incoming friend requests and gym invites with accept and decline actions. An activity feed shows what your training partners have been doing.

### Goals and progress
Set measurable goals with target dates and watch progress bars fill. Track weekly volume, personal records, and upload progress photos for visual check-ins.

### AI Coach
Ask a chat-style assistant about sets, reps, rest, protein, calories, recovery, technique or plateaus — it stays scoped to training and nutrition. Free accounts get a handful of questions a day with a short answer; Premium gets unlimited questions with fuller, more detailed replies. Quick-tap suggested questions are available, and the whole thread is saved per account. Works out of the box with a built-in local answer engine; point it at a real model instead by running the included example backend (`coach-server-example.js`) and setting `window.FORGE_COACH_ENDPOINT`.

### Achievements
Fifteen badges — bronze through elite — unlock from real activity: your first workout, a seven-day streak, 100 sessions logged, an early-morning or late-night session, five templates built, three friends added, and more. Badges are visible on your profile.

### Custom avatars
A Premium perk: pick from a set of inline SVG avatar icons and recolour them from an eight-colour palette. Falls back to your initials if you don't set one.

### Training reminders
Turn on weekly workout reminders (with a browser notification permission prompt) and schedule a specific day and time for the app to nudge you.

### Forge Premium
A subscription tier presented across five tabs — Overview, Benefits, Pricing, Nutrition and Extras:

- **Nutrition** (subscribers only): pick a goal — build muscle, lose fat, endurance, or general health — and get calorie and macro targets with an explanation of the reasoning. Ten full recipes filtered by meal type, each with ingredients, step-by-step method, complete nutrition facts, and a note on why it suits your goal.
- **Extras**: daily tracking for meals, water, calories and steps; nine colour themes including neon variants; monthly summary reports.

### Accounts
Multiple accounts coexist in the same browser. Passwords are hashed rather than stored in plain text. The session survives a page reload, so you stay signed in. Every account keeps its own workouts, reports, calendar and inbox.

### Other
Seven interface languages (English, Spanish, French, German, Portuguese, Greek, Arabic) with full right-to-left support for Arabic. Installable to a phone home screen as a PWA.

---

## Getting started

Clone and open. That's the whole setup.

```bash
git clone https://github.com/YOUR-USERNAME/forge-gym-tracker.git
cd forge-gym-tracker
```

Because the app registers a web manifest, serve it over HTTP rather than opening the file directly:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

To try it without a server, open `preview.html` — a single self-contained file with the CSS and JavaScript inlined.

### Install on a phone

Open the served URL in Chrome or Safari on your phone and choose **Add to Home Screen**. It launches full-screen with its own icon.

---

## Project structure

```
index.html                  Markup for every screen and modal
styles.css                  All styling
app.js                      All application logic
manifest.json               PWA manifest
logo.svg                    App icon
preview.html                Generated single-file build for quick testing
coach-server-example.js     Example Node/Express backend for the AI Coach (keeps the model API key server-side)
```

### Rebuilding the preview

`preview.html` is generated by inlining the other three files:

```python
import re
html = open("index.html", encoding="utf-8").read()
css  = open("styles.css", encoding="utf-8").read()
js   = open("app.js", encoding="utf-8").read()

html = html.replace('<link rel="stylesheet" href="styles.css" />', f'<style>{css}</style>')
html = re.sub(r'\s*<link rel="manifest" href="manifest.json" />', '', html)
html = html.replace('<script src="app.js"></script>', f'<script>{js}</script>')

open("preview.html", "w", encoding="utf-8").write(html)
```

---

## Data storage

Everything lives in `localStorage`. Keys ending in a user identifier are scoped per account.

| Key | Contents |
| --- | --- |
| `forge-accounts` | All registered accounts with hashed passwords |
| `forge-session` | Email of the signed-in user |
| `forge-profile` | Active user's profile |
| `forge-workouts-{user}` | Saved workout templates |
| `forge-reports-{user}` | Completed session reports |
| `forge-calendar-{user}` | Training and rest days with times |
| `forge-requests-{user}` | Pending friend requests and gym invites |
| `forge-friends-{user}` | Accepted friend connections |
| `forge-goals-{user}` | Saved goals and progress |
| `forge-prs-{user}` | Personal records per exercise |
| `forge-badges-{user}` | Earned achievement badges |
| `forge-avatar-{user}` | Chosen custom avatar (art + colour) |
| `forge-workout-count-{user}` | Saved-template counter shown in the UI |
| `forge-coach-{user}` | AI Coach conversation history |
| `forge-coach-usage-{user}` | AI Coach daily question count (free tier) |
| `forge-premium` | Subscription state |
| `forge-subscription` | Subscription details (plan, start date, card's last 4 digits) |
| `forge-billing` | Selected billing plan (monthly/yearly) at checkout |
| `forge-nutrition-goal` | Selected nutrition goal |
| `forge-theme` | Chosen colour theme |
| `forge-language` | Interface language |
| `forge-reminders` | Whether weekly workout reminders are enabled |
| `forge-reminder-settings` | Chosen reminder day and time |
| `forge-tracking` | Today's Extras tracking (meals, water, calories, steps) |
| `forge-sets` | Logged sets used for the monthly Extras report |
| `forge-last-invite` | Most recent gym invite sent |

Clearing browser data wipes everything. There is no server, so nothing syncs between devices.

---

## Taking payments for real

The checkout in the app is a **demo**. It accepts any input and flips a flag in `localStorage`, which anyone can edit from DevTools. Do not ship it as-is.

To handle real subscriptions:

1. **Payment provider.** Create a [Stripe](https://stripe.com) account and add a product with two prices: monthly (€5.99) and yearly (€64.69, a 10% saving). Use **Stripe Checkout** so card details never touch your code and you avoid PCI scope.

2. **Backend.** You need a server — Node/Express, Firebase Functions, Supabase Edge Functions, anything. The browser cannot hold your Stripe secret key. The server creates checkout sessions and answers "is this user a subscriber?"

3. **Webhooks.** Stripe posts events (`checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`) to your server. Update your database there. The premium flag must live server-side, not in `localStorage`.

4. **Invoices.** Stripe emails receipts automatically. In Greece, legal invoicing also requires reporting to **myDATA** (AADE), usually through a provider such as Elorus, Softone or Epsilon Net.

5. **VAT.** Enable **Stripe Tax** — mandatory for digital services sold across the EU.

6. **App stores.** Apple and Google forbid Stripe for digital subscriptions in native apps. You would need Apple In-App Purchase and Google Play Billing (15–30% commission). [RevenueCat](https://www.revenuecat.com) unifies both.

Flow in one line: *user taps Subscribe → server creates a Stripe Checkout session → user pays on Stripe → webhook updates your database → app asks the server whether the user is premium.*

---

## Roadmap

- Backend with real authentication and cross-device sync
- Weight and volume logging per set inside the runner
- Multi-month calendar navigation
- Real friend connections instead of local placeholders
- Exercise demonstration videos
- Apple Health and Google Fit integration

---

## Browser support

Any modern browser: Chrome, Edge, Safari, Firefox, and their mobile versions. Uses ES2020 syntax, CSS Grid and Flexbox.

---

## Contributing

Issues and pull requests are welcome. Keep the zero-dependency approach — no frameworks, no build step.

---

## License

MIT
