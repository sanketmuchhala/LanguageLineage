import { useNavigate } from 'react-router-dom';
import { Seo } from '../seo/Seo';
import { useEffect } from 'react';
import { useGraphStoreV6 } from '../store/useGraphStoreV6';

export function BootstrapExplorer() {
  const navigate = useNavigate();
  const { updateFilters, resetFilters } = useGraphStoreV6();

  useEffect(() => {
    resetFilters();
    updateFilters({ graphMode: 'bootstrap' });
    navigate('/explore');
  }, [navigate, resetFilters, updateFilters]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000', color: '#fff' }}>
      <Seo title="Bootstrap Explorer | Language Lineage" description="Explore compiler bootstrapping sequences." />
      <p>Entering bootstrap mode...</p>
    </div>
  );
}
