// Design-review comparison index. Dev-only, noindex, removed in Phase 11.
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { STATS } from './data';
import './ReviewFrame.css';

const CONCEPTS = [
  {
    slug: 'compiler-atlas',
    tag: 'Concept A',
    name: 'Compiler Atlas',
    blurb: 'A dark graphite technical map. Structured grid overlays, directed relationships, compact monospaced metadata, and restrained cyan / amber / green data accents. Implementation paths and evidence are forward.',
    swatches: ['#0d1117', '#22d3ee', '#e3a008', '#34d399', '#a78bfa'],
  },
  {
    slug: 'runtime-observatory',
    tag: 'Concept B',
    name: 'Runtime Observatory',
    blurb: 'A systems-monitoring surface where the graph canvas dominates. Floating trace panels, confidence rendered as signal bars, status tags, and a chronology track. More spatial depth and a live feel.',
    swatches: ['#06080d', '#3b82f6', '#2dd4bf', '#fbbf24', '#60a5fa'],
  },
  {
    slug: 'source-archive',
    tag: 'Concept C',
    name: 'Source Archive',
    blurb: 'A light editorial computing-history publication. Serif headlines, monospaced call numbers and margin notes, catalogue tables, and documented-artifact records. Readable for long study sessions.',
    swatches: ['#f3f4f6', '#16202c', '#0f766e', '#e3a008', '#60a5fa'],
  },
];

export default function DesignReview() {
  return (
    <div className="dr-index">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Design Review — Language Lineage (internal)</title>
      </Helmet>
      <div className="dr-index-hero">
        <span className="dr-index-eyebrow">Internal · not indexed · {STATS.nodes} nodes / {STATS.relationships} relationships</span>
        <h1>Redesign directions: Compiler Systems Atlas</h1>
        <p>
          Three coded directions for moving Language Lineage from a genealogy framing to an evidence-backed atlas of how
          programming languages, compilers, runtimes, and toolchains are built. Each concept shows four real experiences using
          live dataset facts: the homepage hero, the graph workspace, a programming-language detail page, and mobile. Open each,
          compare, then pick one.
        </p>
      </div>
      <div className="dr-cards">
        {CONCEPTS.map((c) => (
          <Link key={c.slug} to={`/design-review/${c.slug}`} className="dr-card">
            <div className="dr-card-swatches">
              {c.swatches.map((s) => (
                <span key={s} style={{ background: s, flex: 1 }} />
              ))}
            </div>
            <div className="dr-card-body">
              <span className="dr-card-tag">{c.tag}</span>
              <h2>{c.name}</h2>
              <p>{c.blurb}</p>
              <div className="dr-card-link">Open concept →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
