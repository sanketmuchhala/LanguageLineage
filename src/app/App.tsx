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
        description="Explore what programming languages are written in, how compilers are bootstrapped, and how languages evolved. Interactive graph of 152 languages and 443 relationships."
        canonical="https://www.languagelineage.org/"
        ogImage="https://www.languagelineage.org/og-image.png"
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
        description="Explore the interactive programming language graph. See implementation and influence relationships between 152 languages."
        canonical="https://www.languagelineage.org/explore"
        ogImage="https://www.languagelineage.org/og-image.png"
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
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
