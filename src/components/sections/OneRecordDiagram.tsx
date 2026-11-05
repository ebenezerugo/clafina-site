/** A hub and its spokes: every screen and area of the business around one shared record. Drawn to scale in a 640×440 box. */
export function OneRecordDiagram({ label, centre, spokes }: { label: string; centre: string; spokes: string[] }) {
  const cx = 320, cy = 220, r = 165;
  const points = spokes.map((s, i) => {
    const a = (Math.PI * 2 * i) / spokes.length - Math.PI / 2;
    return { s, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  return (
    <svg role="img" aria-label={label} viewBox="0 0 640 440" className="h-auto w-full max-w-3xl text-ink">
      {points.map((p) => <line key={`l-${p.s}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--c-line)" strokeWidth="2" />)}
      <circle cx={cx} cy={cy} r="64" fill="var(--c-primary)" />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--c-on-primary)">{centre}</text>
      {points.map((p) => (
        <g key={p.s}>
          <rect x={p.x - 62} y={p.y - 20} width="124" height="40" rx="20" fill="var(--c-raised)" stroke="var(--c-line)" />
          <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--c-ink)">{p.s}</text>
        </g>
      ))}
    </svg>
  );
}
