import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { loadDataset } from '../data/loadDataset';
import { normalizeDataset } from '../data/normalizeDataset';
import { getCytoscapeStyle } from '../graph/style';

// Guard against double-registration when shared bundle loads this module twice
try { cytoscape.use(coseBilkent); } catch { /* already registered */ }

function idToSlug(id: string): string {
  return id.replace(/^(lang|tool):/, '').replace(/_/g, '-');
}
function idToPrefix(id: string): string {
  return id.startsWith('tool:') ? 'tools' : 'languages';
}

export function EmbedGraph() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('lang') ?? '';
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!slug) { setError('No language specified'); return; }
    const container = containerRef.current;
    if (!container) { setError('Container not mounted'); return; }

    let cy: cytoscape.Core | null = null;
    let cancelled = false;

    (async () => {
      try {
        const raw = await loadDataset('v4');
        if (cancelled) return;

        const dataset = normalizeDataset(raw);

        const nodeId = [...dataset.languageMap.keys()].find(
          id => idToSlug(id) === slug
        );
        if (!nodeId) { setError(`Language "${slug}" not found in dataset`); return; }

        const connectedEdges = dataset.edges.filter(
          e => e.from_language === nodeId || e.to_language === nodeId
        );
        const nodeIds = new Set([nodeId]);
        connectedEdges.forEach(e => {
          nodeIds.add(e.from_language);
          nodeIds.add(e.to_language);
        });

        const elements: cytoscape.ElementDefinition[] = [];
        nodeIds.forEach(id => {
          const lang = dataset.languageMap.get(id);
          if (!lang) return;
          elements.push({
            group: 'nodes',
            data: {
              id,
              label: lang.name,
              cluster: lang.cluster,
              degree: lang.degree,
            },
          });
        });
        connectedEdges.forEach(e => {
          elements.push({
            group: 'edges',
            data: {
              id: e.id,
              source: e.from_language,
              target: e.to_language,
              relationship: e.relationship,
              confidence: e.confidence,
            },
          });
        });

        const style = getCytoscapeStyle(true, true, true);

        cy = cytoscape({
          container,
          elements,
          style,
          layout: {
            name: 'cose-bilkent',
            animate: false,
            randomize: true,
            nodeRepulsion: 6000,
            idealEdgeLength: 100,
            gravity: 0.4,
            numIter: 500,
            padding: 50,
            fit: true,
          } as any,
          minZoom: 0.2,
          maxZoom: 4,
        });

        // Center node: gold highlight
        cy.getElementById(nodeId).style({
          width: 80,
          height: 80,
          'border-width': 4,
          'border-color': '#4ade80',
          'border-opacity': 1,
        } as any);

        cy.on('tap', 'node', evt => {
          const id = evt.target.id() as string;
          window.parent.location.href = `/${idToPrefix(id)}/${idToSlug(id)}`;
        });
        cy.on('mouseover', 'node', () => { container.style.cursor = 'pointer'; });
        cy.on('mouseout', 'node', () => { container.style.cursor = 'default'; });

        setReady(true);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => { cancelled = true; cy?.destroy(); };
  }, [slug]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000000', position: 'relative' }}>
      {!ready && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', fontFamily: 'system-ui', fontSize: '13px' }}>
          Loading graph...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f5f68', fontFamily: 'system-ui', fontSize: '12px', padding: '16px', textAlign: 'center' }}>
          {error}
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default EmbedGraph;
