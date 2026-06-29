import type { StylesheetStyle } from 'cytoscape';
import type { ClusterType, RelationshipType } from '../data/types';
import { getAdaptiveLogoBackground, getLogoBorderColor } from '../utils/colorContrast';

const MIN_NODE_SIZE = 58;
const MAX_NODE_SIZE = 132;
const DEFAULT_NODE_COLOR = '#1c1c1c';

function getLogoRenderSize(ele: any): string {
  const rawSize = String(ele.data('logoSize') || '64%');
  const scale = Number.parseFloat(rawSize) / 100;
  const nodeSize = Number(ele.width()) || 48;
  const boundedScale = Number.isFinite(scale) && scale > 0 ? scale : 0.64;
  return `${Math.max(18, Math.round(nodeSize * boundedScale))}px`;
}

// Compiler Atlas: cool technical cluster palette (secondary, used when cluster coloring is on)
export const CLUSTER_COLORS: Record<ClusterType, string> = {
  c_family: '#f59e0b',      // amber
  jvm_dotnet: '#34d399',    // emerald
  js_engines: '#fbbf24',    // yellow
  functional: '#a78bfa',    // violet
  systems: '#38bdf8',       // sky
  scripting: '#2dd4bf',     // teal
  compilers: '#94a3b8',     // slate
  other: '#64748b',         // deep slate
  clr: '#818cf8',           // indigo
  dynamic: '#4ade80',       // cyan
  historical: '#a8a29e',    // warm gray
  jvm: '#60a5fa',           // blue
  roots: '#cbd5e1',         // light slate
  scientific: '#5eead4',    // light teal
  tools: '#e2e8f0',         // near-white (tools read lighter)
};

// Semantic edge colors by data category (compiler/runtime/bootstrap/rewrite/influence/transpile)
export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  compiler_written_in: '#e3a008',   // compiler implementation (amber)
  runtime_written_in: '#34d399',    // runtime / VM (green)
  bootstrap_written_in: '#a78bfa',  // bootstrap (violet)
  rewritten_in: '#fb7185',          // rewritten in (rose)
  influenced: '#60a5fa',            // influence (blue)
  influenced_by: '#60a5fa',         // influence (blue)
  transpiled_to: '#22d3ee',         // transpilation (cyan)
};

export const RELATIONSHIP_LINE_STYLES: Record<RelationshipType, string> = {
  compiler_written_in: 'solid',
  runtime_written_in: 'solid',
  bootstrap_written_in: 'dashed',
  rewritten_in: 'dashed',
  influenced: 'dotted',
  influenced_by: 'dotted',
  transpiled_to: 'dashed',
};

export function getCytoscapeStyle(
  clusterColoring: boolean,
  _showAllLabels: boolean,
  isDarkMode: boolean = false
): StylesheetStyle[] {
  const labelColor = isDarkMode ? '#fafafa' : '#1a1b1e';
  const labelOutlineColor = isDarkMode ? '#000000' : '#ffffff';
  const parentBorderColor = isDarkMode ? '#1f1f1f' : '#e2e5e9';
  const parentTextColor = isDarkMode ? '#9a9a9a' : '#5c6370';

  return [
    // Base node style
    {
      selector: 'node',
      style: {
        width: `mapData(degree, 0, 30, ${MIN_NODE_SIZE}, ${MAX_NODE_SIZE})` as any,
        height: `mapData(degree, 0, 30, ${MIN_NODE_SIZE}, ${MAX_NODE_SIZE})` as any,
        'background-color': clusterColoring
          ? ((ele: any) => {
            const cluster = ele.data('cluster') as ClusterType;
            return CLUSTER_COLORS[cluster] || DEFAULT_NODE_COLOR;
          })
          : DEFAULT_NODE_COLOR,
        'border-width': 2,
        'border-color': '#00000020',
        'border-opacity': 1,
        'font-size': 'mapData(degree, 0, 30, 13, 19)' as any,
        'font-weight': 600 as any,
        'color': labelColor,
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 8,
        'text-outline-width': 3,
        'text-outline-color': labelOutlineColor,
        'text-outline-opacity': 0.9,
        'min-zoomed-font-size': 7,
        label: 'data(label)',
        'text-wrap': 'wrap' as any,
        'text-max-width': 'mapData(degree, 0, 30, 90, 150)' as any,
      },
    },

    // Logo nodes - seamless integration with background
    {
      selector: 'node[logoUrl]',
      style: {
        'background-color': ((ele: any) => {
          const logoColor = ele.data('logoColor');
          const logoSurface = ele.data('logoSurface') || 'dark';
          return getAdaptiveLogoBackground(logoColor, isDarkMode, logoSurface);
        }) as any,

        // Display logo, carefully sized to fit within the circular node
        'background-image': 'data(logoUrl)' as any,
        'background-fit': 'none' as any,
        'background-width': getLogoRenderSize as any,
        'background-height': getLogoRenderSize as any,
        'background-position-x': '50%' as any,
        'background-position-y': ((ele: any) => ele.data('logoOffsetY') || '50%') as any,
        'background-repeat': 'no-repeat' as any,
        'background-image-opacity': 1,
        'background-clip': 'node' as any,

        // Subtle border for definition
        'border-width': 2.5,
        'border-color': ((ele: any) => {
          const logoColor = ele.data('logoColor');
          const logoSurface = ele.data('logoSurface') || 'dark';
          return getLogoBorderColor(logoColor, isDarkMode, logoSurface);
        }) as any,
        'border-opacity': 1,

        // Smooth transitions
        'transition-property': 'border-width, border-color, border-opacity' as any,
        'transition-duration': '0.2s' as any,
        'transition-timing-function': 'ease-out' as any,
      },
    },

    // Logo node hover effect - warm accent glow
    {
      selector: 'node[logoUrl].hovered',
      style: {
        'border-width': 4,
        'border-color': '#4ade80',
        'border-opacity': 1,
        'z-index': 1001,
        'overlay-opacity': 0.15,
        'overlay-color': '#4ade80',
      },
    },

    // Compound parent nodes (cluster layout)
    {
      selector: ':parent',
      style: {
        'background-opacity': 0.06,
        'background-color': ((ele: any) => {
          const id = ele.id().replace('cluster:', '') as ClusterType;
          return CLUSTER_COLORS[id] || '#999';
        }) as any,
        'border-width': 1,
        'border-color': parentBorderColor,
        'border-opacity': 0.6,
        label: 'data(label)',
        'font-size': '14px',
        'text-valign': 'top' as any,
        'text-halign': 'center',
        color: parentTextColor,
        'text-outline-width': 0,
        shape: 'roundrectangle' as any,
        padding: '20px' as any,
      },
    },

    // Hidden labels (zoom-dependent)
    {
      selector: 'node.labels-hidden',
      style: {
        label: '' as any,
      },
    },

    // Hovered node - warm accent glow
    {
      selector: 'node.hovered',
      style: {
        label: 'data(label)' as any,
        'border-width': 3.5,
        'border-color': '#4ade80',
        'border-opacity': 0.9,
        'z-index': 1001,
        'overlay-opacity': 0.12,
        'overlay-color': '#4ade80',
      },
    },

    // Highlighted nodes (ancestors / descendants / neighbors) — visible, no glow
    {
      selector: 'node.highlighted',
      style: {
        'border-width': 2.5,
        'border-color': '#4ade80',
        'border-opacity': 0.6,
        'z-index': 100,
        'overlay-opacity': 0,
      },
    },

    // The single selected/clicked node — glow treatment
    {
      selector: 'node.selected',
      style: {
        'border-width': 4,
        'border-color': '#4ade80',
        'border-opacity': 1,
        'z-index': 1000,
        'overlay-opacity': 0.18,
        'overlay-color': '#4ade80',
      },
    },

    // Attribute-faded nodes
    {
      selector: 'node.attribute-faded',
      style: {
        opacity: 0.15,
      },
    },

    // Faded nodes (focus mode)
    {
      selector: 'node.faded',
      style: {
        opacity: 0.15,
      },
    },

    // Base edge style
    {
      selector: 'edge',
      style: {
        width: ((ele: any) => {
          const relationship = ele.data('relationship') as RelationshipType;
          if (relationship === 'influenced' || relationship === 'influenced_by') return 1.2;
          return relationship === 'runtime_written_in' ? 1.2 : 1.8;
        }) as any,
        'line-color': ((ele: any) => {
          const relationship = ele.data('relationship') as RelationshipType;
          return RELATIONSHIP_COLORS[relationship] || '#90a4ae';
        }) as any,
        'line-style': ((ele: any) => {
          const relationship = ele.data('relationship') as RelationshipType;
          return RELATIONSHIP_LINE_STYLES[relationship] || 'solid';
        }) as any,
        'line-dash-pattern': [6, 3] as any,
        'target-arrow-color': ((ele: any) => {
          const relationship = ele.data('relationship') as RelationshipType;
          return RELATIONSHIP_COLORS[relationship] || '#90a4ae';
        }) as any,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        opacity: ((ele: any) => {
          const relationship = ele.data('relationship') as RelationshipType;
          if (relationship === 'influenced' || relationship === 'influenced_by') return 0.28;
          const confidence = ele.data('confidence') as number;
          if (confidence >= 0.9) return 0.6;
          if (confidence >= 0.7) return 0.38;
          return 0.18;
        }) as any,
        'arrow-scale': 0.85,
      },
    },

    // Highlighted edges - warm accent
    {
      selector: 'edge.highlighted',
      style: {
        width: 3.5,
        opacity: 0.95,
        'z-index': 999,
        'line-color': '#4ade80',
        'target-arrow-color': '#4ade80',
      },
    },

    // Attribute-faded edges
    {
      selector: 'edge.attribute-faded',
      style: {
        opacity: 0.06,
      },
    },

    // Faded edges (focus mode)
    {
      selector: 'edge.faded',
      style: {
        opacity: 0.06,
      },
    },

    // Timeline-hidden nodes
    {
      selector: 'node.timeline-hidden',
      style: {
        display: 'none' as any,
      },
    },

    // Timeline-hidden edges
    {
      selector: 'edge.timeline-hidden',
      style: {
        display: 'none' as any,
      },
    },

    // Self-loop edges
    {
      selector: 'edge[source = target]',
      style: {
        'curve-style': 'loop' as any,
        'loop-direction': '0deg' as any,
        'loop-sweep': '60deg' as any,
        'control-point-distance': 50 as any,
      },
    },
  ];
}
