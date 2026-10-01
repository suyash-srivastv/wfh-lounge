import { TAGLINE } from '../constants';
import IntroArt from '../components/IntroArt';

const FEATURES = [
  { icon: 'ti-map-pin',        label: 'Find people in your city' },
  { icon: 'ti-calendar-event', label: 'Join small, real-life events' },
  { icon: 'ti-message-circle', label: 'Chat with your city, or one-on-one' },
  { icon: 'ti-sunrise',        label: 'Clarity: figure out what you want' },
];

// Full-screen intro for first-time visitors. Kept short on purpose so it fits
// one screen with no scrolling; the full story lives on the About page.
function IntroScreen({ onJoin, onLogin }) {
  return (
    <div className="intro">
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
    </div>
  );
}

export default IntroScreen;
