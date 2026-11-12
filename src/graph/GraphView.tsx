import { useEffect, useRef } from 'react';
import cytoscape, { type Core } from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import { useGraphStore } from '../store/useGraphStore';
import { buildCytoscapeElements } from './buildElements';
import { getCytoscapeStyle } from './style';
import { panelInset } from './viewport';
import { BASE_CYTOSCAPE_CONFIG } from './cytoscapeConfig';
import { DAG_LAYOUT, FORCE_LAYOUT, buildClusterLayout, buildTimelineLayout } from './layouts';
import { activateFocusMode, deactivateFocusMode, applyTimelineVisibility, clearTimelineVisibility, getAncestors, getDescendants, activateExplorationMode, applyAttributeFilters, fitToAiView, fitNodesInView, activateAiOverlay, findShortestPath, activateTracePath } from './selectors';
import './GraphView.css';

// Register cose-bilkent layout
cytoscape.use(coseBilkent);

function getLayout(mode: string, cy?: cytoscape.Core): any {
  switch (mode) {
    case 'dag': return DAG_LAYOUT;
    case 'cluster': return cy ? buildClusterLayout(cy) : FORCE_LAYOUT;
    case 'timeline': return cy ? buildTimelineLayout(cy) : DAG_LAYOUT;
    case 'force':
    default: return FORCE_LAYOUT;
  }
}

/** Clear hover/selection highlighting, keeping an active AI path overlay. */
function restoreBaseHighlight(cy: Core): void {
  const overlay = useGraphStore.getState().aiOverlayNodeIds;
  if (overlay && overlay.length > 0) activateAiOverlay(cy, overlay);
  else deactivateFocusMode(cy);
}

/**
 * The layouts fit and animate the viewport themselves, and layoutstop fires before that
 * animation ends, so wait until nothing is animating before re-fitting the view.
 */
function settle(cy: Core, run: () => void, tries = 0): void {
  const busy = cy.animated() || cy.nodes(':animated').length > 0;
  if (busy && tries < 40) {
    setTimeout(() => settle(cy, run, tries + 1), 100);
    return;
  }
  run();
}

function fitAiWhenSettled(cy: Core, inset: () => number): void {
  settle(cy, () => {
    // A path overlay zooms to its own nodes instead of the whole AI view.
    const overlay = useGraphStore.getState().aiOverlayNodeIds;
    if (overlay && overlay.length > 0) fitNodesInView(cy, cy.nodes().filter((n) => overlay.includes(n.id())), inset());
    else fitToAiView(cy, inset());
  });
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

    instance.on('layoutstop', () => {
      // Deep link: focus the pending node once after layout settles
      const { pendingFocusNodeId, setPendingFocusNodeId, setSelectedNode } = useGraphStore.getState();
      if (pendingFocusNodeId) {
        const target = instance.getElementById(pendingFocusNodeId);
        if (target && target.length > 0) {
          setSelectedNode(pendingFocusNodeId);
          activateFocusMode(instance, pendingFocusNodeId);
          const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!calm) {
            instance.animate({ center: { eles: target }, zoom: 1.4 }, { duration: 600, easing: 'ease-in-out-cubic' });
          }
        }
        setPendingFocusNodeId(null);
        return;
      }

      // Deep link ?view=ai: zoom to the AI nodes once the layout has placed them.
      if (useGraphStore.getState().attributeFilters.ai) {
        fitAiWhenSettled(instance, () => panelInset(containerRef.current));
        return;
      }

      // Cluster layout on wider screens: fit the whole graph into the area the side panel
      // leaves visible (the layout's own fit uses the full canvas, under the panel).
      if (useGraphStore.getState().filters.layoutMode === 'cluster' && !window.matchMedia('(max-width: 640px)').matches) {
        settle(instance, () => fitNodesInView(instance, instance.nodes().filter((n) => !n.isParent()), panelInset(containerRef.current)));
        return;
      }

      if (!window.matchMedia('(max-width: 640px)').matches || instance.zoom() >= 0.4) return;

      const center = {
        x: containerRef.current!.offsetWidth / 2,
        y: containerRef.current!.offsetHeight / 2,
      };
      instance.zoom({ level: 0.4, renderedPosition: center });
    });

    // Fit the whole graph first; phones then apply the readable zoom floor above.
    instance.layout({
      ...getLayout(filters.layoutMode),
      randomize: false,
      animationDuration: 1200,
    }).run();

    setCytoscape(instance);

    // Node tap: lock selection, then smoothly bring it to centre.
    // In trace mode: first tap sets A, second tap sets B and computes path.
    instance.on('tap', 'node', (evt) => {
      const node = evt.target;
      const state = useGraphStore.getState();

      if (state.traceMode) {
        if (!state.traceNodeA) {
          // First node selected: set A, open drawer
          state.setTraceNodes(node.id(), null);
          state.setSelectedNode(node.id());
          state.setSideDrawerOpen(true);
        } else if (node.id() !== state.traceNodeA) {
          // Second node: compute path
          const { datasetIndex, filters: currentFilters } = useGraphStore.getState();
          if (datasetIndex) {
            const activeRelTypes = new Set(
              Object.entries(currentFilters.relationshipFilters)
                .filter(([, v]) => v)
                .map(([k]) => k)
            );
            const result = findShortestPath(datasetIndex, state.traceNodeA, node.id(), activeRelTypes);
            state.setTraceNodes(state.traceNodeA, node.id());
            state.setTracePath(result?.nodes ?? null, result?.edgeIds ?? null);
            state.setSideDrawerOpen(true);
            if (result) {
              activateTracePath(instance, result.nodes, result.edgeIds);
              const pathEles = result.nodes.reduce((col, id) => col.union(instance.getElementById(id)), instance.collection());
              const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
              if (!calm) instance.animate({ fit: { eles: pathEles, padding: 80 } }, { duration: 600, easing: 'ease-in-out-cubic' });
            } else {
              deactivateFocusMode(instance);
            }
          }
        }
        return;
      }

      setSelectedNode(node.id());
      activateFocusMode(instance, node.id());
      history.replaceState(null, '', `/explore?node=${encodeURIComponent(node.id())}`);
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

    // Background tap: clear selection and URL param
    instance.on('tap', (evt) => {
      if (evt.target === instance) {
        const state = useGraphStore.getState();
        if (state.traceMode) {
          state.clearTrace();
          deactivateFocusMode(instance);
          return;
        }
        setSelectedNode(null);
        setSelectedEdge(null);
        restoreBaseHighlight(instance);
        history.replaceState(null, '', '/explore');
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
      restoreBaseHighlight(instance);
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

  useEffect(() => {
    if (!cy || !containerRef.current) return;

    const observer = new ResizeObserver(() => cy.resize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [cy]);

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

    // Deactivate focus mode when filters change (an AI path overlay stays on)
    restoreBaseHighlight(cy);
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
  const aiWasOn = useRef(attributeFilters.ai);
  useEffect(() => {
    if (!cy || !dataset) return;
    applyAttributeFilters(cy, attributeFilters, dataset);
    // Zoom in when the AI view is switched on from the panel (deep links zoom on layoutstop).
    if (attributeFilters.ai && !aiWasOn.current) fitToAiView(cy, panelInset(containerRef.current));
    aiWasOn.current = attributeFilters.ai;
  }, [cy, attributeFilters, dataset]);

  // AI path overlay (chosen in the panel or via ?path=): highlight its nodes and zoom to them
  const aiOverlayNodeIds = useGraphStore((s) => s.aiOverlayNodeIds);
  const overlayShown = useRef(false);
  useEffect(() => {
    if (!cy) return;
    if (aiOverlayNodeIds && aiOverlayNodeIds.length > 0) {
      activateAiOverlay(cy, aiOverlayNodeIds);
      overlayShown.current = true;
      const eles = cy.nodes().filter((n) => aiOverlayNodeIds.includes(n.id()));
      const inset = () => panelInset(containerRef.current);
      settle(cy, () => fitNodesInView(cy, eles, inset()));
    } else if (overlayShown.current) {
      overlayShown.current = false;
      if (!useGraphStore.getState().selectedNodeId) deactivateFocusMode(cy);
    }
  }, [cy, aiOverlayNodeIds]);

  return <div ref={containerRef} className="graph-view" />;
}
