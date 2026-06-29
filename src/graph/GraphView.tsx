import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { useGraphStore } from '../store/useGraphStore';
import { buildCytoscapeElements } from './buildElements';
import { getCytoscapeStyle } from './style';
import { BASE_CYTOSCAPE_CONFIG } from './cytoscapeConfig';
import { DAG_LAYOUT, FORCE_LAYOUT, CLUSTER_LAYOUT, buildTimelineLayout } from './layouts';
import { activateFocusMode, deactivateFocusMode, applyTimelineVisibility, clearTimelineVisibility, getAncestors, getDescendants, activateExplorationMode, applyAttributeFilters } from './selectors';
import './GraphView.css';

// Register cose-bilkent layout
cytoscape.use(coseBilkent);

function getLayout(mode: string, cy?: cytoscape.Core): any {
  switch (mode) {
    case 'dag': return DAG_LAYOUT;
    case 'cluster': return CLUSTER_LAYOUT;
    case 'timeline': return cy ? buildTimelineLayout(cy) : DAG_LAYOUT;
    case 'force':
    default: return FORCE_LAYOUT;
  }
}

export function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    dataset,
    cy,
    filters,
    setCytoscape,
    setSelectedNode,
    setSelectedEdge,
  } = useGraphStore();

  // Initialize Cytoscape instance
  useEffect(() => {
    if (!containerRef.current || !dataset) {
      return;
    }

    const elements = buildCytoscapeElements(dataset, filters);
    const { isDarkMode } = useGraphStore.getState();
    const style = getCytoscapeStyle(filters.clusterColoring, filters.showAllLabels, isDarkMode);

    const instance = cytoscape({
      container: containerRef.current,
      elements,
      style,
      layout: { name: 'preset', positions: () => ({ x: 0, y: 0 }) },
      ...BASE_CYTOSCAPE_CONFIG,
    });

    // Place nodes on a tiny circle around origin so cose-bilkent repulsion has direction to work with
    const nodeCount = instance.nodes().length;
    instance.nodes().positions((_node: any, i: number) => ({
      x: Math.cos((i / nodeCount) * Math.PI * 2) * 5,
      y: Math.sin((i / nodeCount) * Math.PI * 2) * 5,
    }));

    // Center viewport on origin
    const cx = containerRef.current!.offsetWidth / 2;
    const cy = containerRef.current!.offsetHeight / 2;
    instance.pan({ x: cx, y: cy });
    instance.zoom(0.5);

    // Animate nodes bursting outward from center
    instance.layout({
      ...getLayout(filters.layoutMode),
      randomize: false,
      animationDuration: 1800,
    }).run();

    // Several layouts can run while the page mounts; once the entrance settles,
    // ease into the dense core (around C) at a readable zoom rather than fitting
    // all 112 nodes — so nodes read big and the rest is there to pan to. We listen
    // through the whole entrance window so the final settle wins; after that,
    // user-triggered relayouts fit normally.
    const entranceStart = Date.now();
    instance.on('layoutstop', () => {
      if (Date.now() - entranceStart > 3800) return;
      const focal = instance.getElementById('lang:c');
      const target = focal.nonempty() ? focal : instance.nodes();
      instance.animate(
        { center: { eles: target }, zoom: 0.82 },
        { duration: 480, easing: 'ease-in-out-cubic' }
      );
    });

    setCytoscape(instance);

    // Node tap: lock selection, then smoothly bring it to centre.
    instance.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode(node.id());
      activateFocusMode(instance, node.id());
      const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!calm) {
        instance.animate({ center: { eles: node } }, { duration: 430, easing: 'ease-in-out-cubic' });
      }
    });

    // Edge tap
    instance.on('tap', 'edge', (evt) => {
      const edgeId = evt.target.id();
      setSelectedEdge(edgeId);
    });

    // Background tap: clear selection
    instance.on('tap', (evt) => {
      if (evt.target === instance) {
        setSelectedNode(null);
        setSelectedEdge(null);
        deactivateFocusMode(instance);
      }
    });

    // Node hover: highlight neighbors (only when no click selection is active)
    instance.on('mouseover', 'node', (evt) => {
      const { selectedNodeId } = useGraphStore.getState();
      if (selectedNodeId) return;
      const nodeId = evt.target.id();
      evt.target.addClass('hovered');
      activateFocusMode(instance, nodeId);
    });

    instance.on('mouseout', 'node', (evt) => {
      const { selectedNodeId } = useGraphStore.getState();
      if (selectedNodeId) return;
      evt.target.removeClass('hovered');
      deactivateFocusMode(instance);
    });

    // Edge hover: show tooltip
    instance.on('mouseover', 'edge', (evt) => {
      const edge = evt.target;
      const midpoint = edge.renderedMidpoint();
      useGraphStore.getState().setHoveredEdge(edge.id(), { x: midpoint.x, y: midpoint.y });
    });

    instance.on('mouseout', 'edge', () => {
      useGraphStore.getState().setHoveredEdge(null);
    });

    // Zoom-dependent label visibility
    instance.on('zoom', () => {
      const { filters: currentFilters } = useGraphStore.getState();
      if (currentFilters.showAllLabels) {
        instance.batch(() => {
          instance.nodes().removeClass('labels-hidden');
        });
        return;
      }

      const zoom = instance.zoom();
      instance.batch(() => {
        if (zoom < 0.38) {
          instance.nodes().addClass('labels-hidden');
        } else if (zoom < 0.58) {
          instance.nodes().filter('[degree < 20]').addClass('labels-hidden');
          instance.nodes().filter('[degree >= 20]').removeClass('labels-hidden');
        } else if (zoom < 0.88) {
          instance.nodes().filter('[degree < 10]').addClass('labels-hidden');
          instance.nodes().filter('[degree >= 10]').removeClass('labels-hidden');
        } else if (zoom <= 1.3) {
          instance.nodes().filter('[degree < 5]').addClass('labels-hidden');
          instance.nodes().filter('[degree >= 5]').removeClass('labels-hidden');
        } else {
          instance.nodes().removeClass('labels-hidden');
        }
      });
    });

    // Hide edge tooltip on viewport changes
    instance.on('pan zoom', () => {
      const { hoveredEdgeId } = useGraphStore.getState();
      if (hoveredEdgeId) {
        useGraphStore.getState().setHoveredEdge(null);
      }
    });

    // Cleanup on unmount
    return () => {
      instance.destroy();
      setCytoscape(null);
    };
  }, [dataset, setCytoscape, setSelectedNode, setSelectedEdge]);

  // Update graph when filters or theme change
  const isDarkMode = useGraphStore((s) => s.isDarkMode);
  useEffect(() => {
    if (!cy || !dataset) {
      return;
    }

    const elements = buildCytoscapeElements(dataset, filters);
    const style = getCytoscapeStyle(filters.clusterColoring, filters.showAllLabels, isDarkMode);

    cy.style(style);
    cy.json({ elements });

    // Deactivate focus mode when filters change
    deactivateFocusMode(cy);
  }, [cy, dataset, filters, isDarkMode]);

  // Update layout when layout mode changes
  useEffect(() => {
    if (!cy) {
      return;
    }

    const layout = getLayout(filters.layoutMode, cy);
    cy.layout(layout).run();
  }, [cy, filters.layoutMode]);

  // Timeline year visibility (lightweight class toggling, no relayout)
  const timelineYear = useGraphStore((s) => s.timelineYear);
  useEffect(() => {
    if (!cy) return;
    if (filters.layoutMode === 'timeline') {
      applyTimelineVisibility(cy, timelineYear);
    } else {
      clearTimelineVisibility(cy);
    }
  }, [cy, timelineYear, filters.layoutMode]);

  // Exploration mode: ancestor/descendant/full lineage highlighting
  const explorationMode = useGraphStore((s) => s.explorationMode);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const datasetIndex = useGraphStore((s) => s.datasetIndex);
  useEffect(() => {
    if (!cy || !selectedNodeId || !datasetIndex) return;

    if (explorationMode === 'none') {
      activateFocusMode(cy, selectedNodeId);
      return;
    }

    let relatedNodes: Set<string>;
    if (explorationMode === 'ancestors') {
      relatedNodes = getAncestors(datasetIndex, selectedNodeId);
    } else if (explorationMode === 'descendants') {
      relatedNodes = getDescendants(datasetIndex, selectedNodeId);
    } else {
      // 'focus' = full lineage (ancestors + descendants)
      const ancestors = getAncestors(datasetIndex, selectedNodeId);
      const descendants = getDescendants(datasetIndex, selectedNodeId);
      relatedNodes = new Set([...ancestors, ...descendants]);
    }

    activateExplorationMode(cy, selectedNodeId, relatedNodes);
  }, [cy, explorationMode, selectedNodeId, datasetIndex]);

  // Attribute filters: fade nodes that don't match paradigm/typing/decade
  const attributeFilters = useGraphStore((s) => s.attributeFilters);
  useEffect(() => {
    if (!cy || !dataset) return;
    applyAttributeFilters(cy, attributeFilters, dataset);
  }, [cy, attributeFilters, dataset]);

  return <div ref={containerRef} className="graph-view" />;
}
