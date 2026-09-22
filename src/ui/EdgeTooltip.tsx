import { useGraphStore } from '../store/useGraphStore';
import './EdgeTooltip.css';

export function EdgeTooltip() {
  const { dataset, hoveredEdgeId, hoveredEdgePosition } = useGraphStore();

  if (!hoveredEdgeId || !hoveredEdgePosition || !dataset) return null;

  const edge = dataset.edgeMap.get(hoveredEdgeId);
  if (!edge) return null;

  const sourceName = dataset.languageMap.get(edge.from_language)?.name || edge.from_language;
  const targetName = dataset.languageMap.get(edge.to_language)?.name || edge.to_language;
  const relationship = edge.relationship.replace(/_/g, ' ');
  const confidence = (edge.confidence * 100).toFixed(0);

  let timeRange = '';
  if (edge.start_year && edge.end_year) {
    timeRange = `${edge.start_year} - ${edge.end_year}`;
  } else if (edge.start_year) {
    timeRange = `${edge.start_year} - present`;
  }

  return (
    <div
      className="edge-tooltip"
      style={{
        left: hoveredEdgePosition.x + 12,
        top: hoveredEdgePosition.y - 10,
      }}
    >
      <div className="edge-tooltip-header">{sourceName}</div>
      <div className="edge-tooltip-relationship">{relationship}</div>
      <div className="edge-tooltip-header">{targetName}</div>
      <div className="edge-tooltip-meta">
        <span>Confidence: {confidence}%</span>
        {timeRange && <span>{timeRange}</span>}
      </div>
    </div>
  );
}
