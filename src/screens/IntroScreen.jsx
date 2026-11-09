import { TAGLINE } from '../constants';
import IntroArt from '../components/IntroArt';

const FEATURES = [
  { icon: 'ti-map-pin',        label: 'Find people in your city' },
  { icon: 'ti-calendar-event', label: 'Join small, real-life events' },
  { icon: 'ti-message-circle', label: 'Chat with your city, or one-on-one' },
  { icon: 'ti-sunrise',        label: 'Clarity: figure out what you want' },
];

const STEPS = [
  { n: '1', title: 'Set your city',        line: 'Bangalore, Prayagraj, Pune, anywhere. That’s where your people are.' },
  { n: '2', title: 'Meet people nearby',   line: 'Working professionals and WFH folks who live close. Connect, then chat.' },
  { n: '3', title: 'Join small events',    line: 'Coffee, walks, co-working, board games. Premium members can host their own.' },
  { n: '4', title: 'Talk honestly',        line: 'Forums for the stuff work leaves behind: switching off, layoffs, career changes.' },
];

const VS = [
  ['Building your career',            'Living the rest of your life'],
  ['Connections, followers, leads',   'Friends in your city'],
  ['Posting to look successful',      'Talking like a normal person'],
  ['Online, forever',                 'Small meetups in real life'],
];

const FAQS = [
  ['Is it free?', 'Joining is free, and so are meeting people, chat, forums and going to events. Hosting events is part of Premium (₹500 for 30 days).'],
  ['Is it a dating app?', 'No. It’s for friendships and community with people who also work — not dating, and not networking.'],
  ['Who is it for?', 'Anyone who works — in an office, from home, remotely, freelancing or between jobs — who wants friends outside work. You need to be 18 or older.'],
  ['Is it in my city?', 'It works in every city in India. Set your home city and you’ll see members, events and the city chat for where you live.'],
];

// Intro for first-time visitors (and what search engines see). The first
// screen fits without scrolling; the rest below it explains what the place is.
function IntroScreen({ onJoin, onLogin }) {
  return (
    <div className="intro">
     <div className="intro-hero">
      <header className="intro-top">
        <div className="intro-brand">
          <div className="logo-icon"><i className="ti ti-coffee"/></div>
          <span>The Stillroom</span>
        </div>
        <button className="intro-login" onClick={onLogin}>Log in</button>
      </header>

      <main className="intro-main">
        <div className="intro-art"><IntroArt/></div>

        <div className="intro-copy">
          <div className="intro-tagline">{TAGLINE}</div>
          <h1 className="intro-title">The room where work doesn't follow you.</h1>
          <p className="intro-line">Find your crew nearby. No networking required.</p>
          <p className="intro-line intro-line-soft">
            The Stillroom is like LinkedIn — but for actually being social. No BS.
          </p>
          <ul className="intro-features">
            {FEATURES.map(f => (
              <li key={f.label}><i className={'ti ' + f.icon}/><span>{f.label}</span></li>
            ))}
          </ul>
          <div className="intro-actions">
            <button className="intro-join" onClick={onJoin}>Join The Stillroom <i className="ti ti-arrow-right"/></button>
          </div>
        </div>
      </main>
      <a className="intro-scroll" href="#what" aria-label="What is The Stillroom?"><i className="ti ti-chevron-down"/></a>
     </div>

      <div className="intro-more" id="what">
        <section>
          <h2>A social network for working professionals — not for networking</h2>
          <p>Most of us spend our best hours working, and somewhere along the way work started deciding everything else. Friends became “let’s catch up soon”. Weekends went to recovering from the week.</p>
          <p>The Stillroom is a quieter place for people who work — in an office, from home, remotely, or between jobs — to meet others in their city and make real friends outside work. No endless feed, no follower counts, no pressure to look successful.</p>
        </section>

        <section>
          <h2>How it works</h2>
          <ol className="intro-steps">
            {STEPS.map(s => <li key={s.n}><span className="intro-step-n">{s.n}</span><div><h3>{s.title}</h3><p>{s.line}</p></div></li>)}
          </ol>
          <p>And when you need it, <strong>Clarity</strong>: a private one-minute check-in to work out what you actually want, and one small step toward it.</p>
        </section>

        <section>
          <h2>LinkedIn is for your career. The Stillroom is for the rest of your life.</h2>
          <div className="intro-vs" role="table" aria-label="LinkedIn compared with The Stillroom">
            <div className="intro-vs-row intro-vs-head" role="row"><span role="columnheader">LinkedIn</span><span role="columnheader">The Stillroom</span></div>
            {VS.map(([a, b]) => <div className="intro-vs-row" role="row" key={a}><span role="cell">{a}</span><span role="cell">{b}</span></div>)}
          </div>
        </section>

        <section>
          <h2>Questions</h2>
          <div className="intro-faq">
            {FAQS.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
          <p><a href="/faq">See all questions</a></p>
        </section>

        <section className="intro-end">
          <p>You’re more than your job title. Welcome in.</p>
          <button className="intro-join" onClick={onJoin}>Join The Stillroom — it’s free <i className="ti ti-arrow-right"/></button>
        </section>

        <footer className="intro-foot">
          <nav><a href="/about">About</a><a href="/faq">FAQ</a><a href="/cities">Cities</a><a href="/premium">Premium</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refunds">Refunds</a><a href="/contact">Contact</a></nav>
          <p>© 2026 The Stillroom</p>
        </footer>
      </div>
    </div>
  );
}

export default IntroScreen;
