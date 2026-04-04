const marketDots = [
  { id: "senegal", name: "Senegal", x: 156, y: 118 },
  { id: "ghana", name: "Ghana", x: 198, y: 149 },
  { id: "nigeria", name: "Nigeria", x: 230, y: 152 },
  { id: "rwanda", name: "Rwanda", x: 320, y: 212 },
  { id: "kenya", name: "Kenya", x: 345, y: 206 },
  { id: "zambia", name: "Zambia", x: 300, y: 268 },
  { id: "south-africa", name: "South Africa", x: 295, y: 382 },
];

const routes = [
  "M156 118 C182 116, 208 132, 230 152",
  "M230 152 C266 160, 298 180, 320 212",
  "M320 212 C332 206, 338 205, 345 206",
  "M320 212 C310 230, 304 248, 300 268",
  "M300 268 C296 308, 292 344, 295 382",
  "M198 149 C208 151, 220 151, 230 152",
];

export function AfricaNetworkMap() {
  return (
    <div className="africa-float relative overflow-hidden rounded-[32px] border border-white/15 bg-[linear-gradient(135deg,rgba(10,61,46,0.98),rgba(8,34,27,0.92))] p-4 shadow-panel dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(8,28,23,0.98),rgba(5,18,14,0.95))]">
      <svg viewBox="0 0 520 470" className="h-full w-full">
        <defs>
          <linearGradient id="africa-fill" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#0f5a44" />
            <stop offset="100%" stopColor="#0A3D2E" />
          </linearGradient>
          <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="520" height="470" rx="24" fill="transparent" />

        <path
          d="M176 48 L206 56 L235 48 L266 58 L288 82 L311 98 L334 117 L359 145 L377 183 L398 200 L406 226 L392 245 L398 276 L389 303 L365 335 L347 375 L326 404 L302 422 L271 430 L250 408 L221 397 L195 363 L184 339 L157 320 L145 286 L127 260 L121 224 L109 191 L118 161 L129 137 L145 116 L154 88 Z"
          fill="url(#africa-fill)"
          stroke="#C9A84C"
          strokeWidth="2"
        />

        <path
          d="M145 118 L173 148 L206 156 L226 176 L248 166 L278 182 L300 208 L295 239 L281 262 L296 289 L287 324"
          fill="none"
          stroke="rgba(245,240,232,0.22)"
          strokeWidth="1.2"
        />
        <path
          d="M185 92 L202 116 L238 108 L262 122 L291 110 L314 124"
          fill="none"
          stroke="rgba(245,240,232,0.18)"
          strokeWidth="1"
        />
        <path
          d="M153 176 L184 205 L214 228 L243 216 L271 243 L261 274 L246 303"
          fill="none"
          stroke="rgba(245,240,232,0.18)"
          strokeWidth="1"
        />
        <path
          d="M257 300 L287 314 L316 305 L338 328 L330 364"
          fill="none"
          stroke="rgba(245,240,232,0.18)"
          strokeWidth="1"
        />

        {routes.map((route) => (
          <path
            key={route}
            d={route}
            className="network-flow"
            fill="none"
            stroke="rgba(201,168,76,0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ))}

        {marketDots.map((dot) => (
          <g key={dot.id} transform={`translate(${dot.x} ${dot.y})`} filter="url(#gold-glow)">
            <circle className="africa-pulse" cx="0" cy="0" r="12" fill="rgba(201,168,76,0.35)" />
            <circle className="africa-pulse" cx="0" cy="0" r="7" fill="rgba(201,168,76,0.26)" style={{ animationDelay: "0.8s" }} />
            <circle cx="0" cy="0" r="4.5" fill="#C9A84C" />
            <circle cx="0" cy="0" r="2" fill="#F5F0E8" />
            <text
              x="10"
              y="-10"
              fill="rgba(245,240,232,0.88)"
              fontSize="11"
              fontFamily="DM Sans, sans-serif"
            >
              {dot.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
