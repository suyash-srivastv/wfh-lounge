// Animated illustration for the intro: two people talking in a quiet room at
// night — warm lamp, steaming cups, a window with a moon and twinkling stars,
// speech bubbles taking turns. Pure SVG + CSS (no library); animations pause
// for people who prefer reduced motion.
function IntroArt() {
  return (
    <svg className="ia" viewBox="0 0 420 380" role="img" aria-label="Two people talking over coffee in a calm room at night">
      <defs>
        <radialGradient id="ia-glow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#F2C28B" stopOpacity=".28"/>
          <stop offset="100%" stopColor="#F2C28B" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="ia-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B1D3A"/>
          <stop offset="100%" stopColor="#2A2550"/>
        </linearGradient>
        <radialGradient id="ia-lamp" cx="50%" cy="38%" r="50%" fx="50%" fy="20%">
          <stop offset="0%" stopColor="#FFD9A3" stopOpacity=".26"/>
          <stop offset="55%" stopColor="#FFD9A3" stopOpacity=".08"/>
          <stop offset="100%" stopColor="#FFD9A3" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* warm room glow */}
      <circle className="ia-roomglow" cx="210" cy="190" r="185" fill="url(#ia-glow)"/>

      {/* window with night sky */}
      <g transform="translate(240 40)">
        <rect width="130" height="150" rx="65" fill="url(#ia-sky)"/>
        <path d="M65 0v150M0 80h130" stroke="#0F1013" strokeWidth="5" opacity=".55"/>
        <rect width="130" height="150" rx="65" fill="none" stroke="#3B3F55" strokeWidth="4"/>
        <circle cx="92" cy="40" r="14" fill="#F1EEE6"/>
        <circle cx="99" cy="35" r="12" fill="#22234A"/>
        <circle className="ia-star s1" cx="30" cy="36" r="2.2" fill="#F1EEE6"/>
        <circle className="ia-star s2" cx="48" cy="62" r="1.6" fill="#F1EEE6"/>
        <circle className="ia-star s3" cx="104" cy="104" r="1.8" fill="#F1EEE6"/>
        <circle className="ia-star s4" cx="26" cy="112" r="1.4" fill="#F1EEE6"/>
        <circle className="ia-star s5" cx="76" cy="20" r="1.3" fill="#F1EEE6"/>
      </g>

      {/* hanging lamp */}
      <g className="ia-lamp">
        <path d="M150 0v58" stroke="#5A5D68" strokeWidth="2"/>
        <path d="M128 78q22-30 44 0z" fill="#E7B877"/>
        <ellipse className="ia-lampglow" cx="160" cy="200" rx="170" ry="150" fill="url(#ia-lamp)"/>
        <circle cx="150" cy="80" r="5" fill="#FFE7C2"/>
      </g>

      {/* floor line */}
      <path d="M20 330h380" stroke="#2A2C33" strokeWidth="3" strokeLinecap="round"/>

      {/* person A (left, sand) */}
      <g className="ia-person a">
        <path d="M66 330v-62q0-26 26-26h18q20 0 20 22v66z" fill="#C8BFA4"/>
        <circle cx="101" cy="208" r="22" fill="#C8BFA4"/>
        <path d="M88 200q13-16 30-2" stroke="#0F1013" strokeWidth="3" fill="none" opacity=".25"/>
        <path d="M128 268q22 6 34 0" stroke="#C8BFA4" strokeWidth="12" strokeLinecap="round" fill="none"/>
      </g>
      {/* chair A */}
      <path d="M58 330v-40h80v40M58 290v-58" stroke="#3A3D47" strokeWidth="6" strokeLinecap="round" fill="none"/>

      {/* person B (right, lavender) */}
      <g className="ia-person b">
        <path d="M354 330v-62q0-26-26-26h-18q-20 0-20 22v66z" fill="#8E86D9"/>
        <circle cx="319" cy="208" r="22" fill="#8E86D9"/>
        <path d="M332 200q-13-16-30-2" stroke="#0F1013" strokeWidth="3" fill="none" opacity=".25"/>
        <path d="M292 268q-22 6-34 0" stroke="#8E86D9" strokeWidth="12" strokeLinecap="round" fill="none"/>
      </g>
      {/* chair B */}
      <path d="M362 330v-40h-80v40M362 290v-58" stroke="#3A3D47" strokeWidth="6" strokeLinecap="round" fill="none"/>

      {/* table + cups */}
      <rect x="160" y="268" width="100" height="10" rx="5" fill="#4A4D58"/>
      <path d="M210 278v52M186 330h48" stroke="#4A4D58" strokeWidth="6" strokeLinecap="round"/>
      <g fill="#F1EEE6">
        <path d="M178 250h22v14q0 6-6 6h-10q-6 0-6-6z"/>
        <path d="M222 250h22v14q0 6-6 6h-10q-6 0-6-6z"/>
      </g>
      <g className="ia-steam" stroke="#F1EEE6" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path className="w1" d="M186 244q-5-8 0-14t0-14"/>
        <path className="w2" d="M233 244q5-8 0-14t0-14"/>
      </g>

      {/* speech bubbles, taking turns */}
      <g className="ia-bubble left">
        <rect x="70" y="140" width="66" height="36" rx="18" fill="#F1EEE6"/>
        <path d="M92 174l-8 14 18-12z" fill="#F1EEE6"/>
        <circle className="d1" cx="90" cy="158" r="4" fill="#0F1013"/>
        <circle className="d2" cx="103" cy="158" r="4" fill="#0F1013"/>
        <circle className="d3" cx="116" cy="158" r="4" fill="#0F1013"/>
      </g>
      <g className="ia-bubble right">
        <rect x="284" y="140" width="66" height="36" rx="18" fill="#F1EEE6"/>
        <path d="M328 174l8 14-18-12z" fill="#F1EEE6"/>
        <path d="M300 160q17 12 34 0" stroke="#0F1013" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      </g>
    </svg>
  );
}

export default IntroArt;
