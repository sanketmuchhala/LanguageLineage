export function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px', fontFamily: 'system-ui, sans-serif', color: '#f5f0e8', background: '#0a0a0b' }}>
      <h1 style={{ fontSize: '72px', fontWeight: 700, color: '#c9a87c', margin: 0 }}>404</h1>
      <p style={{ fontSize: '18px', color: '#9a958c' }}>Page not found</p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <a href="/" style={{ color: '#c9a87c', textDecoration: 'none', fontSize: '15px' }}>Home</a>
        <span style={{ color: '#5a564f' }}>·</span>
        <a href="/explore" style={{ color: '#c9a87c', textDecoration: 'none', fontSize: '15px' }}>Graph Explorer</a>
        <span style={{ color: '#5a564f' }}>·</span>
        <a href="/dataset" style={{ color: '#c9a87c', textDecoration: 'none', fontSize: '15px' }}>Dataset</a>
      </div>
    </div>
  );
}
