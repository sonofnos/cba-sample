const layers = [
  { id: "channels", label: "Channels", items: ["Web Portal", "Mobile", "Teller Console", "Agent Network"], color: "#C9A84C" },
  { id: "gateway", label: "Gateway", items: ["API Gateway", "Auth", "Rate Limits"], color: "#C46E4A" },
  { id: "services", label: "Core Services", items: ["Accounts", "Payments", "Loans", "Cards", "FX", "Compliance"], color: "#0A3D2E" },
  { id: "connectors", label: "Connectors", items: ["SWIFT", "NIBSS", "Mobile Money", "Card Switch", "Open Banking"], color: "#175947" },
  { id: "data", label: "Data & Control", items: ["Mock Data", "Event Streams", "Reporting", "Observability"], color: "#8B4B32" },
];

export function ArchitectureDiagram() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-border/70 bg-white/70 p-4 shadow-panel backdrop-blur dark:bg-white/5">
      <svg viewBox="0 0 1000 420" className="w-full">
        {layers.map((layer, index) => {
          const x = 30 + index * 190;
          return (
            <g key={layer.id}>
              <rect x={x} y="62" width="160" height="296" rx="28" fill={layer.color} opacity={index === 2 ? 1 : 0.92} />
              <text x={x + 18} y="100" fill="#F5F0E8" fontSize="26" fontWeight="700" fontFamily="Clash Display, sans-serif">
                {layer.label}
              </text>
              {layer.items.map((item, itemIndex) => (
                <g key={item}>
                  <rect
                    x={x + 16}
                    y={128 + itemIndex * 44}
                    width="128"
                    height="30"
                    rx="15"
                    fill="rgba(245,240,232,0.12)"
                    stroke="rgba(245,240,232,0.14)"
                  />
                  <text
                    x={x + 28}
                    y={148 + itemIndex * 44}
                    fill="#F5F0E8"
                    fontSize="13"
                    fontFamily="DM Sans, sans-serif"
                  >
                    {item}
                  </text>
                </g>
              ))}
            </g>
          );
        })}

        <path d="M190 210 C225 210, 230 210, 220 210 L220 210 C245 210, 250 210, 255 210" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeDasharray="8 8" />
        <path d="M380 210 C415 210, 420 210, 445 210" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeDasharray="8 8" />
        <path d="M570 210 C605 210, 610 210, 635 210" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeDasharray="8 8" />
        <path d="M760 210 C795 210, 800 210, 825 210" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeDasharray="8 8" />
      </svg>
    </div>
  );
}
