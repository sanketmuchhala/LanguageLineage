import { useGraphStoreV6 } from '../store/useGraphStoreV6';
import './EdgeTooltip.css';

export function EdgeTooltip() {
  const { dataset, hoveredEdgeId, hoveredEdgePosition } = useGraphStoreV6();

  if (!hoveredEdgeId || !hoveredEdgePosition || !dataset) return null;

  const edge = dataset.relationshipMap.get(hoveredEdgeId);
  if (!edge) return null;

  const sourceName = dataset.entityMap.get(edge.from)?.name || edge.from;
  const targetName = dataset.entityMap.get(edge.to)?.name || edge.to;
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
