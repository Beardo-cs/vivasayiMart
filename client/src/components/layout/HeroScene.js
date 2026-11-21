// Original illustration for the home page: sunrise over Tamil Nadu paddy terraces, coconut palms,
// a village hut and a crate of fresh produce. Pure SVG: a few KB, sharp on any screen, works offline.
//
// The viewBox is 1200x800 and the picture is cropped to fit ("slice"). The important parts
// (sun, hut, produce crate) sit in the middle so phones, which show only the centre, still get them.
import React from 'react';

const Palm = () => (
  <g>
    <path d="M0 0 C7 -62 -5 -124 9 -196" stroke="#6b4a2b" strokeWidth="10" fill="none" strokeLinecap="round" />
    <path d="M0 -40 l6 -1 M1 -70 l7 -1 M3 -100 l7 -1 M5 -130 l7 -1 M7 -160 l7 -1" stroke="#4d3520" strokeWidth="3" strokeLinecap="round" opacity=".5" />
    <g transform="translate(9 -196)">
      {[-168, -142, -116, -88, -62, -36, -12, 14].map((deg, i) => (
        <path
          key={deg}
          transform={`rotate(${deg})`}
          d="M0 0 C34 -26 82 -22 118 10 C84 -6 36 -6 0 0Z"
          fill={i % 2 ? '#2f7d32' : '#43a047'}
        />
      ))}
      <circle cx="-6" cy="6" r="6" fill="#8d6e4a" />
      <circle cx="8" cy="8" r="6" fill="#7a5c3c" />
    </g>
  </g>
);

const Tomato = ({ x, y, r = 25 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#e53935" />
    <circle r={r} fill="url(#shade)" />
    <ellipse cx={-r * 0.35} cy={-r * 0.4} rx={r * 0.25} ry={r * 0.14} fill="#fff" opacity=".45" transform="rotate(-30)" />
    <path d={`M0 ${-r + 3} l-9 -4 l7 -1 l2 -8 l3 8 l8 1 z`} fill="#2e7d32" />
  </g>
);

const Mango = ({ x, y, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <ellipse rx="22" ry="29" fill="#ffb300" />
    <ellipse cx="9" cy="-4" rx="12" ry="22" fill="#f4511e" opacity=".55" />
    <ellipse cx="-8" cy="-12" rx="5" ry="9" fill="#fff" opacity=".35" />
    <path d="M0 -29 q8 -6 12 -2 q-6 6 -12 2z" fill="#2e7d32" />
  </g>
);

const HeroScene = () => (
  <svg
    className="hero-scene"
    viewBox="0 0 1200 800"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9fd6ea" />
        <stop offset=".42" stopColor="#fff0c4" />
        <stop offset=".72" stopColor="#ffd699" />
      </linearGradient>
      <radialGradient id="hs-glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#fffbe0" stopOpacity="1" />
        <stop offset=".35" stopColor="#ffeaa0" stopOpacity=".65" />
        <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="shade" cx=".35" cy=".3" r=".8">
        <stop offset=".5" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".22" />
      </radialGradient>
      <linearGradient id="hs-soil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a9693b" />
        <stop offset="1" stopColor="#7d4a28" />
      </linearGradient>
      <linearGradient id="hs-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d49a4a" />
        <stop offset="1" stopColor="#b57a30" />
      </linearGradient>
      <g id="hs-palm"><Palm /></g>
    </defs>

    {/* sky, glow, sun */}
    <rect width="1200" height="800" fill="url(#hs-sky)" />
    <circle cx="600" cy="395" r="270" fill="url(#hs-glow)" />
    <circle cx="600" cy="395" r="58" fill="#fff6cf" />
    <circle cx="600" cy="395" r="74" fill="none" stroke="#fff6cf" strokeOpacity=".5" strokeWidth="8" />

    {/* clouds */}
    <g fill="#fff" opacity=".9">
      <ellipse cx="210" cy="130" rx="78" ry="22" /><ellipse cx="262" cy="112" rx="52" ry="28" /><ellipse cx="160" cy="118" rx="44" ry="20" />
      <ellipse cx="930" cy="190" rx="88" ry="24" /><ellipse cx="990" cy="170" rx="54" ry="28" /><ellipse cx="880" cy="178" rx="46" ry="20" />
      <ellipse cx="610" cy="120" rx="62" ry="17" opacity=".7" /><ellipse cx="650" cy="106" rx="38" ry="20" opacity=".7" />
    </g>

    {/* birds */}
    <g stroke="#5b4636" strokeWidth="3.2" fill="none" strokeLinecap="round">
      <path d="M470 230 q10 -13 20 0 q10 -13 20 0" />
      <path d="M690 175 q8 -10 16 0 q8 -10 16 0" />
      <path d="M740 250 q7 -9 14 0 q7 -9 14 0" />
    </g>

    {/* far and middle hills */}
    <path d="M0 440 C140 385 270 410 400 425 C520 440 650 365 790 385 C910 402 1030 355 1200 405 L1200 800 L0 800Z" fill="#b3d681" />
    <path d="M0 492 C170 440 330 482 470 466 C640 450 770 428 910 458 C1040 484 1130 450 1200 464 L1200 800 L0 800Z" fill="#8fbf5a" />

    {/* village hut and trees on the hill */}
    <g>
      <rect x="436" y="428" width="76" height="46" fill="#f4d89a" />
      <polygon points="424,430 474,392 524,430" fill="#c8552d" />
      <polygon points="424,430 474,392 474,430" fill="#b14a26" />
      <rect x="466" y="446" width="18" height="28" fill="#7a4a2b" />
      <rect x="490" y="440" width="14" height="14" fill="#7ec3d9" />
      <ellipse cx="560" cy="470" rx="22" ry="26" fill="#3f8f3a" /><rect x="557" y="486" width="6" height="14" fill="#6b4a2b" />
      <ellipse cx="392" cy="478" rx="18" ry="22" fill="#4a9a42" /><rect x="389" y="492" width="6" height="12" fill="#6b4a2b" />
    </g>

    {/* coconut palms (outer ones get cropped on phones, which is fine) */}
    <use href="#hs-palm" transform="translate(105 560) scale(1.15)" />
    <use href="#hs-palm" transform="translate(205 585) scale(.8) scale(-1 1)" />
    <use href="#hs-palm" transform="translate(1085 565) scale(1.2) scale(-1 1)" />
    <use href="#hs-palm" transform="translate(985 590) scale(.85)" />
    <use href="#hs-palm" transform="translate(690 482) scale(.42)" />

    {/* paddy terraces, getting wider toward the viewer */}
    <path d="M0 505 C250 482 620 524 1200 494 L1200 548 C720 580 300 542 0 566Z" fill="#6aa536" />
    <path d="M0 566 C300 540 720 592 1200 552 L1200 616 C800 646 300 604 0 632Z" fill="#7cb342" />
    <path d="M0 632 C300 606 800 658 1200 618 L1200 694 C800 724 300 676 0 706Z" fill="#5d9a2e" />
    <path d="M0 706 C300 676 800 732 1200 696 L1200 800 L0 800Z" fill="#8bc34a" />
    <g fill="none" stroke="#3f7a1c" strokeOpacity=".28" strokeWidth="2.2">
      <path d="M0 520 C250 497 620 539 1200 509" /><path d="M0 535 C250 512 620 554 1200 524" />
      <path d="M0 585 C300 560 720 611 1200 573" /><path d="M0 603 C300 578 720 629 1200 591" />
      <path d="M0 655 C300 629 800 681 1200 642" /><path d="M0 676 C300 650 800 702 1200 663" />
    </g>
    <path d="M0 748 C300 722 900 776 1200 742 L1200 800 L0 800Z" fill="url(#hs-soil)" />

    {/* left basket: greens and carrots */}
    <g transform="translate(196 640)">
      <ellipse cx="78" cy="132" rx="96" ry="12" fill="#000" opacity=".18" />
      <path d="M10 52 L146 52 L128 128 L28 128Z" fill="#c99a52" />
      <path d="M14 70 H142 M20 90 H136 M25 110 H131" stroke="#9c7433" strokeWidth="3" />
      <path d="M44 52 L36 128 M78 52 V128 M112 52 L120 128" stroke="#a97d3b" strokeWidth="3" />
      <ellipse cx="78" cy="52" rx="68" ry="9" fill="#a97d3b" />
      <g>
        <ellipse cx="46" cy="40" rx="20" ry="32" fill="#2e8b3c" transform="rotate(-24 46 40)" />
        <ellipse cx="82" cy="30" rx="18" ry="34" fill="#43a047" transform="rotate(8 82 30)" />
        <ellipse cx="112" cy="40" rx="17" ry="30" fill="#2e8b3c" transform="rotate(28 112 40)" />
        <path d="M64 56 L72 6 L80 56Z" fill="#ef6c00" transform="rotate(-14 72 56)" />
        <path d="M86 56 L96 10 L102 56Z" fill="#fb8c00" transform="rotate(12 94 56)" />
      </g>
      <path d="M10 52 L146 52 L141 70 L15 70Z" fill="#c99a52" />
    </g>

    {/* right basket: mangoes */}
    <g transform="translate(868 636)">
      <ellipse cx="78" cy="136" rx="96" ry="12" fill="#000" opacity=".18" />
      <Mango x="42" y="36" rot="-18" />
      <Mango x="80" y="28" rot="6" />
      <Mango x="118" y="38" rot="22" />
      <path d="M10 54 L146 54 L128 132 L28 132Z" fill="#c99a52" />
      <path d="M14 72 H142 M20 92 H136 M25 112 H131" stroke="#9c7433" strokeWidth="3" />
      <path d="M44 54 L36 132 M78 54 V132 M112 54 L120 132" stroke="#a97d3b" strokeWidth="3" />
      <ellipse cx="78" cy="54" rx="68" ry="9" fill="#a97d3b" />
    </g>

    {/* produce crate, centre front */}
    <g transform="translate(430 586)">
      <ellipse cx="170" cy="190" rx="206" ry="16" fill="#000" opacity=".22" />
      {/* leafy greens at the back */}
      <ellipse cx="62" cy="52" rx="26" ry="42" fill="#2e8b3c" transform="rotate(-30 62 52)" />
      <ellipse cx="96" cy="36" rx="24" ry="44" fill="#43a047" transform="rotate(-8 96 36)" />
      <ellipse cx="270" cy="42" rx="24" ry="42" fill="#2e8b3c" transform="rotate(26 270 42)" />
      <ellipse cx="238" cy="30" rx="22" ry="44" fill="#43a047" transform="rotate(8 238 30)" />
      {/* carrots */}
      <path d="M118 36 L132 -4 L142 40Z" fill="#fb8c00" transform="rotate(-12 130 36)" />
      <path d="M200 38 L210 -2 L222 40Z" fill="#ef6c00" transform="rotate(14 210 38)" />
      {/* fruit and vegetables heaped above the rim */}
      <Tomato x="92" y="86" />
      <Tomato x="148" y="70" r={27} />
      <Tomato x="204" y="84" />
      <Tomato x="120" y="104" r={22} />
      <Tomato x="178" y="106" r={22} />
      {/* brinjal */}
      <g transform="translate(246 84) rotate(24)">
        <ellipse rx="17" ry="36" fill="#6a2c91" />
        <ellipse cx="-6" cy="-8" rx="4" ry="16" fill="#fff" opacity=".28" />
        <path d="M-12 -30 q12 -12 24 0 q-12 8 -24 0z" fill="#2e7d32" />
      </g>
      {/* bananas */}
      <g transform="translate(40 84)">
        <path d="M0 18 C-6 -14 12 -34 36 -42 C26 -20 22 0 22 22Z" fill="#ffd54f" stroke="#e0a800" strokeWidth="2" />
        <path d="M14 22 C10 -10 28 -28 50 -32 C42 -12 38 6 38 26Z" fill="#ffca28" stroke="#e0a800" strokeWidth="2" />
      </g>
      {/* coconut */}
      <g transform="translate(304 100)">
        <circle r="26" fill="#8d6e4a" />
        <circle r="26" fill="url(#shade)" />
        <circle cx="-8" cy="-6" r="3.4" fill="#4e3a22" /><circle cx="6" cy="-8" r="3.4" fill="#4e3a22" /><circle cx="-1" cy="4" r="3.4" fill="#4e3a22" />
      </g>
      {/* wooden crate (front) */}
      <rect x="-6" y="108" width="352" height="82" rx="10" fill="url(#hs-wood)" />
      <path d="M-6 136 H346 M-6 164 H346" stroke="#8a5a22" strokeWidth="3.5" />
      <rect x="-6" y="108" width="352" height="12" rx="6" fill="#e0a85c" />
      <g fill="#7a4e1d">
        <circle cx="12" cy="150" r="3.2" /><circle cx="328" cy="150" r="3.2" /><circle cx="12" cy="178" r="3.2" /><circle cx="328" cy="178" r="3.2" />
      </g>
    </g>
  </svg>
);

export default HeroScene;
