import { useEffect, useRef } from 'react';
import { LandingGraphGlimpse } from './LandingGraphGlimpse';
import { HeroFx } from './HeroFx';
import { initDataFlow } from '../fx/dataFlow';
import { initCountUps, initHeroParallax } from '../fx/interactions';
import './LandingPage.css';

interface LandingPageProps {
  onEnterGraph: () => void;
}

export function LandingPage({ onEnterGraph }: LandingPageProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  // Quiet, purposeful motion only: a slow data pulse along the specimen graph,
  // stat count-up, and a subtle hero parallax.
  useEffect(() => {
    const teardown: Array<() => void> = [];
    const svg = document.querySelector('.hero-graph-svg') as SVGSVGElement | null;
    if (svg) teardown.push(initDataFlow(svg));
    teardown.push(initCountUps());
    const scroller = document.querySelector('.landing') as HTMLElement | null;
    if (scroller) teardown.push(initHeroParallax(scroller));
    return () => teardown.forEach((fn) => fn());
  }, []);

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <a href="/" className="nav-logo" aria-label="Language Lineage home">
          <img className="brand-mark" src="/logo-mark.svg" width="26" height="26" alt="" aria-hidden="true" />
          <span className="logo-text">Language Lineage</span>
        </a>
        <div className="nav-links">
          <a href="/relationships">Relationships</a>
          <a href="/languages">Languages</a>
          <a href="/tools">Tools</a>
          <a href="/guides">Guides</a>
          <a href="/timeline">Timeline</a>
          <a href="/dataset">Dataset</a>
        </div>
        <button className="nav-cta" onClick={onEnterGraph}>
          Enter Graph
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <HeroFx />
          <div className="hero-grid" />
        </div>
        <div className="hero-inner">
          <div className="hero-content">
          <p className="hero-eyebrow reveal">Evidence-backed implementation atlas</p>
          <h1 className="hero-title reveal">
            <span className="title-line">Programming Language</span>
            <span className="title-line accent">Lineage Graph</span>
          </h1>
          <p className="hero-subtitle reveal">
            Trace what programming languages are <em>written in</em>: their compilers,
            runtimes, virtual machines, and bootstrap chains. An interactive programming
            language family tree of 152 languages and toolchains and 443 sourced
            relationships, each with a confidence score and citation.
          </p>
          <div className="hero-actions reveal">
            <button className="btn-primary" onClick={onEnterGraph}>
              <span>Open the graph</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <a href="/dataset" className="btn-secondary">
              Methodology &amp; dataset
            </a>
          </div>
        </div>
        <div className="hero-visual reveal">
            <div className="hero-panel">
              <div className="hero-graph">
                <svg viewBox="0 0 440 312" className="hero-graph-svg" role="img" aria-label="Directed subgraph centered on C. ALGOL and B influenced C; C is the implementation language of the Python and Ruby runtimes and the original Go compiler.">
                  <defs>
                    <marker id="hg-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#4ade80" /></marker>
                    <marker id="hg-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e3a008" /></marker>
                    <marker id="hg-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#60a5fa" /></marker>
                    <radialGradient id="hg-focal-fill" cx="50%" cy="40%" r="62%"><stop offset="0%" stopColor="#13402a" /><stop offset="100%" stopColor="#0a1d13" /></radialGradient>
                    <radialGradient id="hg-orb" cx="38%" cy="30%" r="82%"><stop offset="0%" stopColor="#2e2e2e" /><stop offset="55%" stopColor="#161616" /><stop offset="100%" stopColor="#0b0b0b" /></radialGradient>
                    <radialGradient id="hg-focal-halo" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(74,222,128,0.30)" /><stop offset="55%" stopColor="rgba(74,222,128,0.08)" /><stop offset="100%" stopColor="rgba(74,222,128,0)" /></radialGradient>
                  </defs>
                  <g className="hg-edges">
                    <line className="hg-edge hg-influence" pathLength={1} x1="133" y1="68" x2="192" y2="123" markerEnd="url(#hg-arrow-blue)" />
                    <line className="hg-edge hg-influence" pathLength={1} x1="307" y1="68" x2="248" y2="123" markerEnd="url(#hg-arrow-blue)" />
                    <line className="hg-edge hg-runtime" pathLength={1} x1="194" y1="172" x2="131" y2="226" markerEnd="url(#hg-arrow-green)" />
                    <line className="hg-edge hg-runtime" pathLength={1} x1="220" y1="184" x2="220" y2="223" markerEnd="url(#hg-arrow-green)" />
                    <line className="hg-edge hg-compiler" pathLength={1} x1="246" y1="172" x2="309" y2="226" markerEnd="url(#hg-arrow-amber)" />
                  </g>
                  <circle className="hg-focal-glow" cx="220" cy="150" r="52" />
                  <g className="hg-up">
                    <circle cx="120" cy="56" r="18" />
                    <text className="hg-label" x="120" y="27" textAnchor="middle">ALGOL</text>
                  </g>
                  <g className="hg-up">
                    <circle cx="320" cy="56" r="18" />
                    <text className="hg-label" x="320" y="27" textAnchor="middle">B</text>
                  </g>
                  <g className="hg-impl-runtime">
                    <circle cx="110" cy="244" r="22" />
                    <image className="hg-logo" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" x="95" y="229" width="30" height="30" />
                    <text className="hg-label" x="110" y="285" textAnchor="middle">Python</text>
                  </g>
                  <g className="hg-impl-runtime">
                    <circle cx="220" cy="250" r="22" />
                    <image className="hg-logo" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg" x="205" y="235" width="30" height="30" />
                    <text className="hg-label" x="220" y="291" textAnchor="middle">Ruby</text>
                  </g>
                  <g className="hg-impl-compiler">
                    <circle cx="330" cy="244" r="22" />
                    <image className="hg-logo" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg" x="315" y="229" width="30" height="30" />
                    <text className="hg-label" x="330" y="285" textAnchor="middle">Go</text>
                  </g>
                  <g className="hg-focal-node">
                    <circle cx="220" cy="150" r="34" fill="url(#hg-focal-fill)" />
                    <image className="hg-logo" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg" x="197" y="127" width="46" height="46" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="stat reveal">
          <span className="stat-number">152</span>
          <span className="stat-label">Languages &amp; tools</span>
        </div>
        <div className="stat-divider" />
        <div className="stat reveal">
          <span className="stat-number">443</span>
          <span className="stat-label">Relationships</span>
        </div>
        <div className="stat-divider" />
        <div className="stat reveal">
          <span className="stat-number">1949</span>
          <span className="stat-label">Earliest Language</span>
        </div>
        <div className="stat-divider" />
        <div className="stat reveal">
          <span className="stat-number">2023</span>
          <span className="stat-label">Latest Language</span>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section about-section">
        <div className="section-grid">
          <div className="about-content">
            <p className="section-eyebrow reveal">What this maps</p>
            <h2 className="section-title reveal">
              How languages are<br />
              <em>actually built</em>
            </h2>
            <p className="section-text reveal">
              Every programming language runs on an implementation: a compiler, an interpreter,
              a runtime, or a virtual machine, almost always written in another language.
              Language Lineage maps those implementation relationships alongside influence and
              bootstrap chains.
            </p>
            <p className="section-text reveal">
              From CPython written in C to a self-hosting rustc first bootstrapped through OCaml,
              every edge carries a source and a confidence score. The graph is a documented
              record of computing infrastructure, not folklore.
            </p>
          </div>
          <div className="about-visual reveal">
            <div className="visual-card">
              <div className="card-header">
                <span className="card-dot" />
                <span className="card-dot" />
                <span className="card-dot" />
              </div>
              <div className="card-content impl-record">
                <div className="impl-row"><span className="impl-k">language</span><span className="impl-v">Python</span></div>
                <div className="impl-row"><span className="impl-k">first_release</span><span className="impl-v">1991</span></div>
                <div className="impl-row impl-hl"><span className="impl-k">runtime_written_in</span><span className="impl-v">C <span className="impl-conf">0.98</span></span></div>
                <div className="impl-row"><span className="impl-k">implementation</span><span className="impl-v">CPython</span></div>
                <div className="impl-row"><span className="impl-k">self_hosting</span><span className="impl-v">false</span></div>
                <div className="impl-chain">
                  <span className="impl-chip">C</span>
                  <span className="impl-link" aria-hidden="true" />
                  <span className="impl-chip">CPython</span>
                  <span className="impl-link" aria-hidden="true" />
                  <span className="impl-chip impl-chip-active">Python</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The atlas: a live glimpse of the real graph */}
      <LandingGraphGlimpse onOpen={onEnterGraph} />

      {/* How Section */}
      <section id="explore" className="section how-section">
        <div className="section-header">
          <p className="section-eyebrow reveal">How It Works</p>
          <h2 className="section-title centered reveal">
            Explore History,<br />
            <em>Interactively</em>
          </h2>
        </div>
        <div className="features-grid">
          <div className="feature reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/>
                <circle cx="24" cy="24" r="8" fill="currentColor"/>
                <line x1="24" y1="4" x2="24" y2="12" stroke="currentColor" strokeWidth="2"/>
                <line x1="24" y1="36" x2="24" y2="44" stroke="currentColor" strokeWidth="2"/>
                <line x1="4" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="2"/>
                <line x1="36" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="feature-title">Interactive Graph</h3>
            <p className="feature-text">
              Navigate a directed network of languages and toolchains. Select any node to
              see what it is written in, what it influenced, and the source behind each link.
            </p>
          </div>
          <div className="feature reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M4 40h40" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 40V20" stroke="currentColor" strokeWidth="2"/>
                <path d="M18 40V12" stroke="currentColor" strokeWidth="2"/>
                <path d="M28 40V24" stroke="currentColor" strokeWidth="2"/>
                <path d="M38 40V8" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8" cy="20" r="3" fill="currentColor"/>
                <circle cx="18" cy="12" r="3" fill="currentColor"/>
                <circle cx="28" cy="24" r="3" fill="currentColor"/>
                <circle cx="38" cy="8" r="3" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="feature-title">Timeline View</h3>
            <p className="feature-text">
              Watch programming evolve decade by decade. Play through history from
              1949 to today and see languages emerge in their historical context.
            </p>
          </div>
          <div className="feature reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <rect x="6" y="6" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <rect x="28" y="6" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <rect x="6" y="28" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <rect x="28" y="28" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 13h8M13 20v8M35 20v8M20 35h8" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="feature-title">Multiple Layouts</h3>
            <p className="feature-text">
              Switch between network, tree, cluster, and timeline views. Each layout
              reveals different patterns in how languages relate to each other.
            </p>
          </div>
          <div className="feature reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2"/>
                <path d="M24 12v12l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="24" cy="24" r="3" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="feature-title">Deep Filtering</h3>
            <p className="feature-text">
              Filter by paradigm, typing system, decade, or relationship type.
              Focus on functional languages, or trace the evolution of static typing.
            </p>
          </div>
        </div>
      </section>

      {/* More Than a Family Tree — comparison section */}
      <section className="section more-than-section">
        <div className="section-header">
          <p className="section-eyebrow reveal">Beyond influence</p>
          <h2 className="section-title centered reveal">
            More than a<br /><em>programming language family tree</em>
          </h2>
          <p className="section-text centered reveal">
            Most language family trees show only influence and ancestry. Language Lineage also
            maps implementation relationships: what compilers, runtimes, virtual machines, and
            bootstrap chains each language actually uses. 152 languages and toolchains, 443
            evidence-backed relationships.
          </p>
        </div>
        <div className="comparison-table reveal">
          <table>
            <thead>
              <tr><th>Feature</th><th>Influence-only family tree</th><th>Language Lineage</th></tr>
            </thead>
            <tbody>
              <tr><td>Influence &amp; ancestry</td><td>✓</td><td>✓</td></tr>
              <tr><td>Compiler implementation</td><td>—</td><td>✓</td></tr>
              <tr><td>Runtime / VM written in</td><td>—</td><td>✓</td></tr>
              <tr><td>Bootstrap chain</td><td>—</td><td>✓</td></tr>
              <tr><td>Transpilation relationships</td><td>—</td><td>✓</td></tr>
              <tr><td>Confidence scores + sources</td><td>—</td><td>✓</td></tr>
              <tr><td>Interactive graph explorer</td><td>—</td><td>✓</td></tr>
              <tr><td>Programmatic pages per language</td><td>—</td><td>✓</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Why Section */}
      <section id="why" className="section why-section">
        <div className="section-grid reverse">
          <div className="why-visual reveal">
            <div className="quote-card">
              <blockquote>
                rustc was first written in OCaml, then rewritten in Rust once it
                could compile itself.
              </blockquote>
              <cite>bootstrap_written_in &middot; rustc</cite>
              <p className="quote-note">
                Knowing how a toolchain bootstrapped explains the constraints it
                carries today. Every chain in the graph is sourced and
                confidence-scored.
              </p>
            </div>
          </div>
          <div className="why-content">
            <p className="section-eyebrow reveal">Why It Matters</p>
            <h2 className="section-title reveal">
              Context Changes<br />
              <em>Everything</em>
            </h2>
            <div className="why-points">
              <div className="why-point reveal">
                <span className="point-number">01</span>
                <div className="point-content">
                  <h4>Learn Faster</h4>
                  <p>
                    When you understand that Rust's ownership model was inspired by
                    C++'s memory challenges, concepts click into place faster.
                  </p>
                </div>
              </div>
              <div className="why-point reveal">
                <span className="point-number">02</span>
                <div className="point-content">
                  <h4>Choose Wisely</h4>
                  <p>
                    Knowing a language's heritage, its influences and implementation
                    foundations, helps you pick the right tool for your project.
                  </p>
                </div>
              </div>
              <div className="why-point reveal">
                <span className="point-number">03</span>
                <div className="point-content">
                  <h4>Appreciate Craft</h4>
                  <p>
                    Every language represents years of thought and trade-offs.
                    Understanding the journey deepens appreciation for the craft.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="cta-bg">
          <div className="cta-gradient" />
          <div className="cta-pattern" />
        </div>
        <div className="cta-content">
          <h2 className="cta-title reveal">
            Open the graph
          </h2>
          <p className="cta-text reveal">
            Explore the implementation, runtime, bootstrap, and influence relationships
            between 152 programming languages and toolchains, every edge sourced.
          </p>
          <button className="btn-primary large reveal" onClick={onEnterGraph}>
            <span>Launch the graph</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Language Index */}
      <section id="languages" className="lang-index-section">
        <div className="lang-index-inner">
          <p className="section-eyebrow reveal">Browse</p>
          <h2 className="section-title lang-index-title reveal">Language Index</h2>
          <div className="lang-index-grid">
            {[
              { name: 'C', slug: 'c' }, { name: 'C++', slug: 'cxx' }, { name: 'Python', slug: 'python' },
              { name: 'JavaScript', slug: 'javascript' }, { name: 'TypeScript', slug: 'typescript' }, { name: 'Rust', slug: 'rust' },
              { name: 'Go', slug: 'go' }, { name: 'Java', slug: 'java' }, { name: 'Haskell', slug: 'haskell' },
              { name: 'Lisp', slug: 'lisp' }, { name: 'Fortran', slug: 'fortran' }, { name: 'Kotlin', slug: 'kotlin' },
              { name: 'Swift', slug: 'swift' }, { name: 'Ruby', slug: 'ruby' }, { name: 'Erlang', slug: 'erlang' },
              { name: 'OCaml', slug: 'ocaml' }, { name: 'Scala', slug: 'scala' }, { name: 'Clojure', slug: 'clojure' },
              { name: 'Elixir', slug: 'elixir' }, { name: 'Dart', slug: 'dart' }, { name: 'Julia', slug: 'julia' },
              { name: 'Zig', slug: 'zig' }, { name: 'Nim', slug: 'nim' }, { name: 'Assembly', slug: 'assembly' },
            ].map(({ name, slug }) => (
              <a key={slug} href={`/languages/${slug}`} className="lang-index-link">
                {name}
              </a>
            ))}
          </div>
          <div className="lang-index-links">
            <a href="/dataset" className="lang-index-cta">View dataset &rarr;</a>
            <a href="/relationships/compiler-written-in" className="lang-index-sub">Compiler relationships</a>
            <a href="/guides/what-is-compiler-bootstrapping" className="lang-index-sub">What is bootstrapping?</a>
            <a href="/guides/how-python-is-implemented" className="lang-index-sub">How Python is implemented</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img className="brand-mark" src="/logo-mark.svg" width="24" height="24" alt="" aria-hidden="true" />
            <span className="logo-text">Language Lineage</span>
          </div>
          <p className="footer-tagline">
            Mapping how programming languages, compilers, and runtimes are built.
          </p>
          <p className="footer-made">
            Made with{' '}
            <span className="footer-heart" aria-hidden="true">❤️</span>{' '}
            by{' '}
            <a href="https://github.com/sanketmuchhala" target="_blank" rel="noopener noreferrer">
              Sanket Muchhala
            </a>
          </p>
          <div className="footer-links">
            <a href="https://github.com/sanketmuchhala/LanguageLineage" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span className="footer-divider">·</span>
            <a href="#about">About</a>
            <span className="footer-divider">·</span>
            <button onClick={onEnterGraph}>Enter Graph</button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Language Lineage</p>
        </div>
      </footer>
    </div>
  );
}
