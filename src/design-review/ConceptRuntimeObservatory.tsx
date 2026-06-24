// Concept B: Runtime Observatory. Canvas-dominant systems-monitoring feel. Dev-only preview.
import { ReviewFrame, ExperienceLabel } from './ReviewFrame';
import ConceptGraph from './ConceptGraph';
import { STATS, RELATIONSHIPS, PYTHON, confidenceBand } from './data';
import './ConceptRuntimeObservatory.css';

function SignalBar({ value, color }: { value: number; color: string }) {
  return (
    <span className="ro-signal" aria-label={`confidence ${(value * 100).toFixed(0)}%`}>
      {[0.2, 0.4, 0.6, 0.8, 1].map((t) => (
        <i key={t} style={{ background: value >= t ? color : 'rgba(255,255,255,0.12)' }} />
      ))}
    </span>
  );
}

export default function ConceptRuntimeObservatory() {
  return (
    <ReviewFrame active="runtime-observatory" title="Runtime Observatory">
      <div className="ro-root">
        {/* 1. HERO */}
        <ExperienceLabel n={1}>Homepage hero and first section</ExperienceLabel>
        <div className="ro-frame">
          <div className="ro-hero">
            <ConceptGraph nodeFill="#0e1830" nodeStroke="rgba(96,165,250,0.55)" labelColor="#cfe0ff" toolFill="#16233f" />
            <header className="ro-nav">
              <span className="ro-brand"><span className="ro-dot" /> Language Lineage</span>
              <nav><a className="on">Graph</a><a>Languages</a><a>Toolchains</a><a>Relationships</a><a>Timeline</a><a>Dataset</a></nav>
              <a className="ro-nav-cta">Open observatory</a>
            </header>
            <div className="ro-hero-overlay">
              <span className="ro-status"><span className="ro-pulse" /> {STATS.relationships} relationships tracked · {STATS.nodes} nodes online</span>
              <h1>Observe how programming languages are built.</h1>
              <p>A live systems view of compilers, runtimes, virtual machines, and bootstrap chains — every edge carries a confidence signal and a source.</p>
              <div className="ro-hero-chips">
                <a className="ro-btn">Enter the observatory</a>
                <span className="ro-chip">{STATS.languages} languages</span>
                <span className="ro-chip">{STATS.tools} toolchains</span>
                <span className="ro-chip">{STATS.yearFrom}–{STATS.yearTo}</span>
              </div>
            </div>
          </div>
          <div className="ro-legendbar">
            {RELATIONSHIPS.map((r) => (
              <span key={r.type} className="ro-legend"><i style={{ background: r.color }} />{r.label}<b>{r.count}</b></span>
            ))}
          </div>
        </div>

        {/* 2. WORKSPACE */}
        <ExperienceLabel n={2}>Interactive graph workspace</ExperienceLabel>
        <div className="ro-frame">
          <div className="ro-workspace">
            <ConceptGraph nodeFill="#0e1830" nodeStroke="rgba(96,165,250,0.5)" labelColor="#cfe0ff" toolFill="#16233f" highlight="py" />
            <div className="ro-floatbar">
              <span className="ro-brand sm"><span className="ro-dot" /></span>
              <div className="ro-floatsearch">Search the graph…</div>
              <div className="ro-segmented"><button className="on">Implementation</button><button>Influence</button></div>
            </div>
            <aside className="ro-trace">
              <div className="ro-trace-head"><span className="ro-trace-kicker">Trace · selected</span><span className="ro-trace-id">lang:python</span></div>
              <h3>Python</h3>
              <div className="ro-trace-status"><span className="ro-tag ok">interpreted</span><span className="ro-tag">dynamic</span><span className="ro-tag warn">not self-hosting</span></div>
              <div className="ro-trace-answer">Runtime written in <b>C</b> · CPython</div>
              <div className="ro-trace-sec">Incoming edges</div>
              {PYTHON.records.map((r) => {
                const band = confidenceBand(r.confidence);
                return (
                  <div key={r.from + r.rel} className="ro-trace-row">
                    <span className="ro-edge" style={{ ['--c' as string]: RELATIONSHIPS.find((x) => x.type === r.rel)!.color }}>{RELATIONSHIPS.find((x) => x.type === r.rel)!.short}</span>
                    <b>{r.from}</b>
                    <SignalBar value={r.confidence} color={band.color} />
                  </div>
                );
              })}
              <div className="ro-trace-sec">Chronology</div>
              <div className="ro-timetrack"><span style={{ left: '8%' }} data-y="1972">C</span><span style={{ left: '46%' }} data-y="1991">Python</span><span style={{ left: '92%' }} data-y="now" /></div>
            </aside>
            <div className="ro-zoom"><button>＋</button><button>－</button><button>⤢</button></div>
          </div>
        </div>

        {/* 3. LANGUAGE DETAIL */}
        <ExperienceLabel n={3}>Programming-language detail page</ExperienceLabel>
        <div className="ro-frame">
          <article className="ro-detail">
            <div className="ro-detail-head">
              <div>
                <span className="ro-detail-kicker"><span className="ro-pulse" /> language record · lang:python</span>
                <h1>Python</h1>
              </div>
              <div className="ro-detail-signal"><span>evidence coverage</span><SignalBar value={0.95} color="#34d399" /></div>
            </div>
            <div className="ro-readout">
              <div><span>release</span><b>1991</b></div>
              <div><span>typing</span><b>dynamic</b></div>
              <div><span>runtime</span><b>interpreted</b></div>
              <div><span>self-hosting</span><b className="warn">no</b></div>
              <div><span>primary impl</span><b>C</b></div>
            </div>
            <div className="ro-answer">Python's reference implementation, CPython, is written in <b>C</b>. {PYTHON.answer}</div>
            <h2 className="ro-h2">Implementation traces</h2>
            <div className="ro-traces">
              {PYTHON.records.map((r) => {
                const meta = RELATIONSHIPS.find((x) => x.type === r.rel)!;
                const band = confidenceBand(r.confidence);
                return (
                  <div key={r.from + r.rel} className="ro-tracecard" style={{ ['--c' as string]: meta.color }}>
                    <span className="ro-edge" style={{ ['--c' as string]: meta.color }}>{meta.short}</span>
                    <div className="ro-tracecard-main"><b>{r.from}</b><span>{r.detail}</span></div>
                    <div className="ro-tracecard-conf"><SignalBar value={r.confidence} color={band.color} /><small>{(r.confidence * 100).toFixed(0)}% {band.label}</small></div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        {/* 4. MOBILE */}
        <ExperienceLabel n={4}>Mobile navigation and detail</ExperienceLabel>
        <div className="ro-frame ro-mobile-row">
          <div className="ro-phone">
            <div className="ro-m-nav"><span className="ro-brand sm"><span className="ro-dot" /> Lineage</span><span>×</span></div>
            <div className="ro-m-menu">{['Graph', 'Languages', 'Toolchains', 'Relationships', 'Timeline', 'Dataset'].map((l) => <a key={l} className={l === 'Graph' ? 'on' : ''}>{l}</a>)}</div>
            <a className="ro-btn block">Open observatory</a>
          </div>
          <div className="ro-phone dark">
            <div className="ro-mgraph"><ConceptGraph nodeFill="#0e1830" nodeStroke="rgba(96,165,250,0.5)" labelColor="#cfe0ff" toolFill="#16233f" highlight="py" compact /></div>
            <div className="ro-sheet">
              <div className="ro-sheet-grip" />
              <div className="ro-detail-kicker">lang:python</div>
              <h3>Python</h3>
              <div className="ro-answer sm">Runtime written in <b>C</b></div>
              {PYTHON.records.slice(0, 2).map((r) => (
                <div key={r.from} className="ro-trace-row"><span className="ro-edge" style={{ ['--c' as string]: RELATIONSHIPS.find((x) => x.type === r.rel)!.color }}>{RELATIONSHIPS.find((x) => x.type === r.rel)!.short}</span><b>{r.from}</b><SignalBar value={r.confidence} color={confidenceBand(r.confidence).color} /></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ReviewFrame>
  );
}
