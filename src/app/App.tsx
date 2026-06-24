import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { LandingPage } from '../ui/LandingPage';
import { NotFound } from '../pages/NotFound';
import { Seo } from '../seo/Seo';

import '../styles/tokens.css';
import './App.css';

const GraphExplorer = lazy(() => import('./GraphExplorer'));
const EmbedGraph = lazy(() => import('./EmbedGraph'));

// Design-review prototypes: dev-only, noindex, not in sitemap. Removed in Phase 11.
const DesignReview = lazy(() => import('../design-review/DesignReview'));
const ConceptCompilerAtlas = lazy(() => import('../design-review/ConceptCompilerAtlas'));
const ConceptRuntimeObservatory = lazy(() => import('../design-review/ConceptRuntimeObservatory'));
const ConceptSourceArchive = lazy(() => import('../design-review/ConceptSourceArchive'));

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000000', color: '#4ade80', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '13px', letterSpacing: '0.04em' }}>
      Loading graph...
    </div>
  );
}

function LandingPageWrapper() {
  const navigate = useNavigate();
  return (
    <>
      <Seo
        title="Programming Language Lineage Graph | What Languages Are Written In"
        description="Explore what programming languages are written in, how compilers are bootstrapped, and how languages evolved. Interactive graph of 112 languages and 347 relationships."
        canonical="https://www.languagelineage.org/"
        ogImage="https://languagelineage.org/og-image.svg"
      />
      <LandingPage onEnterGraph={() => navigate('/explore')} />
    </>
  );
}

function GraphExplorerWrapper() {
  return (
    <>
      <Seo
        title="Graph Explorer | Language Lineage"
        description="Explore the interactive programming language graph. See implementation and influence relationships between 112 languages."
        canonical="https://languagelineage.org/explore"
        ogImage="https://languagelineage.org/og-image.svg"
      />
      <Suspense fallback={<LoadingScreen />}>
        <GraphExplorer />
      </Suspense>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPageWrapper />} />
          <Route path="/explore" element={<GraphExplorerWrapper />} />
          <Route path="/embed" element={<Suspense fallback={null}><EmbedGraph /></Suspense>} />
          <Route path="/design-review" element={<Suspense fallback={null}><DesignReview /></Suspense>} />
          <Route path="/design-review/compiler-atlas" element={<Suspense fallback={null}><ConceptCompilerAtlas /></Suspense>} />
          <Route path="/design-review/runtime-observatory" element={<Suspense fallback={null}><ConceptRuntimeObservatory /></Suspense>} />
          <Route path="/design-review/source-archive" element={<Suspense fallback={null}><ConceptSourceArchive /></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
