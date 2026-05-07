import type { StylesheetStyle } from 'cytoscape';
import type { ClusterType, RelationshipType } from '../data/types';
import { getAdaptiveLogoBackground, getLogoBorderColor } from '../utils/colorContrast';

const MIN_NODE_SIZE = 50;
const MAX_NODE_SIZE = 110;
const DEFAULT_NODE_COLOR = '#42a5f5';

// Museum-inspired muted color palette - matching landing page aesthetic
export const CLUSTER_COLORS: Record<ClusterType, string> = {
  c_family: '#e07a5f',      // Warm coral (landing highlight)
  jvm_dotnet: '#7a9e7e',    // Muted sage
  js_engines: '#c9a87c',    // Warm tan (landing accent)
  functional: '#9b7bb8',    // Muted lavender
  systems: '#5a8a7d',       // Deep teal
  scripting: '#8b9a7d',     // Sage green (landing secondary)
  compilers: '#9a958c',     // Warm stone
  other: '#8a857c',         // Darker stone
  clr: '#7a8aa8',           // Muted slate blue
  dynamic: '#7da88a',       // Soft sage
  historical: '#b8a07a',    // Aged tan
  jvm: '#6b8ba8',           // Muted blue
  roots: '#9a958c',         // Warm stone
  scientific: '#6a9aa8',    // Muted teal
  tools: '#8a9598',         // Cool stone
};

// Cohesive edge colors matching museum palette
export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  compiler_written_in: '#c9a87c',   // Warm tan accent
  runtime_written_in: '#8b9a7d',    // Sage green
  bootstrap_written_in: '#7da88a',  // Soft green
  rewritten_in: '#b8a07a',          // Aged tan
  influenced: '#c9a87c',            // Warm tan accent
  influenced_by: '#c9a87c',         // Warm tan accent
  transpiled_to: '#e07a5f',         // Coral highlight
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
  const labelColor = isDarkMode ? '#e6edf3' : '#1a1b1e';
  const labelOutlineColor = isDarkMode ? '#0d1117' : '#ffffff';
  const parentBorderColor = isDarkMode ? '#30363d' : '#e2e5e9';
  const parentTextColor = isDarkMode ? '#8b949e' : '#5c6370';

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
        'font-size': 'mapData(degree, 0, 30, 10, 16)' as any,
        'font-weight': 600 as any,
        'color': labelColor,
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 8,
        'text-outline-width': 2,
        'text-outline-color': labelOutlineColor,
        'text-outline-opacity': 0.8,
        'min-zoomed-font-size': 8,
        label: 'data(label)',
        'text-wrap': 'wrap' as any,
        'text-max-width': 'mapData(degree, 0, 30, 70, 130)' as any,
      },
    },

    // Logo nodes - seamless integration with background
    {
      selector: 'node[logoUrl]',
      style: {
        'background-color': ((ele: any) => {
          const logoColor = ele.data('logoColor');
          return getAdaptiveLogoBackground(logoColor, isDarkMode);
        }) as any,

        // Display logo, carefully sized to fit within the circular node
        'background-image': 'data(logoUrl)' as any,
        'background-width': '65%' as any,
        'background-height': '65%' as any,
        'background-position-x': '50%' as any,
        'background-position-y': '50%' as any,
        'background-repeat': 'no-repeat' as any,
        'background-image-opacity': 1,
        'background-clip': 'node' as any,

        // Subtle border for definition
        'border-width': 2.5,
        'border-color': ((ele: any) => {
          const logoColor = ele.data('logoColor');
          return getLogoBorderColor(logoColor, isDarkMode);
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
        'border-color': '#c9a87c',
        'border-opacity': 1,
        'z-index': 1001,
        'overlay-opacity': 0.15,
        'overlay-color': '#c9a87c',
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
        'border-color': '#c9a87c',
        'border-opacity': 0.9,
        'z-index': 1001,
        'overlay-opacity': 0.12,
        'overlay-color': '#c9a87c',
      },
    },

    // Selected/highlighted node - warm accent glow
    {
      selector: 'node.highlighted',
      style: {
        'border-width': 3.5,
        'border-color': '#c9a87c',
        'border-opacity': 0.9,
        'z-index': 1000,
        'overlay-opacity': 0.1,
        'overlay-color': '#c9a87c',
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
          if (relationship === 'influenced' || relationship === 'influenced_by') return 2.5;
          return relationship === 'runtime_written_in' ? 1.5 : 2;
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
          if (relationship === 'influenced' || relationship === 'influenced_by') return 0.65;
          const confidence = ele.data('confidence') as number;
          if (confidence >= 0.9) return 0.7;
          if (confidence >= 0.7) return 0.5;
          return 0.3;
        }) as any,
        'arrow-scale': 1.0,
      },
    },

    // Highlighted edges - warm accent
    {
      selector: 'edge.highlighted',
      style: {
        width: 3.5,
        opacity: 0.95,
        'z-index': 999,
        'line-color': '#c9a87c',
        'target-arrow-color': '#c9a87c',
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
