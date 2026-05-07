import { useState } from 'react';
import { CLUSTER_COLORS, RELATIONSHIP_COLORS } from '../graph/style';
import { useGraphStore } from '../store/useGraphStore';

export function Legend() {
  const [collapsed, setCollapsed] = useState(true);
  const { filters } = useGraphStore();
  const isInfluenceMode = filters.graphMode === 'influence';

  return (
    <div className={`legend ${collapsed ? 'collapsed' : ''}`}>
      <button className="legend-toggle" onClick={() => setCollapsed(!collapsed)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={collapsed ? "M9 18l6-6-6-6" : "M6 9l6 6 6-6"} />
        </svg>
        <span>Legend</span>
      </button>

      {!collapsed && (
        <div className="legend-content">
          <div className="legend-section">
            <h4>Node Clusters</h4>
            {Object.entries(CLUSTER_COLORS).map(([cluster, color]) => (
              <div key={cluster} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: color }} />
                <span className="legend-text">{cluster.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>

          <div className="legend-section">
            <h4>Node Size</h4>
            <div className="legend-item">
              <span className="legend-circle legend-circle-small" />
              <span className="legend-text">Fewer connections</span>
            </div>
            <div className="legend-item">
              <span className="legend-circle legend-circle-large" />
              <span className="legend-text">More connections</span>
            </div>
          </div>

          {isInfluenceMode ? (
            <div className="legend-section">
              <h4>Edge Type</h4>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#f59e0b' }} />
                <span className="legend-text">Conceptual influence</span>
              </div>
            </div>
          ) : (
            <div className="legend-section">
              <h4>Edge Types</h4>
              {Object.entries(RELATIONSHIP_COLORS)
                .filter(([rel]) => rel !== 'influenced' && rel !== 'influenced_by')
                .map(([relationship, color]) => (
                  <div key={relationship} className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: color }} />
                    <span className="legend-text">{relationship.replace(/_/g, ' ')}</span>
                  </div>
                ))}
            </div>
          )}

          {!isInfluenceMode && (
            <div className="legend-section">
              <h4>Edge Styles</h4>
              <div className="legend-item">
                <span className="legend-line legend-line-solid" />
                <span className="legend-text">Implementation</span>
              </div>
              <div className="legend-item">
                <span className="legend-line legend-line-dashed" />
                <span className="legend-text">Bootstrap / Rewrite / Transpile</span>
              </div>
            </div>
          )}

          <div className="legend-section">
            <h4>Edge Confidence</h4>
            <div className="legend-item">
              <span className="legend-line legend-line-solid" style={{ opacity: 1.0 }} />
              <span className="legend-text">High (90%+)</span>
            </div>
            <div className="legend-item">
              <span className="legend-line legend-line-solid" style={{ opacity: 0.6 }} />
              <span className="legend-text">Medium (70-89%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-line legend-line-solid" style={{ opacity: 0.3 }} />
              <span className="legend-text">Low (&lt;70%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
