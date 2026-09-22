import { useState } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { LOGO_MAP, LOGO_COLORS, getLogoPresentation } from '../data/logoMap';
import { getAdaptiveLogoBackground, getLogoBorderColor } from '../utils/colorContrast';
import './SideDrawer.css';

const REL_TYPE_LABELS: Record<string, string> = {
  compiler_written_in: 'compiler written in',
  runtime_written_in: 'runtime written in',
  bootstrap_written_in: 'bootstrap written in',
  rewritten_in: 'rewritten in',
  influenced: 'influenced',
  influenced_by: 'influenced by',
  transpiled_to: 'transpiled to',
};

export function SideDrawer() {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const { dataset, datasetIndex, selectedNodeId, selectedEdgeId, sideDrawerOpen, setSideDrawerOpen, explorationMode, setExplorationMode, isDarkMode, traceMode, traceNodeA, traceNodeB, tracePath, traceEdgeIds } =
    useGraphStore();

  if (!dataset) return null;
  if (!sideDrawerOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1800);
    });
  };

  const handleClose = () => {
    setSideDrawerOpen(false);
  };

  // Trace mode: show trace result when both nodes picked
  if (traceMode && traceNodeA && traceNodeB) {
    const nodeA = dataset.languageMap.get(traceNodeA);
    const nodeB = dataset.languageMap.get(traceNodeB);
    const pathNodes = tracePath?.map((id) => dataset.languageMap.get(id));
    const pathEdges = traceEdgeIds?.map((id) => dataset.edgeMap.get(id));

    return (
      <>
        <div className="side-drawer-backdrop visible" onClick={handleClose} />
        <div className="side-drawer">
          <div className="drawer-header">
            <h2>Trace Path</h2>
            <button className="drawer-close" onClick={handleClose}>✕</button>
          </div>
          <div className="drawer-content">
            {tracePath ? (
              <section className="drawer-section">
                <h3>{nodeA?.name} → {nodeB?.name}</h3>
                <p className="trace-hop-count">{tracePath.length - 1} hop{tracePath.length !== 2 ? 's' : ''}</p>
                <ol className="trace-path-list">
                  {tracePath.map((nodeId, i) => {
                    const n = pathNodes?.[i];
                    const edge = i < (pathEdges?.length ?? 0) ? pathEdges?.[i] : null;
                    const rel = edge ? REL_TYPE_LABELS[edge.relationship] ?? edge.relationship : null;
                    const isEndpoint = i === 0 || i === tracePath.length - 1;
                    return (
                      <li key={nodeId} className={isEndpoint ? 'trace-endpoint' : ''}>
                        <span className="trace-node-name">{n?.name ?? nodeId}</span>
                        {rel && <span className="trace-edge-label">{rel} →</span>}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : (
              <section className="drawer-section">
                <p className="trace-no-path">No path found between <strong>{nodeA?.name}</strong> and <strong>{nodeB?.name}</strong> under active relationship filters.</p>
                <p className="trace-no-path-hint">Try enabling more relationship types in the panel.</p>
              </section>
            )}
          </div>
        </div>
      </>
    );
  }

  // Show node details
  if (selectedNodeId) {
    const node = dataset.languageMap.get(selectedNodeId);

    if (!node) {
      return null;
    }

    const incoming = datasetIndex?.incomingEdges.get(selectedNodeId) || [];
    const outgoing = datasetIndex?.outgoingEdges.get(selectedNodeId) || [];

    const prefix = selectedNodeId.startsWith('tool:') ? 'tools' : 'languages';
    const slug = selectedNodeId.replace(/^(lang|tool):/, '').replace(/_/g, '-');
    const detailsUrl = `/${prefix}/${slug}`;
    const logoUrl = node.logo_url ?? LOGO_MAP[selectedNodeId] ?? null;
    const logoKind = node.logo_kind ?? (LOGO_MAP[selectedNodeId] ? 'devicon' : 'none');
    const logoPresentation = getLogoPresentation(selectedNodeId, logoKind);
    const logoColor = LOGO_COLORS[selectedNodeId] || null;
    const logoBg = getAdaptiveLogoBackground(logoColor, isDarkMode, logoPresentation.surface);
    const logoBorder = getLogoBorderColor(logoColor, isDarkMode, logoPresentation.surface);

    return (
      <>
        <div className="side-drawer-backdrop visible" onClick={handleClose} />
        <div className="side-drawer">
        <div className="drawer-header">
          <h2>{node.name}</h2>
          <div className="drawer-header-actions">
            <button
              className="copy-link-btn"
              onClick={handleCopyLink}
              title="Copy link to this node"
            >
              {copyFeedback ? 'Copied!' : 'Copy link'}
            </button>
            <button className="drawer-close" onClick={handleClose}>✕</button>
          </div>
        </div>

        <div className="drawer-content">
          {traceMode && traceNodeA && !traceNodeB && (
            <section className="drawer-section trace-hint-section">
              <p className="trace-select-hint">Trace mode: now click the destination node.</p>
            </section>
          )}

          {logoUrl && (
              <div
                className="language-logo"
                style={{
                  backgroundColor: logoBg,
                  borderColor: logoBorder
                }}
              >
                <img
                  src={logoUrl}
                  alt={`${node.name} logo`}
                  style={{
                    width: logoPresentation.size,
                    maxWidth: logoKind === 'wikimedia' ? '136px' : '116px',
                    transform: logoPresentation.offsetY === '50%' ? undefined : `translateY(${logoPresentation.offsetY === '49%' ? '-2px' : '2px'})`,
                  }}
                />
              </div>
          )}

          <section className="drawer-section">
            <a href={detailsUrl} className="drawer-details-link">
              View full details page &rarr;
            </a>
          </section>

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
                title="Upstream: what this is built on and influenced by"
              >
                Upstream
              </button>
              <button
                className={`explore-btn ${explorationMode === 'descendants' ? 'active' : ''}`}
                onClick={() => setExplorationMode(explorationMode === 'descendants' ? 'none' : 'descendants')}
                title="Downstream: what is built on or influenced by this"
              >
                Downstream
              </button>
              <button
                className={`explore-btn ${explorationMode === 'focus' ? 'active' : ''}`}
                onClick={() => setExplorationMode(explorationMode === 'focus' ? 'none' : 'focus')}
                title="Full dependency and influence chain"
              >
                Full chain
              </button>
            </div>
          </section>

          {outgoing.length > 0 && (
            <section className="drawer-section" id={`rel-table-${selectedNodeId}`}>
              <h3>Outgoing ({outgoing.length})</h3>
              <table className="rel-table" aria-label={`${node.name} outgoing relationships`}>
                <thead>
                  <tr>
                    <th scope="col">Target</th>
                    <th scope="col">Relationship</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoing.map((edge) => {
                    const targetNode = dataset.languageMap.get(edge.to_language);
                    const prefix = edge.to_language.startsWith('tool:') ? 'tools' : 'languages';
                    const tSlug = edge.to_language.replace(/^(lang|tool):/, '').replace(/_/g, '-');
                    return (
                      <tr key={edge.id}>
                        <td><a href={`/${prefix}/${tSlug}`}>{targetNode?.name ?? edge.to_language}</a></td>
                        <td>{REL_TYPE_LABELS[edge.relationship] ?? edge.relationship}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          {incoming.length > 0 && (
            <section className="drawer-section">
              <h3>Incoming ({incoming.length})</h3>
              <table className="rel-table" aria-label={`${node.name} incoming relationships`}>
                <thead>
                  <tr>
                    <th scope="col">Source</th>
                    <th scope="col">Relationship</th>
                  </tr>
                </thead>
                <tbody>
                  {incoming.map((edge) => {
                    const sourceNode = dataset.languageMap.get(edge.from_language);
                    const prefix = edge.from_language.startsWith('tool:') ? 'tools' : 'languages';
                    const sSlug = edge.from_language.replace(/^(lang|tool):/, '').replace(/_/g, '-');
                    return (
                      <tr key={edge.id}>
                        <td><a href={`/${prefix}/${sSlug}`}>{sourceNode?.name ?? edge.from_language}</a></td>
                        <td>{REL_TYPE_LABELS[edge.relationship] ?? edge.relationship}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
