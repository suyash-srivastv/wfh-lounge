# WFH Together

A community platform for remote workers in tier-2 Indian cities — discover meetups, connect with members, share startup ideas, and chat by city.

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
- **Members** — find and connect with remote workers nearby
- **Ideas** — post startup ideas, upvote, see what people are building
- **Forums** — async threaded discussions
- **Chat** — city-scoped real-time-style chat rooms
