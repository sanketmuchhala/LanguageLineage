// Concept A: Compiler Atlas. Dark graphite technical map. Dev-only preview.
import { ReviewFrame, ExperienceLabel } from './ReviewFrame';
import ConceptGraph from './ConceptGraph';
import { STATS, RELATIONSHIPS, HERO_EXAMPLES, PYTHON, confidenceBand } from './data';
import './ConceptCompilerAtlas.css';

const Mark = () => (
  <svg className="ca-mark" viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="6" cy="14" r="3.4" fill="#22d3ee" />
    <circle cx="22" cy="6" r="3" fill="#e3a008" />
    <circle cx="22" cy="22" r="3" fill="#34d399" />
    <path d="M8.7 12.6 L19.4 7" stroke="#22d3ee" strokeWidth="1.6" />
    <path d="M8.7 15.4 L19.4 21" stroke="#22d3ee" strokeWidth="1.6" />
  </svg>
);

function RelBadge({ type }: { type: (typeof RELATIONSHIPS)[number]['type'] }) {
  const m = RELATIONSHIPS.find((r) => r.type === type)!;
  return (
    <span className="ca-relbadge" style={{ ['--c' as string]: m.color }}>
      <span className="ca-relbadge-dot" />
      {m.short}
    </span>
  );
}

export default function ConceptCompilerAtlas() {
  return (
    <ReviewFrame active="compiler-atlas" title="Compiler Atlas">
      <div className="ca-root">
        {/* 1. HOMEPAGE HERO */}
        <ExperienceLabel n={1}>Homepage hero and first section</ExperienceLabel>
        <div className="ca-frame">
          <header className="ca-nav">
            <a className="ca-brand"><Mark /> Language Lineage</a>
            <nav className="ca-nav-links">
              <a className="ca-nav-strong">Graph</a><a>Languages</a><a>Toolchains</a><a>Relationships</a><a>Timeline</a><a>Dataset</a>
            </nav>
            <a className="ca-nav-cta">Open the graph</a>
          </header>

          <section className="ca-hero">
            <div className="ca-hero-copy">
              <span className="ca-eyebrow">Evidence-backed · {STATS.languages} languages · {STATS.tools} toolchains</span>
              <h1>The implementation atlas of programming languages.</h1>
              <p>Trace what every language is <em>written in</em>: its compiler, runtime, virtual machine, and bootstrap chain. {STATS.relationships} sourced relationships across {STATS.nodes} languages and toolchains, each with a confidence score and citation.</p>
              <div className="ca-hero-cta">
                <a className="ca-btn-primary">Open the graph</a>
                <a className="ca-btn-ghost">Read the methodology</a>
              </div>
              <div className="ca-stats">
                <div><b>{STATS.nodes}</b><span>nodes</span></div>
                <div><b>{STATS.relationships}</b><span>relationships</span></div>
                <div><b>{STATS.relationshipTypes}</b><span>relation types</span></div>
                <div><b>{STATS.yearFrom}–{STATS.yearTo}</b><span>coverage</span></div>
              </div>
            </div>
            <div className="ca-hero-graph">
              <div className="ca-hero-graph-inner">
                <ConceptGraph nodeFill="#26262b" nodeStroke="rgba(255,255,255,0.4)" labelColor="#e4e4e7" toolFill="#2d2d33" showGrid gridColor="rgba(255,255,255,0.06)" />
              </div>
              <div className="ca-legend">
                {RELATIONSHIPS.map((r) => (
                  <span key={r.type} className="ca-legend-item"><i style={{ background: r.color }} />{r.short}<small>{r.count}</small></span>
                ))}
              </div>
            </div>
          </section>

          <section className="ca-questions">
            {HERO_EXAMPLES.map((q) => (
              <div key={q.q} className="ca-qcard">
                <RelBadge type={q.rel} />
                <h3>{q.q}</h3>
                <p>{q.a}</p>
                <span className="ca-conf">confidence {(q.conf * 100).toFixed(0)}%</span>
              </div>
            ))}
          </section>
        </div>

        {/* 2. GRAPH WORKSPACE */}
        <ExperienceLabel n={2}>Interactive graph workspace</ExperienceLabel>
        <div className="ca-frame">
          <div className="ca-workspace">
            <div className="ca-appbar">
              <span className="ca-brand-sm"><Mark /></span>
              <div className="ca-search"><span>⌘K</span> Search languages, tools, relationships…</div>
              <div className="ca-appbar-modes"><button className="on">Implementation</button><button>Influence</button><button>Timeline</button></div>
            </div>
            <div className="ca-workspace-body">
              <aside className="ca-rail">
                <div className="ca-rail-head">Relationship types</div>
                {RELATIONSHIPS.map((r) => (
                  <label key={r.type} className="ca-filter"><input type="checkbox" defaultChecked readOnly /><i style={{ background: r.color }} />{r.label}<small>{r.count}</small></label>
                ))}
                <div className="ca-rail-head">Confidence floor</div>
                <input className="ca-range" type="range" min={0} max={100} defaultValue={70} readOnly />
                <div className="ca-rail-sub">show edges at or above 0.70</div>
              </aside>
              <div className="ca-canvas">
                <ConceptGraph nodeFill="#26262b" nodeStroke="rgba(255,255,255,0.4)" labelColor="#e4e4e7" toolFill="#2d2d33" highlight="py" showGrid gridColor="rgba(255,255,255,0.05)" />
                <div className="ca-canvas-controls"><button>＋</button><button>－</button><button>⤢</button></div>
              </div>
              <aside className="ca-inspector">
                <div className="ca-insp-kicker">Language</div>
                <h3 className="ca-insp-title">Python <span>lang:python</span></h3>
                <div className="ca-insp-meta"><span>1991</span><span>dynamic</span><span>interpreted</span><span>not self-hosting</span></div>
                <div className="ca-insp-answer"><b>Written in:</b> {PYTHON.primaryImpl} — CPython reference implementation</div>
                <div className="ca-insp-section">Incoming · what implements Python</div>
                {PYTHON.records.filter((r) => r.rel !== 'influenced').map((r) => (
                  <div key={r.from} className="ca-insp-row"><RelBadge type={r.rel} /><span className="ca-insp-from">{r.from}</span><span className="ca-conf-dot" style={{ background: confidenceBand(r.confidence).color }} />{(r.confidence * 100).toFixed(0)}%</div>
                ))}
                <div className="ca-insp-section">Influenced by</div>
                {PYTHON.records.filter((r) => r.rel === 'influenced').map((r) => (
                  <div key={r.from} className="ca-insp-row"><RelBadge type={r.rel} /><span className="ca-insp-from">{r.from}</span><span className="ca-insp-detail">{r.detail}</span></div>
                ))}
                <a className="ca-insp-link">Open full record →</a>
              </aside>
            </div>
          </div>
        </div>

        {/* 3. LANGUAGE DETAIL */}
        <ExperienceLabel n={3}>Programming-language detail page</ExperienceLabel>
        <div className="ca-frame">
          <article className="ca-detail">
            <div className="ca-detail-head">
              <div className="ca-detail-logo">Py</div>
              <div>
                <div className="ca-detail-kicker">Programming language · lang:python</div>
                <h1>Python</h1>
                <p>A dynamically typed, multi-paradigm language. Its reference implementation, CPython, is written in C.</p>
              </div>
            </div>
            <div className="ca-detail-strip">
              <div><span>First release</span><b>1991</b></div>
              <div><span>Typing</span><b>Dynamic</b></div>
              <div><span>Runtime</span><b>Interpreted</b></div>
              <div><span>Self-hosting</span><b>No</b></div>
              <div><span>Primary impl.</span><b>C</b></div>
              <div><span>Paradigms</span><b>imperative, OO, functional</b></div>
            </div>

            <div className="ca-answer-box">
              <span className="ca-answer-q">What is Python written in?</span>
              <p>{PYTHON.answer} The interpreter, garbage collector, and standard C-API are all implemented in C, which is also how native extension modules bind to the runtime.</p>
            </div>

            <h2 className="ca-h2">Implementation records</h2>
            <table className="ca-table">
              <thead><tr><th>Relationship</th><th>Written in</th><th>Detail</th><th>Confidence</th><th>Source</th></tr></thead>
              <tbody>
                {PYTHON.records.map((r) => (
                  <tr key={r.from + r.rel}>
                    <td><RelBadge type={r.rel} /></td>
                    <td className="ca-mono">{r.from}</td>
                    <td>{r.detail}</td>
                    <td><span className="ca-conf-dot" style={{ background: confidenceBand(r.confidence).color }} /> {(r.confidence * 100).toFixed(0)}% <small>{confidenceBand(r.confidence).label}</small></td>
                    <td><a className="ca-mono ca-src">{r.source}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className="ca-h2">Languages Python influenced</h2>
            <div className="ca-chiprow">{PYTHON.influenced.map((n) => <a key={n} className="ca-chip">{n}</a>)}</div>
          </article>
        </div>

        {/* 4. MOBILE */}
        <ExperienceLabel n={4}>Mobile navigation and detail</ExperienceLabel>
        <div className="ca-frame ca-mobile-row">
          <div className="ca-phone">
            <div className="ca-m-nav">
              <span className="ca-brand-sm"><Mark /> Language Lineage</span>
              <span className="ca-m-close">×</span>
            </div>
            <div className="ca-m-menu">
              {['Graph', 'Languages', 'Toolchains', 'Relationships', 'Timeline', 'Guides', 'Dataset'].map((l) => <a key={l} className={l === 'Graph' ? 'on' : ''}>{l}</a>)}
            </div>
            <a className="ca-m-cta">Open the graph</a>
          </div>
          <div className="ca-phone">
            <div className="ca-m-detailhead"><div className="ca-detail-logo sm">Py</div><div><div className="ca-detail-kicker">lang:python</div><h3>Python</h3></div></div>
            <div className="ca-m-strip"><span>1991</span><span>dynamic</span><span>C</span></div>
            <div className="ca-answer-box sm"><span className="ca-answer-q">Written in</span><p>CPython is written in C.</p></div>
            {PYTHON.records.slice(0, 2).map((r) => (
              <div key={r.from} className="ca-m-row"><RelBadge type={r.rel} /><b>{r.from}</b><span className="ca-conf-dot" style={{ background: confidenceBand(r.confidence).color }} /></div>
            ))}
          </div>
        </div>
      </div>
    </ReviewFrame>
  );
}
