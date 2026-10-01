import IntroArt from './IntroArt';

// Shared look for sign-in, sign-up, verify-email and onboarding: the night
// room from the intro beside the form (side panel hides on small screens).
function AuthShell({ line, children }) {
  return (
    <div className="auth-wrap">
      <div className="auth-split">
        <aside className="auth-side" aria-hidden="true">
          <div className="auth-side-art"><IntroArt/></div>
          {line && <p className="auth-side-line">{line}</p>}
        </aside>
        {children}
      </div>
    </div>
  );
}

export default AuthShell;
