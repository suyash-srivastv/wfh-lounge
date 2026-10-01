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
