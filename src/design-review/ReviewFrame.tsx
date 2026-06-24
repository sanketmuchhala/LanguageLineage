// Shared chrome for concept previews: noindex, concept switcher, section labels. Dev-only.
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import './ReviewFrame.css';

const CONCEPTS = [
  { slug: 'compiler-atlas', name: 'A · Compiler Atlas' },
  { slug: 'runtime-observatory', name: 'B · Runtime Observatory' },
  { slug: 'source-archive', name: 'C · Source Archive' },
];

export function ReviewFrame({ active, title, children }: { active: string; title: string; children: ReactNode }) {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>{title} — Design Review (internal)</title>
      </Helmet>
      <div className="dr-bar">
        <Link to="/design-review" className="dr-bar-home">Design Review</Link>
        <nav className="dr-bar-nav">
          {CONCEPTS.map((c) => (
            <Link key={c.slug} to={`/design-review/${c.slug}`} className={c.slug === active ? 'dr-active' : ''}>
              {c.name}
            </Link>
          ))}
        </nav>
        <a href="/" className="dr-bar-exit">Exit to site</a>
      </div>
      {children}
    </>
  );
}

export function ExperienceLabel({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="dr-exp-label">
      <span className="dr-exp-num">{n}</span>
      {children}
    </div>
  );
}
