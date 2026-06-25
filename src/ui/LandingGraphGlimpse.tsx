import { useEffect, useRef, useState } from 'react';

interface Props {
  onOpen: () => void;
}

const LEGEND = [
  { label: 'Compiler', color: '#e3a008' },
  { label: 'Runtime / VM', color: '#34d399' },
  { label: 'Bootstrap', color: '#a78bfa' },
  { label: 'Influence', color: '#60a5fa' },
  { label: 'Transpile', color: '#22d3ee' },
  { label: 'Rewrite', color: '#fb7185' },
];

// A live glimpse of the real /explore graph: the actual dataset and the actual
// Cytoscape engine, lazy-mounted on scroll so it never blocks initial paint.
export function LandingGraphGlimpse({ onOpen }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<{ destroy: () => void } | null>(null);
  const startedRef = useRef(false);
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  // Trigger the load only when the section approaches the viewport.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase((p) => (p === 'idle' ? 'loading' : p));
          io.disconnect();
        }
      },
      { rootMargin: '250px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Destroy the graph only when the component unmounts (never on a phase change).
  useEffect(() => () => { cyRef.current?.destroy(); cyRef.current = null; }, []);

  useEffect(() => {
    if (phase !== 'loading' || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const [cytoscapeMod, coseMod, loadMod, normMod, styleMod] = await Promise.all([
          import('cytoscape'),
          import('cytoscape-cose-bilkent'),
          import('../data/loadDataset'),
          import('../data/normalizeDataset'),
          import('../graph/style'),
        ]);
        const cytoscape = cytoscapeMod.default;
        try { cytoscape.use(coseMod.default); } catch { /* already registered */ }
        if (cancelled || !containerRef.current) return;

        const dataset = normMod.normalizeDataset(await loadMod.loadDataset('v4'));
        if (cancelled || !containerRef.current) return;

        const elements: Array<Record<string, unknown>> = [];
        dataset.languageMap.forEach((lang, id) => {
          elements.push({ group: 'nodes', data: { id, label: lang.name, cluster: lang.cluster, degree: lang.degree } });
        });
        dataset.edges.forEach((e) => {
          // Keep every implementation edge; trim weaker influence edges to reduce clutter.
          if ((e.relationship === 'influenced' || e.relationship === 'influenced_by') && e.confidence < 0.88) return;
          elements.push({ group: 'edges', data: { id: e.id, source: e.from_language, target: e.to_language, relationship: e.relationship, confidence: e.confidence } });
        });

        const instance = cytoscape({
          container: containerRef.current,
          elements: elements as never,
          style: styleMod.getCytoscapeStyle(true, false, true),
          layout: { name: 'cose-bilkent', animate: false, randomize: true, nodeRepulsion: 7000, idealEdgeLength: 95, gravity: 0.35, numIter: 600, padding: 36, fit: true } as never,
          minZoom: 0.12,
          maxZoom: 3,
          userZoomingEnabled: false,
          userPanningEnabled: false,
          boxSelectionEnabled: false,
          autoungrabify: true,
          autounselectify: true,
        });
        cyRef.current = instance;

        instance.on('mouseover', 'node', (evt: { target: any }) => {
          const n = evt.target;
          instance.elements().addClass('faded');
          n.removeClass('faded').addClass('hovered');
          const nbr = n.connectedEdges();
          nbr.removeClass('faded').addClass('highlighted');
          nbr.connectedNodes().removeClass('faded');
        });
        instance.on('mouseout', 'node', () => {
          instance.elements().removeClass('faded hovered highlighted');
        });
        instance.on('tap', 'node', (evt: { target: any }) => {
          const id = evt.target.id() as string;
          const prefix = id.startsWith('tool:') ? 'tools' : 'languages';
          const slug = id.replace(/^(lang|tool):/, '').replace(/_/g, '-');
          window.location.href = `/${prefix}/${slug}`;
        });
        (containerRef.current as HTMLDivElement).style.cursor = 'default';
        instance.on('mouseover', 'node', () => { if (containerRef.current) containerRef.current.style.cursor = 'pointer'; });
        instance.on('mouseout', 'node', () => { if (containerRef.current) containerRef.current.style.cursor = 'default'; });

        setPhase('ready');
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();

    return () => { cancelled = true; };
  }, [phase]);

  return (
    <section className="atlas-section" ref={sectionRef} id="atlas">
      <div className="atlas-head">
        <p className="section-eyebrow reveal">The atlas, live</p>
        <h2 className="section-title centered reveal">
          112 nodes. 347 sourced edges.<br /><em>One graph.</em>
        </h2>
        <p className="section-text centered reveal">
          Every programming language and toolchain, connected by what implements what.
          Hover a node to trace its relationships, click to open its record, or open the
          full workspace to filter, search, and follow a bootstrap chain end to end.
        </p>
      </div>
      <div className={`atlas-frame reveal${phase === 'ready' ? ' is-ready' : ''}`}>
        <div className="atlas-canvas" ref={containerRef} aria-hidden="true" />
        {phase !== 'ready' && (
          <div className="atlas-status">
            {phase === 'error' ? 'Graph preview unavailable. Open the full graph below.' : (
              <><span className="atlas-spinner" /> Loading the graph</>
            )}
          </div>
        )}
        <div className="atlas-legend" aria-hidden="true">
          {LEGEND.map((r) => (
            <span key={r.label} className="atlas-legend-item"><i style={{ background: r.color }} />{r.label}</span>
          ))}
        </div>
        <button className="atlas-open" onClick={onOpen}>
          Open the full graph
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
      </div>
    </section>
  );
}
