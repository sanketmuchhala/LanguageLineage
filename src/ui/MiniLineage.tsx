import { useMemo } from 'react';
import type { NormalizedEntity, NormalizedRelationship } from '../data/types_v6';

interface MiniLineageProps {
  entity: NormalizedEntity;
  incomingEdges: NormalizedRelationship[];
  outgoingEdges: NormalizedRelationship[];
  entityMap: Map<string, NormalizedEntity>;
}

export function MiniLineage({ entity, incomingEdges, outgoingEdges, entityMap }: MiniLineageProps) {
  // Ancestors are those that influenced or from which this was implemented
  const ancestors = useMemo(() => {
    return incomingEdges
      .map(e => entityMap.get(e.from))
      .filter((e): e is NormalizedEntity => !!e);
  }, [incomingEdges, entityMap]);

  // Descendants are those influenced by or implemented in this
  const descendants = useMemo(() => {
    return outgoingEdges
      .map(e => entityMap.get(e.to))
      .filter((e): e is NormalizedEntity => !!e);
  }, [outgoingEdges, entityMap]);

  if (ancestors.length === 0 && descendants.length === 0) return null;

  return (
    <div className="mini-lineage">
      <h3 className="drawer-subtitle">Mini Lineage</h3>
      <div className="mini-lineage-container">

        {ancestors.length > 0 && (
          <div className="mini-lineage-tier">
            <span className="tier-label">Ancestors</span>
            <div className="tier-nodes">
              {ancestors.slice(0, 5).map(a => (
                <div key={a.id} className="mini-node ancestor-node">{a.name}</div>
              ))}
              {ancestors.length > 5 && <div className="mini-node-more">+{ancestors.length - 5}</div>}
            </div>
          </div>
        )}

        {ancestors.length > 0 && <div className="mini-lineage-arrow">↓</div>}

        <div className="mini-lineage-tier current-tier">
            <div className="mini-node current-node">{entity.name}</div>
        </div>

        {descendants.length > 0 && <div className="mini-lineage-arrow">↓</div>}

        {descendants.length > 0 && (
          <div className="mini-lineage-tier">
            <span className="tier-label">Descendants</span>
            <div className="tier-nodes">
              {descendants.slice(0, 5).map(d => (
                <div key={d.id} className="mini-node descendant-node">{d.name}</div>
              ))}
              {descendants.length > 5 && <div className="mini-node-more">+{descendants.length - 5}</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
