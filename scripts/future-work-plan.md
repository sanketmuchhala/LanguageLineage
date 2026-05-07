# Future Work Plan: Dataset v4 Enhancements

This document outlines planned future enhancements for the Programming Language Graph dataset v4. These are documentation-only items that should NOT be implemented yet.

---

## Overview

Current state after enrichment:
- **Languages**: 112 nodes with 15 fields each
- **Relationships**: 300 edges with 8 fields each
- **New fields added**: company, garbage_collected, logo_url (null), peak_year, current_users_estimate
- **Schema validation**: Passing
- **Integrity checks**: Passing

---

## 1. Popularity Metrics 📊

### Goal
Add quantitative popularity data to track language adoption over time.

### Proposed New Fields
```typescript
{
  tiobe_rank: number | null,              // Current TIOBE Index ranking
  stackoverflow_tag_count: number | null, // Number of Stack Overflow questions
  redmonk_rank: number | null,            // RedMonk quarterly ranking
  github_stars_total: number | null,      // Total GitHub stars for language repos
  github_active_repos: number | null,     // Active repositories using the language
  popularity_trend: 'rising' | 'stable' | 'declining' | null
}
```

### Data Sources
- TIOBE Index API or web scraping (monthly updates)
- Stack Overflow Data Explorer (quarterly exports)
- RedMonk Language Rankings (bi-annual blog posts)
- GitHub API (search by language, aggregate metrics)
- Google Trends API (search volume over time)

### Implementation Notes
- Data collection should be automated with scheduled updates
- Historical snapshots should be versioned separately
- Combine multiple sources for `popularity_trend` calculation
- Add `last_updated` timestamp for each metric

### Priority
**Medium** - Valuable for researchers and decision-makers, but not critical for core graph functionality

---

## 2. Logo URL Collection 🎨

### Goal
Populate the `logo_url` field (currently null for all languages) with official language logos.

### Approach
1. **Wikipedia**: Many language articles have official logos in info boxes
2. **Official Websites**: Scrape from language homepages (respect robots.txt)
3. **GitHub**: Check official language organization repos for logos
4. **Manual Curation**: For edge cases, manually download and host logos

### Storage Strategy
- Host logos in `/public/logos/` directory (e.g., `/logos/python.svg`)
- Use SVG format when available (vector graphics scale better)
- Fallback to PNG (256x256px minimum)
- Store external URLs in dataset, not local file paths

### Quality Guidelines
- Only use official logos (no third-party redesigns)
- Ensure proper licensing (most language logos are CC-BY or open)
- Maintain consistent aspect ratios
- Add `logo_license` field to track attribution

### Implementation Notes
```typescript
{
  logo_url: string | null,           // URL to hosted logo image
  logo_source: string | null,        // Attribution/source URL
  logo_license: string | null        // e.g., "CC-BY-4.0", "MIT", "Public Domain"
}
```

### Priority
**High** - Significantly improves UI/UX in graph visualization

---

## 3. New Edge Types 🔗

### Goal
Expand relationship types beyond implementation relationships to capture semantic influences.

### Proposed New Relationship Types

#### `derived_from`
- **Description**: Language B is a direct derivative/dialect of language A
- **Examples**: TypeScript derived_from JavaScript, C++ derived_from C
- **Confidence**: High (well-documented)

#### `inspired_by`
- **Description**: Language B took significant design ideas from language A (softer than `influenced`)
- **Examples**: Python inspired_by ABC, Ruby inspired_by Smalltalk
- **Confidence**: Medium to High

#### `replaced_by`
- **Description**: Language A was superseded by language B in its primary domain
- **Examples**: Objective-C replaced_by Swift, Java Applets replaced_by JavaScript
- **Time-bound**: Must include `replacement_year`

#### `interoperates_with`
- **Description**: Languages designed to work together (e.g., FFI, language bridges)
- **Examples**: Python interoperates_with C, JavaScript interoperates_with WebAssembly
- **Bidirectional**: Often creates pairs

### Schema Updates
```typescript
enum RelationshipType {
  // Existing implementation types
  'influenced',
  'influenced_by',
  'compiler_written_in',
  'runtime_written_in',
  'bootstrap_written_in',
  'transpiled_to',
  'rewritten_in',

  // New semantic types
  'derived_from',
  'inspired_by',
  'replaced_by',
  'interoperates_with'
}
```

### Implementation Notes
- Avoid creating reverse edges automatically (especially for `inspired_by`)
- Add `semantic` boolean field to distinguish from implementation edges
- `replaced_by` should reference historical usage decline in notes
- Interop edges may need `mechanism` field (e.g., "FFI", "JNI", "WASM")

### Priority
**Low** - Nice to have, but significantly increases dataset complexity

---

## 4. Timeline Visualization 📅

### Goal
Add a vertical timeline view with years displayed on the side and languages positioned by their creation year.

### Visualization Features
- **Y-axis**: Years (1940s to present)
- **X-axis**: Clustered by paradigm/family
- **Node Size**: Proportional to current user base
- **Color Coding**: By cluster_hint or company
- **Hover**: Show year, name, and key facts
- **Filter**: By decade, paradigm, or company

### Technical Approach
- Use D3.js or Cytoscape.js time-series layout
- Implement zoom/pan for dense time periods (1990s-2010s)
- Add "jump to year" navigation
- Highlight relationships that span multiple decades

### Data Requirements
- `first_release_year` (already present)
- Optional: `last_stable_release_year` for dormant languages
- Optional: `peak_year` (already present, but needs more population)

### UI Components
- Vertical timeline sidebar with decade markers
- Minimap showing full timeline overview
- Year range slider for filtering

### Priority
**Medium-High** - Provides valuable historical context and improves user engagement

---

## 5. Export Formats 📦

### Goal
Enable users to export the dataset in multiple formats for research and analysis.

### Supported Formats

#### GraphML (.graphml)
- XML-based graph format
- Supported by Gephi, Cytoscape (desktop), yEd
- **Use case**: Network analysis, visualization in specialized tools

#### GEXF (.gexf)
- Graph Exchange XML Format
- Native format for Gephi
- Supports dynamic graphs (time-series)
- **Use case**: Social network analysis, temporal graph visualization

#### DOT (.dot)
- Graphviz format
- Plain text, human-readable
- **Use case**: Generating static graph images, documentation

#### CSV (nodes.csv + edges.csv)
- Two-file export
- **Use case**: Spreadsheet analysis, database import

#### SQLite (.db)
- Relational database with `languages` and `relationships` tables
- **Use case**: SQL queries, data science workflows

#### Neo4j (Cypher script)
- Generate CREATE statements for Neo4j graph database
- **Use case**: Graph database analysis, complex traversals

### Implementation
- Add export buttons to UI
- Server-side generation (Node.js scripts)
- Client-side generation for lightweight formats (CSV, JSON)
- Include README with field descriptions in each export

### Priority
**Low-Medium** - Useful for researchers, but not essential for core app

---

## 6. Additional Metadata 📝

### Goal
Enrich language nodes with more contextual information.

### Proposed Fields

#### `license`
- Type: `string | null`
- Examples: "MIT", "Apache-2.0", "GPL-3.0", "Proprietary"
- **Use case**: Understanding open-source vs. proprietary ecosystems

#### `standardized`
- Type: `boolean | null`
- Examples: C (ISO), JavaScript (ECMAScript), SQL (ANSI)
- **Use case**: Identifying languages with formal specifications

#### `official_website`
- Type: `string | null` (URL)
- **Use case**: Link to language homepage for more info

#### `repository_url`
- Type: `string | null` (URL)
- Examples: GitHub, GitLab, SourceForge
- **Use case**: Link to official language implementation repo

#### `creator_names`
- Type: `string[] | null`
- Examples: ["Dennis Ritchie"], ["Bjarne Stroustrup"], ["Guido van Rossum"]
- **Use case**: Attribution, historical context

#### `platform_targets`
- Type: `string[]` (e.g., ["Linux", "Windows", "macOS", "Web", "Mobile"])
- **Use case**: Understanding cross-platform vs. platform-specific languages

### Implementation Notes
- Many of these can be extracted from existing `notes` field
- Requires manual curation for accuracy
- Add validation rules (e.g., URL format for websites)

### Priority
**Low** - Nice to have, but requires significant manual effort

---

## 7. Relationship Metadata 🔍

### Goal
Add richer metadata to edges to capture relationship nuances.

### Proposed Edge Fields

#### `strength`
- Type: `'weak' | 'moderate' | 'strong'`
- **Description**: How significant the relationship is
- **Examples**:
  - `influenced` from Lisp → Python: "moderate" (functional concepts)
  - `compiler_written_in` C → C: "strong" (self-hosting)

#### `direct`
- Type: `boolean`
- **Description**: Is the relationship first-degree or indirect?
- **Examples**:
  - TypeScript → JavaScript: `true` (direct superset)
  - Rust → C++: `false` (indirect influence via systems programming)

#### `semantic`
- Type: `boolean`
- **Description**: Is this a semantic/design relationship (true) or implementation relationship (false)?
- **Examples**:
  - `influenced`: `true`
  - `compiler_written_in`: `false`

#### `runtime_compatible`
- Type: `boolean | null`
- **Description**: Can code from both languages run in the same runtime?
- **Examples**:
  - Kotlin ↔ Java: `true` (both run on JVM)
  - Python ↔ JavaScript: `false`

### Use Cases
- Filter graph to show only strong semantic influences
- Identify runtime ecosystems (JVM, .NET, Web)
- Weight graph algorithms by relationship strength

### Implementation Notes
- Requires domain expertise to populate accurately
- Start with subset of high-confidence edges
- May need separate validation pass

### Priority
**Low** - Adds analytical depth, but significantly increases dataset complexity

---

## Implementation Timeline

### Phase 1 (Immediate - Next Release)
1. ✅ Add 5 new language fields (company, garbage_collected, logo_url, peak_year, current_users_estimate)
2. 🔜 Logo URL Collection (High Priority)
3. 🔜 Timeline Visualization (Medium-High Priority)

### Phase 2 (3-6 Months)
4. Popularity Metrics (Medium Priority)
5. Export Formats (Low-Medium Priority)

### Phase 3 (6-12 Months)
6. New Edge Types (Low Priority)
7. Additional Metadata (Low Priority)
8. Relationship Metadata (Low Priority)

---

## Notes on Maintenance

- **Versioning**: Each major enhancement should increment dataset version (v5, v6, etc.)
- **Backwards Compatibility**: New fields should always accept `null` for older entries
- **Validation**: Extend Zod schema for each new field
- **Documentation**: Update dataset README and schema docs with each change
- **Testing**: Add integration tests to validate dataset integrity after updates

---

## Contact

For questions or suggestions about future enhancements, please open an issue on GitHub.

Last updated: 2026-03-06
