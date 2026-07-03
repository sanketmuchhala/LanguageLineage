import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

interface AgentData {
  id: string;
  name: string;
  type: string;
  description: string;
  systemPrompt?: string;
  schema?: string;
  techStack: string;
}

const AGENTS: Record<string, AgentData> = {
  discovery: {
    id: 'discovery',
    name: 'Discovery Agent',
    type: 'Autonomous Scraper',
    description: 'Scans Wikidata and Wikipedia to identify new programming languages, compilers, and runtimes automatically.',
    techStack: 'TypeScript, Wikidata SPARQL, Wikipedia API',
  },
  scraper: {
    id: 'scraper',
    name: 'Deep-Scraper Agent',
    type: 'Data Harvester',
    description: 'Crawls Wikipedia infoboxes, GitHub source trees, and historical release notes to gather raw unstructured data about a specific language entity.',
    techStack: 'TypeScript, Cheerio, GitHub API',
  },
  llm_schema: {
    id: 'llm_schema',
    name: 'Extraction LLM',
    type: 'AI Model',
    description: 'Parses raw, messy text data into a strict, strongly-typed JSON schema. It is responsible for identifying paradigms, typed relationships, and dates.',
    systemPrompt: `You are an expert programming language historian and compiler engineer. Extract structured data from the provided Wikipedia markdown. 
Output ONLY strict JSON conforming to the LanguageLineage schema.
Pay special attention to 'compiler_written_in' vs 'bootstrap_written_in'.`,
    schema: `{
  "id": "lang:rust",
  "name": "Rust",
  "type": "language",
  "first_release_year": 2015,
  "relationships": [...]
}`,
    techStack: 'Google Gemini Pro 1.5, Structured Outputs',
  },
  llm_eval: {
    id: 'llm_eval',
    name: 'Conflict Resolution',
    type: 'AI Model',
    description: 'Cross-references multiple sources (e.g. Wikipedia vs mailing list archives) to resolve conflicting dates and lineage claims.',
    techStack: 'Google Gemini Pro 1.5, Chain of Thought',
  },
  human: {
    id: 'human',
    name: 'Human Curator',
    type: 'Manual Review',
    description: 'Reviews AI-generated diffs, resolves cyclic dependency loops (like self-hosting compilers), and approves data before it enters the canonical database.',
    techStack: 'Git, JSON, Code Review',
  },
  graph_db: {
    id: 'graph_db',
    name: 'Graph Database',
    type: 'Storage',
    description: 'The final canonical lineage_v5.json file containing all typed nodes and edges. Fully strictly typed.',
    schema: `export interface Dataset {
  entities: Entity[];
  relationships: Relationship[];
}`,
    techStack: 'JSON, Zod Validation',
  },
  static_gen: {
    id: 'static_gen',
    name: 'Static Generator',
    type: 'Build System',
    description: 'Computes PageRank metrics, topological layers, and generates 300+ statically rendered HTML pages and interactive React graphs for maximum performance and SEO.',
    techStack: 'Vite, React, TSX, Cytoscape',
  },
};

const ELEMENTS = [
  // Nodes
  { data: { id: 'discovery', label: 'Discovery Agent' } },
  { data: { id: 'scraper', label: 'Deep Scraper' } },
  { data: { id: 'llm_schema', label: 'Extraction LLM' } },
  { data: { id: 'llm_eval', label: 'Conflict Resolver' } },
  { data: { id: 'human', label: 'Human Curator' } },
  { data: { id: 'graph_db', label: 'Graph Database' } },
  { data: { id: 'static_gen', label: 'Static Site Generator' } },
  
  // Edges
  { data: { id: 'e1', source: 'discovery', target: 'scraper' } },
  { data: { id: 'e2', source: 'scraper', target: 'llm_schema' } },
  { data: { id: 'e3', source: 'llm_schema', target: 'llm_eval' } },
  { data: { id: 'e4', source: 'llm_eval', target: 'human' } },
  { data: { id: 'e5', source: 'human', target: 'graph_db' } },
  { data: { id: 'e6', source: 'graph_db', target: 'static_gen' } },
];

export default function HowItWorksGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: ELEMENTS,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1f2937',
            'border-width': 2,
            'border-color': '#4ade80',
            'shape': 'round-rectangle',
            'width': 180,
            'height': 60,
            'label': 'data(label)',
            'color': '#ffffff',
            'font-family': 'Fraunces, serif',
            'font-size': '16px',
            'text-valign': 'center',
            'text-halign': 'center',
            'transition-property': 'background-color, border-color, shadow-blur, shadow-color',
            'transition-duration': 300,
          }
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#064e3b',
            'border-color': '#4ade80',
            'border-width': 4,
            'shadow-blur': 20,
            'shadow-color': '#4ade80',
            'shadow-opacity': 0.8
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#374151',
            'target-arrow-color': '#374151',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'line-style': 'dashed',
            'line-dash-pattern': [8, 8]
          }
        },
        {
          selector: 'edge.flow',
          style: {
            'line-color': '#4ade80',
            'target-arrow-color': '#4ade80',
            'transition-property': 'line-color, target-arrow-color',
            'transition-duration': 500
          }
        }
      ] as any,
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 50,
        spacingFactor: 1.5,
        avoidOverlap: true,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cy.on('tap', 'node', (e) => {
      const id = e.target.id();
      setSelectedAgent(AGENTS[id]);
    });

    cy.on('tap', (e) => {
      if (e.target === cy) {
        setSelectedAgent(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000000', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <a href="/" style={{ color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo-mark.svg" width={24} height={24} alt="Home" />
          <h1 style={{ margin: 0, fontFamily: 'Fraunces, serif', fontSize: '24px', color: '#fff' }}>Architecture</h1>
        </a>
      </div>

      {/* Graph Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Details Sidebar */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '400px',
        height: '100%',
        backgroundColor: '#0b0b0b',
        borderLeft: '1px solid #1f2937',
        transform: selectedAgent ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        {selectedAgent && (
          <>
            <button 
              onClick={() => setSelectedAgent(null)}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', marginBottom: 20, padding: 0 }}
            >
              &larr; Back to Graph
            </button>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', color: '#fff', margin: '0 0 8px 0' }}>{selectedAgent.name}</h2>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#4ade80', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {selectedAgent.type}
            </div>
            
            <p style={{ color: '#d1d5db', lineHeight: 1.6, fontSize: '15px', marginBottom: 32 }}>
              {selectedAgent.description}
            </p>

            {selectedAgent.systemPrompt && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Prompt</h3>
                <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#60a5fa', whiteSpace: 'pre-wrap' }}>
                  {selectedAgent.systemPrompt}
                </div>
              </div>
            )}

            {selectedAgent.schema && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output Schema</h3>
                <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#f472b6', whiteSpace: 'pre-wrap' }}>
                  {selectedAgent.schema}
                </div>
              </div>
            )}

            <div>
              <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tech Stack</h3>
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>{selectedAgent.techStack}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
