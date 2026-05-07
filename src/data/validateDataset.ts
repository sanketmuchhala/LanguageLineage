import type { RawDataset, ValidationReport } from './types';

export function validateDataset(dataset: RawDataset): ValidationReport {
  // Support both v2 (edges) and v4 (relationships)
  const edges = dataset.relationships || dataset.edges || [];

  const report: ValidationReport = {
    missing_nodes_referenced_by_edges: [],
    duplicate_ids: [],
    edges_with_missing_fields: [],
    nodes_with_missing_fields: [],
    edges_confidence_lt_0_8: [],
    summary: {
      total_languages: dataset.languages.length,
      total_edges: edges.length,
      valid_edges: edges.length,
      warnings: 0,
    },
  };

  // Build set of valid language IDs
  const languageIds = new Set(dataset.languages.map((lang) => lang.id));
  const seenIds = new Set<string>();

  // Check for duplicate language IDs
  for (const lang of dataset.languages) {
    if (seenIds.has(lang.id)) {
      report.duplicate_ids.push(lang.id);
    }
    seenIds.add(lang.id);

    // Check for missing required fields
    if (!lang.id || !lang.name || lang.first_release_year === undefined) {
      report.nodes_with_missing_fields.push(lang);
    }
  }

  // Validate edges
  for (const edge of edges) {
    // Check for missing nodes
    if (!languageIds.has(edge.from_language)) {
      if (!report.missing_nodes_referenced_by_edges.includes(edge.from_language)) {
        report.missing_nodes_referenced_by_edges.push(edge.from_language);
      }
    }
    if (!languageIds.has(edge.to_language)) {
      if (!report.missing_nodes_referenced_by_edges.includes(edge.to_language)) {
        report.missing_nodes_referenced_by_edges.push(edge.to_language);
      }
    }

    // Check for missing required fields
    if (
      !edge.from_language ||
      !edge.to_language ||
      !edge.relationship ||
      edge.start_year === undefined ||
      edge.confidence === undefined
    ) {
      report.edges_with_missing_fields.push(edge);
    }

    // Check confidence threshold
    if (edge.confidence < 0.8) {
      report.edges_confidence_lt_0_8.push({
        from_language: edge.from_language,
        to_language: edge.to_language,
        confidence: edge.confidence,
      });
    }
  }

  // Calculate warnings
  report.summary.warnings =
    report.missing_nodes_referenced_by_edges.length +
    report.duplicate_ids.length +
    report.edges_with_missing_fields.length +
    report.nodes_with_missing_fields.length +
    report.edges_confidence_lt_0_8.length;

  // Log report to console
  if (report.summary.warnings > 0) {
    console.warn('Validation Report:', report);
  } else {
    console.log('✅ Dataset validation passed with no warnings');
  }

  return report;
}
