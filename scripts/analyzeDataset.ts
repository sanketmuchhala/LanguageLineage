import fs from 'fs';
import { DatasetSchema, type Dataset, type Language, type Relationship } from './schema.js';

function main() {
  // Get dataset path from command line args
  const datasetPath = process.argv[2] || 'dataset/v4/lineage_v4.json';

  console.log('='.repeat(80));
  console.log('DATASET ANALYSIS REPORT');
  console.log('='.repeat(80));
  console.log(`\nDataset: ${datasetPath}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // Read and parse dataset
  const rawData = fs.readFileSync(datasetPath, 'utf-8');
  const data = JSON.parse(rawData);

  // 1. SCHEMA VALIDATION
  console.log('─'.repeat(80));
  console.log('1. SCHEMA VALIDATION');
  console.log('─'.repeat(80));

  const result = DatasetSchema.safeParse(data);
  if (!result.success) {
    console.log('❌ SCHEMA VALIDATION FAILED\n');
    console.log('Validation Errors:');
    result.error.issues.forEach((issue, idx) => {
      console.log(`\n  Error ${idx + 1}:`);
      console.log(`    Path: ${issue.path.join(' → ')}`);
      console.log(`    Message: ${issue.message}`);
      if (issue.code === 'invalid_union') {
        console.log(`    Details: Expected one of the allowed values`);
      }
    });
    console.log('\n');
  } else {
    console.log('✅ Schema validation PASSED\n');
  }

  // Continue with analysis even if schema validation fails
  const dataset = data as Dataset;

  // 2. INTEGRITY CHECKS
  console.log('─'.repeat(80));
  console.log('2. INTEGRITY CHECKS');
  console.log('─'.repeat(80));

  let integrityErrors = 0;

  // Check for duplicate language IDs
  const languageIds = new Set<string>();
  const duplicateIds: string[] = [];
  dataset.languages.forEach((lang) => {
    if (languageIds.has(lang.id)) {
      duplicateIds.push(lang.id);
    }
    languageIds.add(lang.id);
  });

  if (duplicateIds.length > 0) {
    console.log('❌ Duplicate language IDs found:');
    duplicateIds.forEach((id) => console.log(`  - ${id}`));
    integrityErrors += duplicateIds.length;
  } else {
    console.log('✅ No duplicate language IDs');
  }

  // Check for unresolved relationship references
  const unresolvedRefs: string[] = [];
  dataset.relationships.forEach((rel) => {
    if (!languageIds.has(rel.from_language)) {
      unresolvedRefs.push(`${rel.from_language} (from)`);
    }
    if (!languageIds.has(rel.to_language)) {
      unresolvedRefs.push(`${rel.to_language} (to)`);
    }
  });

  if (unresolvedRefs.length > 0) {
    console.log('❌ Unresolved relationship references:');
    unresolvedRefs.forEach((ref) => console.log(`  - ${ref}`));
    integrityErrors += unresolvedRefs.length;
  } else {
    console.log('✅ All relationship references resolved');
  }

  // Check for duplicate edges
  const edgeKeys = new Set<string>();
  const duplicateEdges: string[] = [];
  dataset.relationships.forEach((rel) => {
    const key = `${rel.from_language}→${rel.to_language}→${rel.relationship}`;
    if (edgeKeys.has(key)) {
      duplicateEdges.push(key);
    }
    edgeKeys.add(key);
  });

  if (duplicateEdges.length > 0) {
    console.log('❌ Duplicate edges found:');
    duplicateEdges.forEach((edge) => console.log(`  - ${edge}`));
    integrityErrors += duplicateEdges.length;
  } else {
    console.log('✅ No duplicate edges');
  }

  // Check for circular bootstrap chains
  const bootstrapEdges = new Map<string, string[]>();
  dataset.relationships.forEach((rel) => {
    if (rel.relationship === 'bootstrap_written_in') {
      if (!bootstrapEdges.has(rel.from_language)) {
        bootstrapEdges.set(rel.from_language, []);
      }
      bootstrapEdges.get(rel.from_language)!.push(rel.to_language);
    }
  });

  const circularChains: string[] = [];
  function detectCycle(node: string, visited: Set<string>, path: string[]): boolean {
    if (path.includes(node)) {
      const cycleStart = path.indexOf(node);
      circularChains.push(path.slice(cycleStart).concat(node).join(' → '));
      return true;
    }
    if (visited.has(node)) return false;

    visited.add(node);
    path.push(node);

    const neighbors = bootstrapEdges.get(node) || [];
    for (const neighbor of neighbors) {
      detectCycle(neighbor, visited, path);
    }

    path.pop();
    return false;
  }

  const visited = new Set<string>();
  bootstrapEdges.forEach((_, node) => {
    if (!visited.has(node)) {
      detectCycle(node, visited, []);
    }
  });

  if (circularChains.length > 0) {
    console.log('❌ Circular bootstrap chains detected:');
    circularChains.forEach((chain) => console.log(`  - ${chain}`));
    integrityErrors += circularChains.length;
  } else {
    console.log('✅ No circular bootstrap chains');
  }

  console.log(`\nTotal integrity errors: ${integrityErrors}\n`);

  // 3. HISTORICAL LOGIC
  console.log('─'.repeat(80));
  console.log('3. HISTORICAL LOGIC VALIDATION');
  console.log('─'.repeat(80));

  const languageMap = new Map<string, Language>();
  dataset.languages.forEach((lang) => languageMap.set(lang.id, lang));

  let historicalErrors = 0;
  const historicalIssues: string[] = [];

  dataset.relationships.forEach((rel) => {
    const fromLang = languageMap.get(rel.from_language);
    const toLang = languageMap.get(rel.to_language);

    // Check start_year >= language release year
    if (fromLang && rel.start_year !== null && rel.start_year < fromLang.first_release_year) {
      historicalIssues.push(
        `${rel.from_language}: start_year (${rel.start_year}) < release year (${fromLang.first_release_year})`
      );
      historicalErrors++;
    }

    // Check end_year >= start_year
    if (rel.start_year !== null && rel.end_year !== null && rel.end_year < rel.start_year) {
      historicalIssues.push(
        `${rel.from_language} → ${rel.to_language}: end_year (${rel.end_year}) < start_year (${rel.start_year})`
      );
      historicalErrors++;
    }
  });

  if (historicalIssues.length > 0) {
    console.log('❌ Historical logic errors:');
    historicalIssues.forEach((issue) => console.log(`  - ${issue}`));
  } else {
    console.log('✅ All historical logic valid');
  }

  console.log(`\nTotal historical errors: ${historicalErrors}\n`);

  // 4. GRAPH METRICS (excluding self-loops)
  console.log('─'.repeat(80));
  console.log('4. GRAPH METRICS');
  console.log('─'.repeat(80));

  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  // Initialize all nodes with 0 degree
  dataset.languages.forEach((lang) => {
    inDegree.set(lang.id, 0);
    outDegree.set(lang.id, 0);
  });

  // Count degrees (excluding self-loops)
  dataset.relationships.forEach((rel) => {
    if (rel.from_language !== rel.to_language) {
      outDegree.set(rel.from_language, (outDegree.get(rel.from_language) || 0) + 1);
      inDegree.set(rel.to_language, (inDegree.get(rel.to_language) || 0) + 1);
    }
  });

  // Calculate total degree
  const totalDegree = new Map<string, number>();
  dataset.languages.forEach((lang) => {
    const total = (inDegree.get(lang.id) || 0) + (outDegree.get(lang.id) || 0);
    totalDegree.set(lang.id, total);
  });

  // Top 10 most connected languages
  const sorted = Array.from(totalDegree.entries()).sort((a, b) => b[1] - a[1]);
  console.log('Top 10 Most Connected Languages (by total degree):');
  sorted.slice(0, 10).forEach(([id, degree], idx) => {
    const lang = languageMap.get(id);
    const inD = inDegree.get(id) || 0;
    const outD = outDegree.get(id) || 0;
    console.log(`  ${idx + 1}. ${lang?.name} (${id})`);
    console.log(`     Total: ${degree} (in: ${inD}, out: ${outD})`);
  });

  // Connected components (undirected graph)
  const adj = new Map<string, Set<string>>();
  dataset.languages.forEach((lang) => {
    adj.set(lang.id, new Set());
  });

  dataset.relationships.forEach((rel) => {
    if (rel.from_language !== rel.to_language) {
      adj.get(rel.from_language)?.add(rel.to_language);
      adj.get(rel.to_language)?.add(rel.from_language);
    }
  });

  const componentVisited = new Set<string>();
  let componentCount = 0;
  const components: string[][] = [];

  function dfsComponent(node: string, component: string[]) {
    componentVisited.add(node);
    component.push(node);
    adj.get(node)?.forEach((neighbor) => {
      if (!componentVisited.has(neighbor)) {
        dfsComponent(neighbor, component);
      }
    });
  }

  dataset.languages.forEach((lang) => {
    if (!componentVisited.has(lang.id)) {
      const component: string[] = [];
      dfsComponent(lang.id, component);
      components.push(component);
      componentCount++;
    }
  });

  console.log(`\nConnected Components: ${componentCount}`);
  components.forEach((comp, idx) => {
    if (comp.length === 1) {
      const lang = languageMap.get(comp[0]);
      console.log(`  Component ${idx + 1}: ${comp.length} node (isolated) - ${lang?.name}`);
    } else if (comp.length <= 5) {
      console.log(`  Component ${idx + 1}: ${comp.length} nodes`);
      comp.forEach((id) => {
        const lang = languageMap.get(id);
        console.log(`    - ${lang?.name} (${id})`);
      });
    } else {
      console.log(`  Component ${idx + 1}: ${comp.length} nodes (${comp[0]}, ...)`);
    }
  });

  // Summary statistics
  console.log('\n' + '─'.repeat(80));
  console.log('5. SUMMARY STATISTICS');
  console.log('─'.repeat(80));
  console.log(`Languages: ${dataset.languages.length}`);
  console.log(`Relationships: ${dataset.relationships.length}`);
  const selfLoops = dataset.relationships.filter((r) => r.from_language === r.to_language).length;
  console.log(`Self-loops: ${selfLoops}`);
  console.log(`Connected components: ${componentCount}`);
  console.log(`Isolated nodes: ${components.filter((c) => c.length === 1).length}`);

  console.log('\n' + '='.repeat(80));
  console.log('END OF REPORT');
  console.log('='.repeat(80) + '\n');
}

// Run the analyzer
try {
  main();
  process.exit(0); // Always exit with 0 unless script crashes
} catch (error) {
  console.error('FATAL ERROR:', error);
  process.exit(1); // Only exit with 1 if the script crashes
}
