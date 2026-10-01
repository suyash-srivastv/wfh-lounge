# The Stillroom

A community for working professionals — meet people in your city, join events, share ideas, chat, and use Clarity to figure out what you actually want from work and life.

## Stack

- React 18 (via CDN + Babel standalone — no build step)
- Plain CSS
- Data is currently static; Supabase integration coming next

## Project structure

```
wfhLounge/
├── index.html        # Entry point — loads fonts, CSS, scripts
├── css/
│   └── styles.css    # All styles
└── src/
    ├── mockData.js   # Static seed data (events, members, ideas, threads, chat)
    └── app.js        # React app (JSX, transpiled in-browser by Babel)
```

## How to run

You need a local HTTP server (Babel fetches `app.js` via XHR, which browsers block over `file://`):

```bash
python3 -m http.server 3000
```

Then open http://localhost:3000.

## Features

- **Meetups** — browse and RSVP to IRL / virtual events, filtered by city
- **Members** — find and connect with professionals nearby
- **Ideas** — post startup ideas, upvote, see what people are building
- **Forums** — async threaded discussions
- **Chat** — city-scoped real-time-style chat rooms
- **Clarity** — a private, tap-only check-in on what you want, ranked by you

## Security rules & deploying

Firestore rules live in [`firestore.rules`](firestore.rules) and indexes in [`firestore.indexes.json`](firestore.indexes.json). Deploy both from the repo (never edit them in the console, or they drift):

```bash
npx firebase login          # once
npm run deploy:rules        # rules + indexes
```

New indexes take a few minutes to build; queries filtered by city fail until they finish.

## Tests

```bash
npm run test:rules          # rules tests on the Firestore emulator (no real data)

# End-to-end: the real app against local emulators
npm run emulators           # terminal 1
npm run dev:emulators       # terminal 2 → http://localhost:5174
npm run test:e2e            # terminal 3
```

## Optional: App Check

Blocks scripts and bots that call Firebase directly. Create a reCAPTCHA v3 key, register it in Firebase Console → App Check, put it in `.env` as `VITE_RECAPTCHA_SITE_KEY=...`, then turn on enforcement for Firestore.
