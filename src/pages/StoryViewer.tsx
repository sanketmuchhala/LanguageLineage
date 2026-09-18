import { useParams, Link, useNavigate } from 'react-router-dom';
import { Seo } from '../seo/Seo';
import { useEffect } from 'react';
import { useGraphStoreV6 } from '../store/useGraphStoreV6';

export function StoryViewer() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { updateFilters, setSelectedNode, resetFilters } = useGraphStoreV6();

  // In a real implementation, this would fetch story states from stories.json
  // For the MVP of this refactor, we just push the user into the graph explorer
  // with pre-configured filters and focus nodes based on the story.

  useEffect(() => {
    // Reset any existing exploration state
    resetFilters();

    switch (slug) {
      case 'rust-bootstrap':
        updateFilters({ graphMode: 'bootstrap' });
        setSelectedNode('lang:rust');
        break;
      case 'bcpl-to-c':
        updateFilters({ graphMode: 'influence' });
        setSelectedNode('lang:c');
        break;
      case 'ai-ecosystem':
        updateFilters({ graphMode: 'ai_ecosystem' });
        setSelectedNode('ai:pytorch');
        break;
    }

    // Redirect to the explorer where the story actually plays out visually
    // The query param ensures the store catches the pending node on mount
    const targetNode = slug === 'rust-bootstrap' ? 'lang:rust' : slug === 'bcpl-to-c' ? 'lang:c' : 'ai:pytorch';
    navigate(`/explore?node=${targetNode}`);

  }, [slug, navigate, resetFilters, updateFilters, setSelectedNode]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000', color: '#fff' }}>
      <Seo title="Loading Story..." description="Preparing the atlas story view." />
      <p>Loading story environment...</p>
    </div>
  );
}
