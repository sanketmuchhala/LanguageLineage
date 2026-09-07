import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hierarchy, tree as d3tree, type HierarchyNode, type HierarchyPointNode } from 'd3-hierarchy';
import { select, type BaseType, type Selection } from 'd3-selection';
import { linkHorizontal } from 'd3-shape';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import 'd3-transition';
import { useGraphStore } from '../../store/useGraphStore';
import { buildHierarchy } from './buildHierarchy';
import {
  RELATIONSHIP_COLOR_VAR,
  RELATIONSHIP_LABEL,
  allExpandableIds,
  describeHiddenRelationships,
  defaultCollapsedIds,
  dominantRelationship,
  findMatchingNodes,
  findPathToNode,
  formatYearRange,
  secondaryRelationshipCount,
} from './treeUtils';
import { VIRTUAL_ROOT_ID, type TreeNodeDatum } from './treeTypes';
import './TreeView.css';

/** Vertical gap between siblings and horizontal gap between depths. */
const NODE_SIZE: [number, number] = [26, 230];
const INITIAL_DEPTH = 2;
const DURATION = 260;

type PointNode = HierarchyPointNode<TreeNodeDatum>;

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function TreeView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  /** Previous laid-out position per node id, so children animate out of their parent. */
  const positionsRef = useRef(new Map<string, { x: number; y: number }>());
  /** The node whose toggle triggered the current render; children fly from it. */
  const sourceRef = useRef<string | null>(null);
  const didInitialFit = useRef(false);
  const fitFrameRef = useRef<number | null>(null);

  const dataset = useGraphStore((s) => s.dataset);
  const relationshipFilters = useGraphStore((s) => s.filters.relationshipFilters);
  const confidenceThreshold = useGraphStore((s) => s.filters.confidenceThreshold);
  const graphMode = useGraphStore((s) => s.filters.graphMode);
  const searchQuery = useGraphStore((s) => s.filters.searchQuery);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setTreeController = useGraphStore((s) => s.setTreeController);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [revealedSecondary, setRevealedSecondary] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [seededFor, setSeededFor] = useState<TreeNodeDatum | null>(null);

  // Rebuilding is the expensive step, so it only reruns when the inputs that
  // actually change the hierarchy change. Search is deliberately excluded: it
  // expands and highlights, it never reshapes the tree.
  const { root: rootDatum, nodeCount } = useMemo(
    () => buildHierarchy(dataset, { relationshipFilters, confidenceThreshold, graphMode }),
    [dataset, relationshipFilters, confidenceThreshold, graphMode]
  );

  // Seed the collapsed set during render rather than in an effect. Doing it in
  // an effect would paint the whole tree expanded for one frame before
  // collapsing it, which on the full dataset is a visible flash of ~150 nodes.
  if (seededFor !== rootDatum) {
    setSeededFor(rootDatum);
    setCollapsed(defaultCollapsedIds(rootDatum, INITIAL_DEPTH));
    setRevealedSecondary(new Set());
    positionsRef.current.clear();
    sourceRef.current = null;
    didInitialFit.current = false;
  }

  const toggleCollapse = useCallback((id: string) => {
    sourceRef.current = id;
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSecondary = useCallback((id: string) => {
    sourceRef.current = id;
    setRevealedSecondary((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Lay out only the visible part of the tree: collapsed nodes report no children.
  const layout = useMemo(() => {
    const h = hierarchy<TreeNodeDatum>(rootDatum, (d) =>
      collapsed.has(d.id) ? [] : d.children
    );
    const layoutFn = d3tree<TreeNodeDatum>().nodeSize(NODE_SIZE);
    return layoutFn(h as HierarchyNode<TreeNodeDatum>);
  }, [rootDatum, collapsed]);

  const applyTransform = useCallback((x: number, y: number, k: number) => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    // A detached or zero-size container has no meaningful viewport to transform.
    const box = svg.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const sel = select<SVGSVGElement, unknown>(svg);
    const target = zoomIdentity.translate(x, y).scale(k);
    if (prefersReducedMotion()) sel.call(zoomRef.current.transform, target);
    else sel.transition().duration(400).call(zoomRef.current.transform, target);
  }, []);

  const fitToView = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const nodes = layout.descendants() as PointNode[];
    if (nodes.length === 0) return;

    const xs = nodes.map((d) => d.x);
    const ys = nodes.map((d) => d.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const { width, height } = svg.getBoundingClientRect();
    // Leave room for labels, which extend to the right of each node point.
    const treeW = maxY - minY + 260;
    const treeH = maxX - minX + 80;
    const k = Math.min(1.1, Math.max(0.15, Math.min(width / treeW, height / treeH)));
    const tx = width / 2 - ((minY + maxY) / 2) * k;
    const ty = height / 2 - ((minX + maxX) / 2) * k;
    applyTransform(tx, ty, k);
  }, [layout, applyTransform]);

  const centerOnNode = useCallback(
    (nodeId: string) => {
      const svg = svgRef.current;
      if (!svg) return;
      const match = (layout.descendants() as PointNode[]).find((d) => d.data.id === nodeId);
      if (!match) return;
      const { width, height } = svg.getBoundingClientRect();
      const k = 1;
      applyTransform(width / 2 - match.y * k - 40, height / 2 - match.x * k, k);
    },
    [layout, applyTransform]
  );

  // Expose imperative controls so the shared NavigationControls can drive the
  // tree the same way it drives Cytoscape.
  useEffect(() => {
    setTreeController({
      fit: fitToView,
      reset: () => {
        setCollapsed(defaultCollapsedIds(rootDatum, INITIAL_DEPTH));
        setRevealedSecondary(new Set());
      },
      centerOnNode,
      expandAll: () => setCollapsed(new Set()),
      collapseAll: () => setCollapsed(allExpandableIds(rootDatum)),
    });
    return () => setTreeController(null);
  }, [setTreeController, fitToView, centerOnNode, rootDatum]);

  // Zoom and pan, attached once per mount and torn down on unmount.
  useEffect(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const behavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 2.5])
      .on('zoom', (event) => {
        select(g).attr('transform', event.transform.toString());
      });

    zoomRef.current = behavior;
    const sel = select<SVGSVGElement, unknown>(svg);
    sel.call(behavior).on('dblclick.zoom', null);

    return () => {
      sel.on('.zoom', null);
      zoomRef.current = null;
    };
  }, []);

  // Search: expand the path to the best match, centre it, and mark it. The rest
  // of the tree stays visible.
  const matchIds = useMemo(() => {
    const matches = findMatchingNodes(rootDatum, searchQuery);
    return new Set(matches.map((m) => m.id));
  }, [rootDatum, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const matches = findMatchingNodes(rootDatum, searchQuery);
    if (matches.length === 0) return;
    const path = findPathToNode(rootDatum, matches[0].id);
    if (path.length === 0) return;

    // Expand every ancestor; the match itself keeps whatever state it had.
    setCollapsed((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of path.slice(0, -1)) {
        if (next.delete(id)) changed = true;
      }
      return changed ? next : prev;
    });
    sourceRef.current = matches[0].id;

    const raf = requestAnimationFrame(() => centerOnNode(matches[0].id));
    return () => cancelAnimationFrame(raf);
  }, [searchQuery, rootDatum, centerOnNode]);

  // The D3 render. A data join, not a teardown, so repeated renders reuse
  // existing elements instead of accumulating them.
  useEffect(() => {
    const g = gRef.current;
    if (!g) return;

    const gSel = select(g);
    const nodes = layout.descendants().filter((d) => d.data.id !== VIRTUAL_ROOT_ID) as PointNode[];
    const links = layout.links().filter((l) => l.source.data.id !== VIRTUAL_ROOT_ID) as Array<{
      source: PointNode;
      target: PointNode;
    }>;

    const calm = prefersReducedMotion();
    // Under reduced motion we skip transitions entirely rather than running
    // zero-length ones, so no animation frames are scheduled at all.
    function animate<T extends BaseType, D>(
      sel: Selection<T, D, BaseType, unknown>
    ): Selection<T, D, BaseType, unknown> {
      return calm
        ? sel
        : (sel.transition().duration(DURATION) as unknown as Selection<T, D, BaseType, unknown>);
    }

    // Children fly out of whichever node was toggled; falling back to the first
    // visible node keeps the very first render from animating from the corner.
    const sourceId = sourceRef.current;
    const origin: { x: number; y: number } =
      (sourceId !== null ? positionsRef.current.get(sourceId) : undefined) ??
      (nodes.length > 0 ? positionsRef.current.get(nodes[0].data.id) : undefined) ??
      { x: 0, y: 0 };

    const linkGen = linkHorizontal<unknown, { x: number; y: number }>()
      .x((d) => d.y)
      .y((d) => d.x);

    // ---- links -------------------------------------------------------------
    let linkLayer = gSel.select<SVGGElement>('g.tree-links');
    if (linkLayer.empty()) linkLayer = gSel.append('g').attr('class', 'tree-links');

    linkLayer
      .selectAll<SVGPathElement, { source: PointNode; target: PointNode }>('path.tree-link')
      .data(links, (d) => d.target.data.id)
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('class', 'tree-link')
            .attr('d', () => linkGen({ source: origin, target: origin }) ?? '')
            .attr('stroke', (d) => {
              const rel = dominantRelationship(d.target.data.primaryRelationships);
              return rel ? RELATIONSHIP_COLOR_VAR[rel] : 'var(--atlas-border-strong)';
            })
            .call((sel) =>
              animate(sel).attr('d', (d) => linkGen({ source: d.source, target: d.target }) ?? '')
            ),
        (update) =>
          update
            .attr('stroke', (d) => {
              const rel = dominantRelationship(d.target.data.primaryRelationships);
              return rel ? RELATIONSHIP_COLOR_VAR[rel] : 'var(--atlas-border-strong)';
            })
            .call((sel) =>
              animate(sel).attr('d', (d) => linkGen({ source: d.source, target: d.target }) ?? '')
            ),
        (exit) =>
          exit.call((sel) =>
            animate(sel)
              .attr('d', () => linkGen({ source: origin, target: origin }) ?? '')
              .remove()
          )
      )
      .classed('is-dimmed', (d) =>
        hoveredId !== null &&
        d.source.data.id !== hoveredId &&
        d.target.data.id !== hoveredId
      );

    // ---- nodes -------------------------------------------------------------
    let nodeLayer = gSel.select<SVGGElement>('g.tree-nodes');
    if (nodeLayer.empty()) nodeLayer = gSel.append('g').attr('class', 'tree-nodes');

    const nodeSel = nodeLayer
      .selectAll<SVGGElement, PointNode>('g.tree-node')
      .data(nodes, (d) => d.data.id)
      .join(
        (enter) => {
          const gEnter = enter
            .append('g')
            .attr('class', 'tree-node')
            .attr('transform', `translate(${origin.y},${origin.x})`)
            .attr('opacity', 0);

          gEnter.append('circle').attr('class', 'tree-node-dot').attr('r', 4.5);
          gEnter.append('text').attr('class', 'tree-node-label').attr('dy', '0.32em');
          gEnter.append('text').attr('class', 'tree-node-badge').attr('dy', '0.32em');
          gEnter.append('title');
          return gEnter;
        },
        (update) => update,
        (exit) =>
          exit.call((sel) =>
            animate(sel)
              .attr('transform', `translate(${origin.y},${origin.x})`)
              .attr('opacity', 0)
              .remove()
          )
      );

    nodeSel
      .classed('is-selected', (d) => d.data.id === selectedNodeId)
      .classed('is-match', (d) => matchIds.has(d.data.id))
      .classed('is-hovered', (d) => d.data.id === hoveredId)
      .classed('is-dimmed', (d) => {
        if (hoveredId === null) return false;
        if (d.data.id === hoveredId) return false;
        return !(d.parent?.data.id === hoveredId) && !d.children?.some((c) => c.data.id === hoveredId);
      })
      .classed('has-children', (d) => d.data.children.length > 0)
      .classed('is-collapsed', (d) => collapsed.has(d.data.id));

    animate(nodeSel)
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .attr('opacity', 1);

    nodeSel
      .select<SVGCircleElement>('circle.tree-node-dot')
      .attr('r', (d) => (d.data.children.length > 0 ? 5.5 : 4))
      .on('click', (event, d) => {
        event.stopPropagation();
        if (d.data.children.length > 0) toggleCollapse(d.data.id);
        else setSelectedNode(d.data.id);
      });

    nodeSel
      .select<SVGTextElement>('text.tree-node-label')
      .attr('x', 11)
      .attr('text-anchor', 'start')
      .text((d) => (d.data.selfHosted ? `${d.data.name} ↻` : d.data.name))
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.data.id);
      });

    // "+N" affordance for parents that could not be shown structurally.
    nodeSel
      .select<SVGTextElement>('text.tree-node-badge')
      .attr('x', (d) => 11 + Math.max(d.data.name.length * 6.6, 18) + (d.data.selfHosted ? 12 : 0))
      .text((d) => {
        const count = secondaryRelationshipCount(d.data);
        if (count === 0) return '';
        return revealedSecondary.has(d.data.id) ? '−' : `+${count}`;
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        toggleSecondary(d.data.id);
      });

    nodeSel.select('title').text((d) => {
      const parts: string[] = [d.data.name];
      if (d.data.firstReleaseYear) parts.push(`First released ${d.data.firstReleaseYear}`);
      for (const rel of d.data.primaryRelationships) {
        const years = formatYearRange(rel);
        parts.push(
          `${RELATIONSHIP_LABEL[rel.relationship]}${years ? ` (${years})` : ''} · confidence ${rel.confidence}`
        );
      }
      if (d.data.selfHosted) parts.push('Self-hosted');
      const extra = secondaryRelationshipCount(d.data);
      if (extra > 0) parts.push(`${extra} more relationship${extra === 1 ? '' : 's'}`);
      return parts.join('\n');
    });

    nodeSel
      .on('mouseenter', (_event, d) => setHoveredId(d.data.id))
      .on('mouseleave', () => setHoveredId(null));

    // ---- secondary-relationship detail lines --------------------------------
    const secondaryLines = nodeSel
      .selectAll<SVGTextElement, string>('text.tree-secondary')
      .data(
        (d) => (revealedSecondary.has(d.data.id) ? describeHiddenRelationships(d.data) : []),
        (_d, i) => String(i)
      );

    secondaryLines.exit().remove();
    secondaryLines
      .enter()
      .append('text')
      .attr('class', 'tree-secondary')
      .merge(secondaryLines as never)
      .attr('x', 14)
      .attr('y', (_d, i) => 13 + i * 12)
      .text((d) => d);

    // Record positions for the next render's animation origin.
    positionsRef.current.clear();
    for (const n of nodes) positionsRef.current.set(n.data.id, { x: n.x, y: n.y });

    if (!didInitialFit.current && nodes.length > 0) {
      didInitialFit.current = true;
      fitFrameRef.current = requestAnimationFrame(fitToView);
    }

    return () => {
      if (fitFrameRef.current !== null) {
        cancelAnimationFrame(fitFrameRef.current);
        fitFrameRef.current = null;
      }
    };
  }, [
    layout,
    collapsed,
    revealedSecondary,
    hoveredId,
    selectedNodeId,
    matchIds,
    toggleCollapse,
    toggleSecondary,
    setSelectedNode,
    fitToView,
  ]);

  // Remove every generated element on unmount so repeated Network/Tree switches
  // cannot leak SVG nodes or listeners.
  useEffect(() => {
    const g = gRef.current;
    return () => {
      if (g) {
        const sel = select(g);
        sel.selectAll('*').interrupt().on('.zoom', null).remove();
        sel.interrupt();
      }
      positionsRef.current.clear();
    };
  }, []);

  const isEmpty = nodeCount === 0;

  return (
    <div className="tree-view">
      <svg ref={svgRef} className="tree-svg" role="presentation">
        <g ref={gRef} />
      </svg>

      {isEmpty && (
        <div className="tree-empty">
          {graphMode === 'influence' ? (
            <p>
              Tree view shows implementation lineage. Switch to <strong>Implementation</strong> mode
              to see what built what.
            </p>
          ) : (
            <p>No implementation relationships match the current filters.</p>
          )}
        </div>
      )}

      <div className="tree-legend" aria-hidden="true">
        <span className="tree-legend-item">
          <i style={{ background: 'var(--rel-compiler)' }} /> Compiler
        </span>
        <span className="tree-legend-item">
          <i style={{ background: 'var(--rel-runtime)' }} /> Runtime
        </span>
        <span className="tree-legend-item">
          <i style={{ background: 'var(--rel-bootstrap)' }} /> Bootstrap
        </span>
        <span className="tree-legend-hint">↻ self-hosted · +N more relationships</span>
      </div>
    </div>
  );
}

export default TreeView;
