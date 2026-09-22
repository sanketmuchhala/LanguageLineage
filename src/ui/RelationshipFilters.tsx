import type { RelationshipType } from '../data/types';
import { Toggle } from './Toggle';

interface RelationshipFiltersProps {
  filters: Record<RelationshipType, boolean>;
  onChange: (relationship: RelationshipType, enabled: boolean) => void;
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  compiler_written_in: 'Compiler written in',
  runtime_written_in: 'Runtime written in',
  bootstrap_written_in: 'Bootstrap written in',
  rewritten_in: 'Rewritten in',
  influenced: 'Influenced',
  influenced_by: 'Influenced by',
  transpiled_to: 'Transpiled to',
};

export function RelationshipFilters({ filters, onChange }: RelationshipFiltersProps) {
  return (
    <div className="relationship-filters">
      <h3>Relationship Types</h3>
      {(Object.keys(filters) as RelationshipType[]).map((relationship) => (
        <Toggle
          key={relationship}
          label={RELATIONSHIP_LABELS[relationship]}
          checked={filters[relationship]}
          onChange={(checked) => onChange(relationship, checked)}
        />
      ))}
    </div>
  );
}
