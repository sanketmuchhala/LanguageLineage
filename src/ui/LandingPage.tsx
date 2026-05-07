import { useEffect, useRef } from 'react';
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

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="logo-mark">LL</span>
          <span className="logo-text">Language Lineage</span>
        </div>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#explore">Explore</a>
          <a href="#why">Why</a>
          <button className="nav-cta" onClick={onEnterGraph}>
            Enter Graph
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-gradient" />
        </div>
        <div className="hero-content">
          <p className="hero-eyebrow reveal">An Interactive Exploration</p>
          <h1 className="hero-title reveal">
            <span className="title-line">The Family Tree</span>
            <span className="title-line accent">of Programming</span>
          </h1>
          <p className="hero-subtitle reveal">
            Trace 80+ years of innovation. Discover how languages inspired each other,
            from FORTRAN to Rust, and understand the DNA of modern code.
          </p>
          <div className="hero-actions reveal">
            <button className="btn-primary" onClick={onEnterGraph}>
              <span>Explore the Graph</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <a href="#about" className="btn-secondary">
              Learn More
            </a>
          </div>
        </div>
        <div className="hero-visual reveal">
          <div className="demo-graph">
            <svg viewBox="0 0 400 400" className="demo-graph-svg">
              {/* Connection lines */}
              <g className="demo-edges">
                {/* ALGOL to C */}
                <line x1="120" y1="80" x2="200" y2="200" className="demo-edge" />
                {/* B to C */}
                <line x1="80" y1="180" x2="200" y2="200" className="demo-edge" />
                {/* Assembly to C */}
                <line x1="60" y1="280" x2="200" y2="200" className="demo-edge" />
                {/* C to C++ */}
                <line x1="200" y1="200" x2="320" y2="120" className="demo-edge influenced" />
                {/* C to Java */}
                <line x1="200" y1="200" x2="340" y2="200" className="demo-edge influenced" />
                {/* C to Python */}
                <line x1="200" y1="200" x2="300" y2="280" className="demo-edge influenced" />
                {/* C to Rust */}
                <line x1="200" y1="200" x2="340" y2="320" className="demo-edge influenced" />
                {/* C to Go */}
                <line x1="200" y1="200" x2="280" y2="360" className="demo-edge influenced" />
              </g>
              {/* Ancestor nodes */}
              <g className="demo-nodes">
                <g className="demo-node ancestor">
                  <circle cx="120" cy="80" r="28" />
                  <text x="120" y="85">ALGOL</text>
                </g>
                <g className="demo-node ancestor">
                  <circle cx="80" cy="180" r="24" />
                  <text x="80" y="185">B</text>
                </g>
                <g className="demo-node ancestor">
                  <circle cx="60" cy="280" r="22" />
                  <text x="60" y="285">ASM</text>
                </g>
                {/* Central C node */}
                <g className="demo-node central">
                  <circle cx="200" cy="200" r="40" />
                  <text x="200" y="208">C</text>
                </g>
                {/* Descendant nodes */}
                <g className="demo-node descendant">
                  <circle cx="320" cy="120" r="30" />
                  <text x="320" y="125">C++</text>
                </g>
                <g className="demo-node descendant">
                  <circle cx="340" cy="200" r="28" />
                  <text x="340" y="205">Java</text>
                </g>
                <g className="demo-node descendant">
                  <circle cx="300" cy="280" r="30" />
                  <text x="300" y="285">Python</text>
                </g>
                <g className="demo-node descendant">
                  <circle cx="340" cy="320" r="26" />
                  <text x="340" y="325">Rust</text>
                </g>
                <g className="demo-node descendant">
                  <circle cx="280" cy="360" r="24" />
                  <text x="280" y="365">Go</text>
                </g>
              </g>
            </svg>
            <div className="demo-graph-label">
              <span className="label-accent">C</span> and its lineage
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <span>Scroll to explore</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="stat reveal">
          <span className="stat-number">150+</span>
          <span className="stat-label">Languages Mapped</span>
        </div>
        <div className="stat-divider" />
        <div className="stat reveal">
          <span className="stat-number">500+</span>
          <span className="stat-label">Relationships</span>
        </div>
        <div className="stat-divider" />
        <div className="stat reveal">
          <span className="stat-number">1940</span>
          <span className="stat-label">Earliest Language</span>
        </div>
        <div className="stat-divider" />
        <div className="stat reveal">
          <span className="stat-number">2024</span>
          <span className="stat-label">Latest Updates</span>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section about-section">
        <div className="section-grid">
          <div className="about-content">
            <p className="section-eyebrow reveal">What We Do</p>
            <h2 className="section-title reveal">
              Mapping the<br />
              <em>Invisible Connections</em>
            </h2>
            <p className="section-text reveal">
              Every programming language stands on the shoulders of giants. Language Lineage
              visualizes the hidden web of influence, implementation, and inspiration that
              connects every language ever created.
            </p>
            <p className="section-text reveal">
              From the mathematical foundations of LISP to the systems programming revolution
              of Rust, we trace the threads that weave through computing history—revealing
              patterns that explain why languages work the way they do.
            </p>
          </div>
          <div className="about-visual reveal">
            <div className="visual-card">
              <div className="card-header">
                <span className="card-dot" />
                <span className="card-dot" />
                <span className="card-dot" />
              </div>
              <div className="card-content">
                <div className="tree-line">
                  <span className="tree-node root">ALGOL 60</span>
                </div>
                <div className="tree-line">
                  <span className="tree-branch" />
                  <span className="tree-node">Pascal</span>
                  <span className="tree-branch" />
                  <span className="tree-node">C</span>
                </div>
                <div className="tree-line">
                  <span className="tree-branch deep" />
                  <span className="tree-node">Delphi</span>
                  <span className="tree-branch deep" />
                  <span className="tree-node">C++</span>
                </div>
                <div className="tree-line">
                  <span className="tree-spacer" />
                  <span className="tree-branch deep" />
                  <span className="tree-node active">Rust</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              Navigate a dynamic network of languages. Click any node to reveal its
              ancestors, descendants, and the stories of how they're connected.
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
              1940 to today and see languages emerge in their historical context.
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

      {/* Why Section */}
      <section id="why" className="section why-section">
        <div className="section-grid reverse">
          <div className="why-visual reveal">
            <div className="quote-card">
              <blockquote>
                "Those who cannot remember the past are condemned to repeat it."
              </blockquote>
              <cite>— George Santayana</cite>
              <p className="quote-note">
                Understanding why languages evolved the way they did helps us
                make better choices about the tools we use—and build—today.
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
                    Knowing a language's DNA—its influences and philosophy—helps you
                    pick the right tool for your project.
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
            Ready to Explore?
          </h2>
          <p className="cta-text reveal">
            Dive into the interactive graph and discover the hidden connections
            between your favorite programming languages.
          </p>
          <button className="btn-primary large reveal" onClick={onEnterGraph}>
            <span>Launch the Graph</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-mark">LL</span>
            <span className="logo-text">Language Lineage</span>
          </div>
          <p className="footer-tagline">
            Tracing the evolution of code since 2024.
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
          <p>Built with curiosity and caffeine</p>
        </div>
      </footer>
    </div>
  );
}
