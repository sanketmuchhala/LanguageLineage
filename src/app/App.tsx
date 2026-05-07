import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { LandingPage } from '../ui/LandingPage';
import { NotFound } from '../pages/NotFound';
import { Seo } from '../seo/Seo';

import './App.css';

const GraphExplorer = lazy(() => import('./GraphExplorer'));

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0b', color: '#c9a87c', fontFamily: 'system-ui, sans-serif', fontSize: '14px' }}>
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
        canonical="https://languagelineage.org/"
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
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
