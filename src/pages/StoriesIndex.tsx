import { Link } from 'react-router-dom';
import { Seo } from '../seo/Seo';
import '../styles/tokens.css';

export function StoriesIndex() {
  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      <Seo
        title="Historical Stories | Language Lineage"
        description="Guided explorations of programming language history, self-hosting paths, and the AI ecosystem."
        canonical="https://www.languagelineage.org/stories"
      />

      <header style={{ marginBottom: '3rem' }}>
        <Link to="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
          ← Back to Atlas
        </Link>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Historical Stories</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Guided explorations through the Programming Language Atlas. Discover how languages evolved, how compilers bootstrapped themselves, and the roots of the modern AI stack.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <StoryCard
          title="The Bootstrap of Rust"
          description="Trace how Rust evolved from OCaml into a self-hosting compiler, eventually replacing its C++ components."
          slug="rust-bootstrap"
          tags={['Bootstrap', 'Systems']}
        />
        <StoryCard
          title="From BCPL to C"
          description="The deep roots of modern computing. Follow the lineage from BCPL to B, and finally to Dennis Ritchie's C."
          slug="bcpl-to-c"
          tags={['Lineage', 'Foundations']}
        />
        <StoryCard
          title="Languages Behind AI"
          description="Explore the implementation stack of the AI revolution, from Python down to C++, CUDA, and MLIR."
          slug="ai-ecosystem"
          tags={['AI / ML', 'Infrastructure']}
        />
      </div>
    </div>
  );
}

function StoryCard({ title, description, slug, tags }: { title: string, description: string, slug: string, tags: string[] }) {
  return (
    <Link to={`/stories/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', background: 'var(--bg-secondary)', transition: 'transform 0.15s, border-color 0.15s', cursor: 'pointer' }}
           onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
           onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {tags.map(t => <span key={t} style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '0.15rem 0.4rem', background: 'var(--bg-elevated)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{t}</span>)}
        </div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{description}</p>
      </div>
    </Link>
  );
}
