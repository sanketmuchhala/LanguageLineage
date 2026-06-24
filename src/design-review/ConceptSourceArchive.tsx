// Concept C: Source Archive. Light editorial computing-history publication. Dev-only preview.
import { ReviewFrame, ExperienceLabel } from './ReviewFrame';
import ConceptGraph from './ConceptGraph';
import { STATS, RELATIONSHIPS, PYTHON, confidenceBand } from './data';
import './ConceptSourceArchive.css';

const relMeta = (t: string) => RELATIONSHIPS.find((r) => r.type === t)!;

export default function ConceptSourceArchive() {
  return (
    <ReviewFrame active="source-archive" title="Source Archive">
      <div className="sa-root">
        {/* 1. HERO */}
        <ExperienceLabel n={1}>Homepage hero and first section</ExperienceLabel>
        <div className="sa-frame">
          <header className="sa-masthead">
            <span className="sa-mark">⟗ Language Lineage</span>
            <nav>{['Graph', 'Languages', 'Toolchains', 'Relationships', 'Timeline', 'Dataset'].map((l) => <a key={l} className={l === 'Graph' ? 'on' : ''}>{l}</a>)}</nav>
            <a className="sa-mast-cta">Open the graph</a>
          </header>
          <div className="sa-hero">
            <div className="sa-hero-left">
              <span className="sa-vol">An archive of computing history · est. {STATS.yearFrom}</span>
              <h1>How programming languages, compilers, and runtimes were built.</h1>
              <p className="sa-lede">A documented record of {STATS.nodes} languages and toolchains and {STATS.relationships} implementation, bootstrap, and influence relationships — each entry carries a source and a confidence rating, like any catalogued artifact.</p>
              <div className="sa-hero-actions"><a className="sa-btn">Open the graph</a><a className="sa-link">Read the methodology →</a></div>
              <ol className="sa-index">
                <li><span>01</span> Implementation records</li>
                <li><span>02</span> Bootstrap chains</li>
                <li><span>03</span> Influence lineage</li>
                <li><span>04</span> Evidence and sources</li>
              </ol>
            </div>
            <figure className="sa-plate">
              <div className="sa-plate-inner"><ConceptGraph nodeFill="#ffffff" nodeStroke="#9aa3ad" labelColor="#1b232e" toolFill="#e8eaed" /></div>
              <figcaption><b>Plate 1.</b> Implementation subgraph: C as the runtime of Python and Ruby; OCaml bootstrap and LLVM backend of Rust.</figcaption>
            </figure>
          </div>
          <div className="sa-keybar">
            {RELATIONSHIPS.map((r) => (
              <span key={r.type} className="sa-key"><i style={{ background: r.color }} />{r.label} <b>{r.count}</b></span>
            ))}
          </div>
        </div>

        {/* 2. WORKSPACE */}
        <ExperienceLabel n={2}>Interactive graph workspace</ExperienceLabel>
        <div className="sa-frame">
          <div className="sa-workspace">
            <div className="sa-ws-toolbar"><span className="sa-mark sm">⟗</span><div className="sa-ws-search">Search the catalogue…</div><div className="sa-ws-tabs"><button className="on">Implementation</button><button>Influence</button><button>Timeline</button></div></div>
            <div className="sa-ws-body">
              <figure className="sa-plate big"><div className="sa-plate-inner"><ConceptGraph nodeFill="#ffffff" nodeStroke="#9aa3ad" labelColor="#1b232e" toolFill="#e8eaed" highlight="py" /></div></figure>
              <aside className="sa-catalogue">
                <div className="sa-cat-head">Selected entry</div>
                <h3 className="sa-cat-title">Python</h3>
                <div className="sa-callno">lang:python · 1991 · dynamic</div>
                <p className="sa-cat-answer">CPython, the reference implementation, is written in <b>C</b>.</p>
                <div className="sa-cat-sec">Cited relationships</div>
                {PYTHON.records.map((r) => (
                  <div key={r.from + r.rel} className="sa-cat-row" style={{ ['--c' as string]: relMeta(r.rel).color }}>
                    <span className="sa-cat-rel">{relMeta(r.rel).short}</span>
                    <b>{r.from}</b>
                    <span className="sa-cat-conf">{(r.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </aside>
            </div>
          </div>
        </div>

        {/* 3. LANGUAGE DETAIL */}
        <ExperienceLabel n={3}>Programming-language detail page</ExperienceLabel>
        <div className="sa-frame">
          <article className="sa-record">
            <div className="sa-record-head">
              <span className="sa-callno">Record · lang:python</span>
              <h1>Python</h1>
              <p className="sa-record-sub">A dynamically typed, multi-paradigm programming language, first released 1991. Reference implementation CPython, written in C.</p>
            </div>
            <div className="sa-record-grid">
              <div className="sa-record-main">
                <div className="sa-cited">
                  <span className="sa-cited-q">What is Python written in?</span>
                  <p>{PYTHON.answer} The interpreter, garbage collector, and the C-API used by extension modules are implemented in C.</p>
                </div>
                <h2 className="sa-h2">Implementation records</h2>
                <table className="sa-table">
                  <thead><tr><th>Relationship</th><th>Written in</th><th>Detail</th><th>Conf.</th><th>Source</th></tr></thead>
                  <tbody>
                    {PYTHON.records.map((r) => (
                      <tr key={r.from + r.rel}>
                        <td><span className="sa-cat-rel" style={{ ['--c' as string]: relMeta(r.rel).color }}>{relMeta(r.rel).short}</span></td>
                        <td className="sa-mono">{r.from}</td>
                        <td>{r.detail}</td>
                        <td className="sa-mono">{(r.confidence * 100).toFixed(0)}% <small>{confidenceBand(r.confidence).label}</small></td>
                        <td><a className="sa-mono sa-src">{r.source}</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h2 className="sa-h2">Languages Python influenced</h2>
                <div className="sa-chiprow">{PYTHON.influenced.map((n) => <a key={n} className="sa-chip">{n}</a>)}</div>
              </div>
              <aside className="sa-margin">
                <div className="sa-margin-block"><span>First release</span><b>1991</b></div>
                <div className="sa-margin-block"><span>Typing</span><b>Dynamic</b></div>
                <div className="sa-margin-block"><span>Runtime</span><b>Interpreted</b></div>
                <div className="sa-margin-block"><span>Self-hosting</span><b>No</b></div>
                <div className="sa-margin-block"><span>Primary implementation</span><b>C</b></div>
                <div className="sa-margin-note">Note. CPython is one of several implementations; PyPy (RPython) and Jython (Java) are catalogued separately.</div>
              </aside>
            </div>
          </article>
        </div>

        {/* 4. MOBILE */}
        <ExperienceLabel n={4}>Mobile navigation and detail</ExperienceLabel>
        <div className="sa-frame sa-mobile-row">
          <div className="sa-phone">
            <div className="sa-m-nav"><span className="sa-mark sm">⟗ Lineage</span><span>×</span></div>
            <div className="sa-m-menu">{['Graph', 'Languages', 'Toolchains', 'Relationships', 'Timeline', 'Guides', 'Dataset'].map((l) => <a key={l} className={l === 'Graph' ? 'on' : ''}>{l}</a>)}</div>
            <a className="sa-btn block">Open the graph</a>
          </div>
          <div className="sa-phone">
            <span className="sa-callno">Record · lang:python</span>
            <h3 className="sa-m-title">Python</h3>
            <div className="sa-cited sm"><span className="sa-cited-q">Written in</span><p>CPython is written in C.</p></div>
            {PYTHON.records.slice(0, 3).map((r) => (
              <div key={r.from + r.rel} className="sa-cat-row" style={{ ['--c' as string]: relMeta(r.rel).color }}><span className="sa-cat-rel">{relMeta(r.rel).short}</span><b>{r.from}</b><span className="sa-cat-conf">{(r.confidence * 100).toFixed(0)}%</span></div>
            ))}
          </div>
        </div>
      </div>
    </ReviewFrame>
  );
}
