/**
 * The Cluster layout (buildClusterLayout) must lay out every node without overlaps,
 * come out the same on every run, and stay compact enough to fit the canvas: the force
 * layout it replaced spread the graph over ~33,000px and changed from run to run.
 */
import cytoscape from 'cytoscape';
import { describe, it, expect } from 'vitest';
import lineage from '../../dataset/v5/lineage_v5.json';
import { buildClusterLayout } from './layouts';

function graph() {
  const ids = new Set(lineage.languages.map((n) => n.id));
  const degree = new Map<string, number>();
  for (const r of lineage.relationships) for (const id of [r.from_language, r.to_language]) degree.set(id, (degree.get(id) ?? 0) + 1);
  const clusters = [...new Set(lineage.languages.map((n) => n.cluster_hint))];
  const cy = cytoscape({
    headless: true,
    styleEnabled: true,
    style: [{ selector: 'node', style: { width: 'mapData(degree, 0, 30, 40, 110)', height: 'mapData(degree, 0, 30, 40, 110)' } }],
    elements: [
      ...clusters.map((c) => ({ data: { id: `cluster:${c}` } })),
      ...lineage.languages.map((n) => ({ data: { id: n.id, label: n.name, degree: degree.get(n.id) ?? 0, parent: `cluster:${n.cluster_hint}` } })),
      ...lineage.relationships.filter((r) => ids.has(r.from_language) && ids.has(r.to_language) && r.from_language !== r.to_language)
        .map((r, i) => ({ data: { id: `e${i}`, source: r.from_language, target: r.to_language } })),
    ],
  });
  // Without animation so positions apply synchronously in a headless test.
  cy.layout({ ...buildClusterLayout(cy), animate: false }).run();
  return cy;
}

const overlaps = (boxes: Array<{ x1: number; x2: number; y1: number; y2: number }>) => {
  let n = 0;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2) n++;
  }
  return n;
};

describe('Cluster layout', () => {
  const cy = graph();
  const leaves = cy.nodes().filter((n) => !n.isParent());

  it('places every node without overlapping another node or another cluster', () => {
    expect(leaves.length).toBe(lineage.languages.length);
    expect(overlaps(leaves.map((n) => n.boundingBox({ includeLabels: false })))).toBe(0);
    expect(overlaps(cy.nodes(':parent').map((n) => n.boundingBox()))).toBe(0);
  });

  it('is deterministic', () => {
    const again = graph();
    for (const n of leaves) expect(again.getElementById(n.id()).position(), n.id()).toEqual(n.position());
  });

  it('is compact enough to fit a 1140x900 canvas above the minimum zoom (0.15)', () => {
    const bb = leaves.boundingBox({ includeLabels: false });
    expect(Math.min(1140 / bb.w, 900 / bb.h)).toBeGreaterThan(0.15);
  });
});
