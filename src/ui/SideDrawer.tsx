import { useGraphStore } from '../store/useGraphStore';
import { LOGO_MAP, LOGO_COLORS } from '../data/logoMap';
import { getAdaptiveLogoBackground, getLogoBorderColor } from '../utils/colorContrast';
import './SideDrawer.css';

export function SideDrawer() {
  const { dataset, datasetIndex, selectedNodeId, selectedEdgeId, sideDrawerOpen, setSideDrawerOpen, explorationMode, setExplorationMode, isDarkMode } =
    useGraphStore();

  if (!sideDrawerOpen || !dataset) {
    return null;
  }

  const handleClose = () => {
    setSideDrawerOpen(false);
  };

  // Show node details
  if (selectedNodeId) {
    const node = dataset.languageMap.get(selectedNodeId);

    if (!node) {
      return null;
    }

    const incoming = datasetIndex?.incomingEdges.get(selectedNodeId) || [];
    const outgoing = datasetIndex?.outgoingEdges.get(selectedNodeId) || [];

    return (
      <>
        <div className="side-drawer-backdrop visible" onClick={handleClose} />
        <div className="side-drawer">
        <div className="drawer-header">
          <h2>{node.name}</h2>
          <button className="drawer-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="drawer-content">
          {LOGO_MAP[selectedNodeId] && (() => {
            const logoColor = LOGO_COLORS[selectedNodeId] || null;
            const logoBg = getAdaptiveLogoBackground(logoColor, isDarkMode);
            const logoBorder = getLogoBorderColor(logoColor, isDarkMode);

            return (
              <div
                className="language-logo"
                style={{
                  backgroundColor: logoBg,
                  borderColor: logoBorder
                }}
              >
                <img src={LOGO_MAP[selectedNodeId]!} alt={`${node.name} logo`} />
              </div>
            );
          })()}

          <section className="drawer-section">
            <h3>Details</h3>
            <p>
              <strong>First Release:</strong> {node.first_release_year || 'N/A'}
            </p>
            <p>
              <strong>Implementation:</strong> {node.current_primary_implementation_language}
            </p>
            {node.notes && (
              <p>
                <strong>Notes:</strong> {node.notes}
              </p>
            )}
          </section>

          <section className="drawer-section">
            <h3>Attributes</h3>
            <p>
              <strong>Paradigm:</strong> {node.paradigm?.join(', ') || 'N/A'}
            </p>
            <p>
              <strong>Typing:</strong> {node.typing || 'N/A'}
            </p>
            <p>
              <strong>Runtime:</strong> {node.runtime_model || 'N/A'}
            </p>
            <p>
              <strong>Self-hosting:</strong> {node.self_hosting === true ? 'Yes' : node.self_hosting === false ? 'No' : 'N/A'}
            </p>
            {node.company && (
              <p>
                <strong>Company:</strong> {node.company}
              </p>
            )}
          </section>

          <section className="drawer-section">
            <h3>Graph Metrics</h3>
            <div className="drawer-metrics">
              <div className="metric">
                <span className="metric-value">{incoming.length}</span>
                <span className="metric-label">In</span>
              </div>
              <div className="metric">
                <span className="metric-value">{outgoing.length}</span>
                <span className="metric-label">Out</span>
              </div>
              <div className="metric">
                <span className="metric-value">{incoming.length + outgoing.length}</span>
                <span className="metric-label">Total</span>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h3>Explore</h3>
            <div className="explore-buttons">
              <button
                className={`explore-btn ${explorationMode === 'ancestors' ? 'active' : ''}`}
                onClick={() => setExplorationMode(explorationMode === 'ancestors' ? 'none' : 'ancestors')}
              >
                Ancestors
              </button>
              <button
                className={`explore-btn ${explorationMode === 'descendants' ? 'active' : ''}`}
                onClick={() => setExplorationMode(explorationMode === 'descendants' ? 'none' : 'descendants')}
              >
                Descendants
              </button>
              <button
                className={`explore-btn ${explorationMode === 'focus' ? 'active' : ''}`}
                onClick={() => setExplorationMode(explorationMode === 'focus' ? 'none' : 'focus')}
              >
                Full Lineage
              </button>
            </div>
          </section>

          {outgoing.length > 0 && (
            <section className="drawer-section">
              <h3>Outgoing Edges ({outgoing.length})</h3>
              <ul className="edge-list">
                {outgoing.map((edge) => {
                  const targetNode = dataset.languageMap.get(edge.to_language);
                  return (
                    <li key={edge.id}>
                      → {targetNode?.name || edge.to_language} ({edge.relationship})
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {incoming.length > 0 && (
            <section className="drawer-section">
              <h3>Incoming Edges ({incoming.length})</h3>
              <ul className="edge-list">
                {incoming.map((edge) => {
                  const sourceNode = dataset.languageMap.get(edge.from_language);
                  return (
                    <li key={edge.id}>
                      ← {sourceNode?.name || edge.from_language} ({edge.relationship})
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
      </>
    );
  }

  // Show edge details
  if (selectedEdgeId) {
    const edge = dataset.edgeMap.get(selectedEdgeId);

    if (!edge) {
      return null;
    }

    const sourceNode = dataset.languageMap.get(edge.from_language);
    const targetNode = dataset.languageMap.get(edge.to_language);

    return (
      <>
        <div className="side-drawer-backdrop visible" onClick={handleClose} />
        <div className="side-drawer">
        <div className="drawer-header">
          <h2>Edge Details</h2>
          <button className="drawer-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="drawer-content">
          <section className="drawer-section">
            <h3>Relationship</h3>
            <p>
              <strong>From:</strong> {sourceNode?.name || edge.from_language}
            </p>
            <p>
              <strong>To:</strong> {targetNode?.name || edge.to_language}
            </p>
            <p>
              <strong>Type:</strong> {edge.relationship.replace(/_/g, ' ')}
            </p>
          </section>

          <section className="drawer-section">
            <h3>Time Range</h3>
            <p>
              <strong>Start:</strong> {edge.start_year}
            </p>
            <p>
              <strong>End:</strong> {edge.end_year || 'present'}
            </p>
          </section>

          <section className="drawer-section">
            <h3>Confidence</h3>
            <p>{(edge.confidence * 100).toFixed(0)}%</p>
          </section>

          {edge.evidence_source && (
            <section className="drawer-section">
              <h3>Evidence</h3>
              {edge.evidence_source.split('|').map((url, idx) => (
                <p key={idx}>
                  <a href={url.trim()} target="_blank" rel="noopener noreferrer">
                    {url.trim()}
                  </a>
                </p>
              ))}
            </section>
          )}
        </div>
      </div>
      </>
    );
  }

  return null;
}
