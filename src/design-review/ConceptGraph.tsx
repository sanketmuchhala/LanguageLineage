// Shared directed-graph composition for concept previews. Dev-only.
import { SUBGRAPH, relColor, type GNode } from './data';

interface Props {
  nodeFill: string;
  nodeStroke: string;
  labelColor: string;
  toolFill: string;
  highlight?: string; // node id to emphasise
  showGrid?: boolean;
  gridColor?: string;
  compact?: boolean;
}

const byId = (id: string) => SUBGRAPH.nodes.find((n) => n.id === id) as GNode;

export default function ConceptGraph({
  nodeFill,
  nodeStroke,
  labelColor,
  toolFill,
  highlight,
  showGrid,
  gridColor = 'rgba(255,255,255,0.05)',
  compact,
}: Props) {
  const r = compact ? 5.4 : 6.2;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" role="img" aria-label="Directed implementation subgraph: C runtime of Python and Ruby, LLVM compiler backend for Rust, OCaml bootstrap of Rust">
      <defs>
        {SUBGRAPH.edges.map((e, i) => {
          const c = relColor(e.rel);
          return (
            <marker key={i} id={`arrow-${i}-${c.replace('#', '')}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={c} />
            </marker>
          );
        })}
      </defs>

      {showGrid && (
        <g stroke={gridColor} strokeWidth="0.2">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v${i}`} x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={(i + 1) * 10} x2="100" y2={(i + 1) * 10} />
          ))}
        </g>
      )}

      {/* edges */}
      <g>
        {SUBGRAPH.edges.map((e, i) => {
          const a = byId(e.from);
          const b = byId(e.to);
          const c = relColor(e.rel);
          // shorten the line so the arrowhead lands on the node ring, not the center
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const x1 = a.x + ux * (r + 1);
          const y1 = a.y + uy * (r + 1);
          const x2 = b.x - ux * (r + 2.5);
          const y2 = b.y - uy * (r + 2.5);
          const dash = e.rel === 'influenced' ? '0.6 1.6' : e.rel === 'bootstrap_written_in' || e.rel === 'transpiled_to' ? '2 1.4' : undefined;
          const dim = highlight && e.from !== highlight && e.to !== highlight;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={c}
              strokeWidth={e.rel === 'influenced' ? 0.7 : 1.1}
              strokeDasharray={dash}
              markerEnd={`url(#arrow-${i}-${c.replace('#', '')})`}
              opacity={dim ? 0.18 : 0.92}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* nodes */}
      <g>
        {SUBGRAPH.nodes.map((n) => {
          const isTool = n.kind === 'tool';
          const emphasised = highlight === n.id;
          const dim = highlight && !emphasised && !SUBGRAPH.edges.some((e) => (e.from === highlight && e.to === n.id) || (e.to === highlight && e.from === n.id));
          return (
            <g key={n.id} opacity={dim ? 0.32 : 1}>
              {isTool ? (
                <rect x={n.x - r} y={n.y - r} width={r * 2} height={r * 2} rx="1.4" fill={toolFill} stroke={nodeStroke} strokeWidth={emphasised ? 1.2 : 0.6} transform={`rotate(45 ${n.x} ${n.y})`} />
              ) : (
                <circle cx={n.x} cy={n.y} r={r} fill={nodeFill} stroke={emphasised ? labelColor : nodeStroke} strokeWidth={emphasised ? 1.3 : 0.6} />
              )}
              <text x={n.x} y={n.y + r + 3.4} textAnchor="middle" fontSize="3.1" fill={labelColor} fontFamily="'JetBrains Mono', monospace" style={{ fontWeight: emphasised ? 700 : 500 }}>
                {n.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
