export function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', background: 'var(--bg-canvas)' }}>
      <h1 style={{ fontSize: '72px', fontWeight: 700, color: 'var(--accent)', margin: 0, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>404</h1>
      <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Page not found</p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '15px' }}>Home</a>
        <span style={{ color: 'var(--text-tertiary)' }}>·</span>
        <a href="/explore" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '15px' }}>Graph Explorer</a>
        <span style={{ color: 'var(--text-tertiary)' }}>·</span>
        <a href="/dataset" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '15px' }}>Dataset</a>
      </div>
    </div>
  );
}
