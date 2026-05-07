import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { loadDataset } from '../data/loadDataset';
import { normalizeDataset } from '../data/normalizeDataset';
import { getCytoscapeStyle } from '../graph/style';

cytoscape.use(coseBilkent);

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
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found'>('loading');

  useEffect(() => {
    if (!containerRef.current || !slug) { setStatus('not-found'); return; }
    const container = containerRef.current;
    let cy: cytoscape.Core | null = null;

    async function init() {
      try {
        const raw = await loadDataset('v4');
        const dataset = normalizeDataset(raw);

        // Find node ID from slug
        const nodeId = [...dataset.languageMap.keys()].find(
          id => idToSlug(id) === slug
        );
        if (!nodeId) { setStatus('not-found'); return; }

;

        // 1-hop subgraph
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
            data: {
              id,
              label: lang.name,
              cluster: lang.cluster,
              degree: lang.degree,
              isCenter: id === nodeId,
            },
            group: 'nodes',
          });
        });

        connectedEdges.forEach((e) => {
          elements.push({
            data: {
              id: e.id,
              source: e.from_language,
              target: e.to_language,
              relationship: e.relationship,
              confidence: e.confidence,
            },
            group: 'edges',
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
            nodeRepulsion: () => 6000,
            idealEdgeLength: () => 100,
            gravity: 0.4,
            numIter: 500,
            padding: 50,
            fit: true,
          } as any,
          minZoom: 0.2,
          maxZoom: 4,
        });

        // Make center node stand out
        cy.getElementById(nodeId).style({
          'width': 80,
          'height': 80,
          'border-width': 4,
          'border-color': '#c9a87c',
          'border-opacity': 1,
        } as any);

        // Click: navigate parent to the language page
        cy.on('tap', 'node', evt => {
          const id = evt.target.id();
          const targetSlug = idToSlug(id);
          const prefix = idToPrefix(id);
          window.parent.location.href = `/${prefix}/${targetSlug}`;
        });

        // Hover cursor
        cy.on('mouseover', 'node', () => {
          container.style.cursor = 'pointer';
        });
        cy.on('mouseout', 'node', () => {
          container.style.cursor = 'default';
        });

        setStatus('ready');
      } catch {
        setStatus('not-found');
      }
    }

    init();
    return () => { cy?.destroy(); };
  }, [slug]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#0a0a0b', position: 'relative' }}>
      {status === 'loading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a958c', fontFamily: 'system-ui, sans-serif', fontSize: '13px' }}>
          Loading graph...
        </div>
      )}
      {status === 'not-found' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a564f', fontFamily: 'system-ui, sans-serif', fontSize: '13px' }}>
          No graph data
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default EmbedGraph;
