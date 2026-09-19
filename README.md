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

### Forge Premium
A subscription tier presented across five tabs — Overview, Benefits, Pricing, Nutrition and Extras:

- **Nutrition** (subscribers only): pick a goal — build muscle, lose fat, endurance, or general health — and get calorie and macro targets with an explanation of the reasoning. Ten full recipes filtered by meal type, each with ingredients, step-by-step method, complete nutrition facts, and a note on why it suits your goal.
- **Extras**: daily tracking for meals, water, calories and steps; nine colour themes including neon variants; monthly summary reports.

### Accounts
Real accounts live on the included backend (`server/`): passwords are hashed with bcrypt, sessions are a signed, httpOnly cookie good for 30 days, and signing up sends a verification email from `pixelforgenetworks@gmail.com`. Because the account lives on the server rather than in one browser's `localStorage`, signing in from a different browser or device reaches the same account — no need to create it again. Every account keeps its own workouts, reports, calendar and inbox.

If the server isn't running (for example, `preview.html` opened on its own), the app falls back to a localStorage-only account store scoped to that browser, so the auth screen still works without a backend — just without cross-device sync or email verification.

### Localization
Seven interface languages — English, Spanish, French, German, Portuguese, Greek and Arabic — cover the whole app, not just the menus and buttons: the exercise library, all ten Premium recipes, the AI coach's full knowledge base, achievement badges, and every toast and confirmation message are translated too. Arabic renders fully right-to-left.

Translation is exact-string-based (an English source string maps to its translation per language) and applies live: switching language re-walks the page and re-applies immediately. A `MutationObserver` then keeps watching, so anything the app renders *afterwards* — opening a modal, filtering the exercise library, a friend request arriving, the AI coach replying — gets translated automatically too, without every render function needing to remember to call the translator itself. Form placeholders and dropdown options are translated along with visible text, and dates are formatted using the selected language's locale rather than the browser's.

The AI coach's quick-reply chips (e.g. "How much protein do I need?") resolve to a fixed topic id under the hood, so clicking one always gets the right answer regardless of which language its label is displayed in — free-text questions still rely on keyword matching, which works best in English.

### Other
Installable to a phone home screen as a PWA.

---

## Getting started

Clone and open. That's the whole setup for the frontend; accounts need the backend below.

```bash
git clone https://github.com/YOUR-USERNAME/forge-gym-tracker.git
cd forge-gym-tracker
```

### Option A: with the backend (real accounts, verification emails)

```bash
cd server
npm install
copy .env.example .env   # macOS/Linux: cp .env.example .env
```

Open `server/.env` and fill in:

- `JWT_SECRET` — any long random string (or generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- `GMAIL_APP_PASSWORD` — an [App Password](https://myaccount.google.com/apppasswords) for the `pixelforgenetworks@gmail.com` Gmail account (requires 2-Step Verification on that account). Without this, the server still works — it just prints the verification link to its console instead of emailing it.

Then:

```bash
npm start
```

Visit `http://localhost:8788` — the server hosts the frontend and the `/api/auth/...` endpoints from one process.

### Option B: frontend only (no accounts backend)

Because the app registers a web manifest, serve it over HTTP rather than opening the file directly:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Signing in falls back to browser-local accounts (see [Accounts](#accounts)).

To try it without any server, open `preview.html` — a single self-contained file with the CSS and JavaScript inlined. Auth falls back to local-only accounts here too.

### Install on a phone

Open the served URL in Chrome or Safari on your phone and choose **Add to Home Screen**. It launches full-screen with its own icon.

---

## Project structure

```
index.html                Markup for every screen and modal
styles.css                All styling
app.js                    All application logic
manifest.json             PWA manifest
logo.svg                  App icon
preview.html              Generated single-file build for quick testing
coach-server-example.js   Example backend for the AI Coach feature (separate from accounts)
server/                   Accounts backend: signup, login, sessions, verification email
  index.js                  Express app + all /api/auth/... routes
  db.js                      JSON-file user store (server/data/users.json, gitignored)
  mailer.js                  Sends the verification email via Gmail SMTP
  package.json
  .env.example               Copy to .env and fill in (gitignored)
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

Accounts (email, hashed password, profile, verification status) live in `server/data/users.json`, managed by the backend — not in the browser. Everything else — workouts, reports, calendar, goals, social — still lives in the browser's `localStorage`, scoped per account by email. (`forge-accounts` below is only used by the no-backend fallback described in [Accounts](#accounts).)

| Key | Contents |
| --- | --- |
| `forge-accounts` | Fallback-only account store, used when no backend is running |
| `forge-session` | Email of the signed-in user |
| `forge-profile` | Active user's profile |
| `forge-workouts-{user}` | Saved workout templates |
| `forge-reports-{user}` | Completed session reports |
| `forge-calendar-{user}` | Training and rest days with times |
| `forge-requests-{user}` | Pending friend requests and gym invites |
| `forge-premium` | Subscription state |
| `forge-nutrition-goal` | Selected nutrition goal |
| `forge-theme` | Chosen colour theme |
| `forge-language` | Interface language |

Clearing browser data wipes the local data (workouts, reports, calendar, goals). The account itself is unaffected since it lives on the server.

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

- ~~Backend with real authentication and cross-device sync~~ — done, see `server/`
- Sync workouts, reports, calendar and goals to the backend too (currently accounts only)
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

Issues and pull requests are welcome. Keep the frontend's zero-dependency approach — no frameworks, no build step. `server/` is the exception: it's a small Node/Express app and is expected to have npm dependencies.

---

## License

MIT
