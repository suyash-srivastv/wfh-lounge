import { useEffect, useState } from 'react';

// Home greeting with "Brew", the coffee-mug mascot: it blinks, waves and
// steams, and its speech bubble cycles through cheeky one-liners for working
// people. Tap Brew for a new one. Pure SVG + CSS, coloured by the theme.

const QUIPS = [
  "Your manager can't see you here.",
  "Reminder: you're a person, not a KPI.",
  '0 meetings, 1 coffee. Perfect ratio.',
  "Go say hi to someone. I'll hold your coffee.",
  "This isn't a LinkedIn post. You can relax.",
  'Out of office (emotionally)? Same.',
  "Plot twist: you're allowed to log off.",
  'Hydrate. Then caffeinate.',
  'Small talk is a gateway to real talk.',
  'No one here cares about your job title. Promise.',
  "Touch grass. Then come back and tell us how it went.",
  "Your calendar called. I didn't pick up.",
];

// After 11 pm and before 5 am, Brew switches to late-night lines.
const NIGHT_QUIPS = [
  "It's 1 am. The bug will survive till morning.",
  "Everyone's asleep. Except you and that one Slack notification.",
  "Your 'quick fix' has entered its third hour.",
  'Running on code and questionable decisions.',
  'Even the street dogs have gone to bed.',
  'Is it a late night or an early morning? Yes.',
  '3 am you writes code. 10 am you deletes it.',
  'Tomorrow-you is begging you to log off.',
  'Night owls in your city are up too. Say hi.',
  "Go to bed. I'll keep the room warm.",
];
const isNight = h => h >= 23 || h < 5;

function greeting(h) {
  if (h < 5)  return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Up late';
}

function Brew({ onPoke, bump }) {
  return (
    <button className={'brew' + (bump ? ' bump' : '')} onClick={onPoke} aria-label="Brew, the Stillroom mug. Tap for another line.">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <g className="brew-steam" fill="none" strokeWidth="4" strokeLinecap="round">
          <path className="s1" d="M44 32q-6-8 0-14t0-14"/>
          <path className="s2" d="M60 30q6-8 0-14t0-14"/>
          <path className="s3" d="M76 32q-6-8 0-14t0-14"/>
        </g>
        <g className="brew-body">
          <path className="brew-arm" d="M24 74q-14-4-18-18" fill="none" strokeWidth="6" strokeLinecap="round"/>
          <path className="brew-handle" d="M92 56h6a14 14 0 0 1 0 28h-6" fill="none" strokeWidth="8"/>
          <rect className="brew-mug" x="24" y="40" width="70" height="66" rx="16"/>
          <rect className="brew-rim" x="24" y="40" width="70" height="10" rx="5"/>
          <g className="brew-eyes">
            <ellipse cx="46" cy="70" rx="5" ry="6.5"/>
            <ellipse cx="72" cy="70" rx="5" ry="6.5"/>
          </g>
          <circle className="brew-cheek" cx="38" cy="82" r="5"/>
          <circle className="brew-cheek" cx="80" cy="82" r="5"/>
          <path className="brew-smile" d="M51 82q8 8 16 0" fill="none" strokeWidth="4" strokeLinecap="round"/>
        </g>
      </svg>
    </button>
  );
}

function HomeHero({ name }) {
  const lines = isNight(new Date().getHours()) ? NIGHT_QUIPS : QUIPS;
  const [i, setI]       = useState(() => Math.floor(Math.random() * lines.length));
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % lines.length), 7000);
    return () => clearInterval(t);
  }, []);

  function poke() {
    setI(n => (n + 1 + Math.floor(Math.random() * (lines.length - 1))) % lines.length);
    setBump(true); setTimeout(() => setBump(false), 450);
  }

  const first = (name || '').trim().split(/\s+/)[0];
  return (
    <section className="home-hero">
      <Brew onPoke={poke} bump={bump}/>
      <div className="hh-copy">
        <div className="hh-greet">{greeting(new Date().getHours())}{first ? `, ${first}` : ''}</div>
        <div className="hh-bubble" key={i} aria-live="polite">{lines[i % lines.length]}</div>
      </div>
    </section>
  );
}

export default HomeHero;
