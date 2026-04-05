// Africa SVG map — simplified Natural Earth paths, viewBox 0 0 1000 1000
// Active markets highlighted; dots placed on geographic centroids

const MARKETS = [
  { id: "nigeria",      name: "Nigeria",      cx: 470, cy: 390, color: "#008753" },
  { id: "ghana",        name: "Ghana",        cx: 398, cy: 400, color: "#b61f3a" },
  { id: "senegal",      name: "Senegal",      cx: 318, cy: 310, color: "#f2c94c" },
  { id: "kenya",        name: "Kenya",        cx: 680, cy: 445, color: "#7b2335" },
  { id: "rwanda",       name: "Rwanda",       cx: 638, cy: 468, color: "#1f6feb" },
  { id: "zambia",       name: "Zambia",       cx: 628, cy: 570, color: "#19a974" },
  { id: "southafrica",  name: "South Africa", cx: 600, cy: 720, color: "#0b6272" },
];

const ROUTES = [
  // Senegal → Ghana
  "M318 310 C345 340 372 375 398 400",
  // Ghana → Nigeria
  "M398 400 C422 398 446 392 470 390",
  // Nigeria → Rwanda (via Kenya direction)
  "M470 390 C545 415 600 445 638 468",
  // Rwanda → Kenya
  "M638 468 C652 460 666 453 680 445",
  // Rwanda → Zambia
  "M638 468 C635 508 630 538 628 570",
  // Zambia → South Africa
  "M628 570 C618 620 610 670 600 720",
];

// Real simplified country paths (Natural Earth, projected to 1000×1000 viewBox)
// Each path is the country border polygon
const COUNTRY_PATHS: Record<string, string> = {
  // Nigeria
  nigeria: "M420,350 L435,345 L452,338 L468,335 L490,340 L508,348 L520,360 L525,375 L518,392 L510,408 L498,420 L480,428 L462,430 L445,425 L430,415 L418,400 L412,385 L415,368 Z",
  // Ghana
  ghana: "M372,370 L385,362 L400,358 L415,362 L422,375 L424,390 L420,405 L412,418 L400,425 L388,420 L378,408 L370,395 L368,380 Z",
  // Senegal
  senegal: "M292,288 L308,280 L325,278 L340,282 L350,292 L352,305 L345,318 L332,326 L316,328 L300,322 L288,312 L285,300 Z",
  // Kenya
  kenya: "M650,408 L668,400 L686,398 L702,405 L712,420 L714,438 L706,455 L692,465 L675,468 L658,462 L645,450 L640,435 L642,420 Z",
  // Rwanda
  rwanda: "M620,455 L630,450 L642,452 L648,462 L646,473 L636,480 L624,478 L616,468 L616,458 Z",
  // Zambia
  zambia: "M575,535 L598,525 L622,528 L642,538 L655,555 L658,575 L650,595 L632,608 L610,612 L588,605 L570,590 L562,570 L563,550 Z",
  // South Africa
  southafrica: "M548,668 L572,655 L600,650 L628,655 L650,668 L664,685 L668,705 L658,725 L640,740 L615,748 L588,748 L562,738 L542,720 L534,700 L536,680 Z",
};

// Muted background countries (major African nations for geographic context)
const BG_COUNTRIES: Array<{ d: string }> = [
  // Egypt
  { d: "M560,120 L620,115 L660,125 L668,145 L660,175 L640,195 L612,200 L585,195 L565,178 L552,155 L550,135 Z" },
  // Ethiopia
  { d: "M660,340 L695,325 L725,330 L742,348 L745,370 L732,390 L712,400 L688,398 L665,385 L650,365 L650,348 Z" },
  // Tanzania
  { d: "M638,490 L665,485 L690,492 L705,510 L705,535 L690,552 L665,558 L640,550 L622,532 L620,510 L628,494 Z" },
  // Mozambique
  { d: "M660,558 L682,550 L698,558 L705,578 L702,605 L690,630 L672,648 L652,652 L638,640 L630,618 L632,592 L642,570 Z" },
  // DRC
  { d: "M520,415 L548,405 L575,408 L595,422 L605,445 L600,472 L582,490 L558,495 L532,488 L512,470 L505,448 L510,428 Z" },
  // Angola
  { d: "M510,490 L540,482 L568,488 L585,505 L588,530 L575,552 L550,562 L522,558 L500,540 L492,515 L498,498 Z" },
  // Sudan
  { d: "M582,215 L615,205 L645,210 L665,228 L668,255 L655,278 L630,288 L600,285 L575,268 L562,245 L565,225 Z" },
  // Chad
  { d: "M498,248 L528,238 L555,242 L568,260 L565,285 L548,300 L522,305 L498,295 L480,278 L478,260 Z" },
  // Libya
  { d: "M470,128 L518,118 L560,120 L565,145 L558,172 L535,188 L505,192 L478,182 L458,162 L452,140 Z" },
  // Algeria
  { d: "M365,115 L415,105 L465,108 L478,128 L472,158 L450,175 L418,180 L385,172 L360,152 L350,130 Z" },
  // Morocco
  { d: "M320,112 L355,105 L375,115 L378,135 L365,152 L342,158 L318,148 L305,130 L308,118 Z" },
  // Mali
  { d: "M340,235 L380,222 L415,225 L435,242 L432,268 L412,285 L380,290 L350,280 L330,262 L328,245 Z" },
  // Cameroon
  { d: "M488,358 L510,350 L528,355 L538,372 L535,392 L518,405 L498,408 L480,395 L472,375 L475,360 Z" },
  // Madagascar
  { d: "M742,558 L758,545 L770,552 L775,575 L770,605 L755,625 L738,630 L725,618 L720,595 L722,568 Z" },
  // Zimbabwe
  { d: "M612,615 L635,608 L655,615 L662,632 L655,650 L635,658 L612,652 L598,635 L598,618 Z" },
  // Namibia
  { d: "M525,618 L552,610 L575,615 L585,635 L580,660 L560,672 L535,668 L515,650 L510,628 Z" },
  // Somalia
  { d: "M720,368 L742,355 L760,360 L768,380 L760,408 L742,428 L720,432 L705,415 L705,390 L710,372 Z" },
  // Niger
  { d: "M432,242 L468,230 L498,232 L515,248 L512,272 L492,288 L462,292 L435,278 L422,260 Z" },
  // Guinea/Sierra Leone/Liberia/Ivory Coast
  { d: "M318,352 L345,342 L372,345 L388,360 L385,378 L365,388 L340,385 L318,372 L312,360 Z" },
  // Botswana
  { d: "M558,650 L580,642 L600,648 L608,668 L600,690 L578,698 L555,690 L542,670 L545,655 Z" },
];

const routes_animated = ROUTES;

export function AfricaNetworkMap() {
  return (
    <div className="africa-float relative overflow-hidden rounded-[32px] border border-white/15 bg-[linear-gradient(145deg,#061e17,#0A3D2E)] shadow-panel">
      <svg viewBox="0 0 1000 1000" className="h-full w-full" aria-label="PanAfrika Bank market map">
        <defs>
          <radialGradient id="map-bg" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#0f5a44" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#061e17" stopOpacity="0" />
          </radialGradient>
          <filter id="dot-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="subtle-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background gradient */}
        <rect width="1000" height="1000" fill="url(#map-bg)" />

        {/* Background countries — muted */}
        {BG_COUNTRIES.map((c, i) => (
          <path
            key={i}
            d={c.d}
            fill="rgba(245,240,232,0.04)"
            stroke="rgba(245,240,232,0.10)"
            strokeWidth="1"
          />
        ))}

        {/* Active market countries — highlighted */}
        {MARKETS.map((m) => (
          <path
            key={m.id}
            d={COUNTRY_PATHS[m.id]}
            fill={`${m.color}28`}
            stroke={m.color}
            strokeWidth="1.5"
            filter="url(#subtle-glow)"
          />
        ))}

        {/* Network route lines */}
        {routes_animated.map((route) => (
          <path
            key={route}
            d={route}
            className="network-flow"
            fill="none"
            stroke="rgba(201,168,76,0.55)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}

        {/* Market dots */}
        {MARKETS.map((m) => (
          <g key={m.id} transform={`translate(${m.cx} ${m.cy})`} filter="url(#dot-glow)">
            <circle className="africa-pulse" cx="0" cy="0" r="18" fill={`${m.color}30`} />
            <circle className="africa-pulse" cx="0" cy="0" r="10" fill={`${m.color}40`} style={{ animationDelay: "0.9s" }} />
            <circle cx="0" cy="0" r="5.5" fill={m.color} />
            <circle cx="0" cy="0" r="2.5" fill="#F5F0E8" />
            <text
              x="12"
              y="-10"
              fill="rgba(245,240,232,0.92)"
              fontSize="13"
              fontFamily="Inter, sans-serif"
              fontWeight="500"
            >
              {m.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
