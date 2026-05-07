# Programming Language Lineage Graph

An interactive graph visualization mapping the lineage, influence, and implementation relationships between 112 programming languages, from Machine Code (year 0) to Zig (2023).

## Live Demo

[View Live Visualization](#) (Update with deployment URL)

## Overview

This project visualizes how programming languages are connected through compiler chains, runtime dependencies, influence relationships, and bootstrapping paths. The dataset (v4) covers 112 languages and 300 relationships, each backed by evidence sources and confidence scores.

### What You Can Explore

- How C underpins nearly everything (41 connections, the most connected node)
- The Go 1.5 bootstrap: C compiler to self-hosting Go compiler (2015)
- Rust's path: OCaml to C to self-hosting Rust via staged bootstrapping
- How Lisp (1958) influenced 12 languages with zero incoming edges
- JavaScript engine diversity: V8, SpiderMonkey, JavaScriptCore, all written in C++
- The JVM ecosystem: Java, Kotlin, Scala, Clojure, Groovy sharing a runtime

## Architecture

```
ProgrammingLanguageGraph/
├── src/
│   ├── app/                        App shell and CSS
│   │   ├── App.tsx                 Root component, loads/validates/normalizes dataset
│   │   └── App.css
│   ├── data/                       Data pipeline
│   │   ├── types.ts                TypeScript types (languages, edges, filters, Cytoscape elements)
│   │   ├── loadDataset.ts          Fetch dataset JSON by version (v1/v2/v4)
│   │   ├── validateDataset.ts      Integrity checks (duplicates, dangling refs, confidence)
│   │   ├── normalizeDataset.ts     Compute degrees, assign clusters, build lookup maps
│   │   └── indexDataset.ts         Build search index for fast lookups
│   ├── graph/                      Cytoscape.js rendering
│   │   ├── GraphView.tsx           Cytoscape container and lifecycle management
│   │   ├── buildElements.ts        Filter to Cytoscape element conversion
│   │   ├── style.ts                Node/edge styles, cluster colors, relationship colors
│   │   ├── layouts.ts              DAG (tree) and force-directed layout configs
│   │   ├── cytoscapeConfig.ts      Cytoscape core settings
│   │   └── selectors.ts            Cytoscape selector helpers
│   ├── store/                      State management
│   │   └── useGraphStore.ts        Zustand store (dataset, filters, selection, Cytoscape ref)
│   ├── ui/                         UI components
│   │   ├── MinimalPanel.tsx        Floating control panel (layout, search, filters)
│   │   ├── SideDrawer.tsx          Node/edge detail drawer
│   │   ├── YearsPanel.tsx          Timeline panel
│   │   ├── Legend.tsx              Color legend
│   │   ├── RelationshipFilters.tsx Edge type toggles
│   │   ├── SearchBox.tsx           Search input
│   │   ├── Slider.tsx              Confidence threshold slider
│   │   └── Toggle.tsx              Boolean toggle component
│   └── utils/                      Shared utilities
├── dataset/
│   ├── v1/                         28 languages, initial dataset
│   ├── v2/                         67 languages, 128 edges
│   ├── v3/                         71 languages, 169 edges
│   └── v4/                         112 languages, 300 edges (current)
│       └── lineage_v4.json
├── scripts/                        Dataset tooling
│   ├── schema.ts                   Zod validation schemas (15 language fields, 8 edge fields)
│   ├── analyzeDataset.ts           CLI analyzer (schema, integrity, metrics)
│   ├── addNewFields.ts             Helper: add null defaults for new fields
│   ├── enrichData.ts               Helper: populate high-confidence metadata
│   ├── fixMalformedEntries.ts      Helper: normalize inconsistent entries
│   └── future-work-plan.md         Planned enhancements (documentation only)
├── reports/                        Analysis outputs
│   ├── checkpoint-a-analysis.txt
│   └── checkpoint-b-analysis.txt
└── research/                       Reference PDFs
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Build | Vite 5 | Dev server, production bundling, HMR |
| UI | React 18 | Component rendering |
| Language | TypeScript 5 | Strict type safety across data pipeline |
| Graph | Cytoscape.js 3.28 | Graph rendering, layouts, interaction |
| Layout | cose-bilkent 4.1 | Force-directed layout algorithm |
| State | Zustand 4 | Lightweight store for filters, selection, Cytoscape ref |
| Validation | Zod 3.23 | Runtime schema validation for dataset tooling |
| Scripts | tsx 4.7 | TypeScript execution for scripts (no compilation step) |

## Dataset (v4)

### Scale

- 112 languages, from Machine Code and Assembly to Zig, V, and Gleam
- 300 relationships, each with confidence score and evidence source
- 15 fields per language (10 core + 5 enriched metadata fields)

### Language Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (e.g., `lang:rust`) |
| `name` | string | Display name |
| `first_release_year` | int | Year of first public release |
| `current_primary_implementation_language` | string | What the main compiler/interpreter is written in |
| `paradigm` | string[] | Programming paradigms (e.g., `["imperative", "functional"]`) |
| `typing` | string | Type system: `static`, `dynamic`, `gradual`, etc. |
| `runtime_model` | string | Execution model: `compiled`, `interpreted`, `jit`, `vm`, etc. |
| `self_hosting` | boolean | Whether the language compiles itself |
| `notes` | string or null | Historical context, caveats |
| `cluster_hint` | string | Visual grouping hint for graph layout |
| `company` | string or null | Creating company/org if unambiguous |
| `garbage_collected` | boolean or null | Automatic memory management |
| `logo_url` | null | Reserved for future use |
| `peak_year` | int or null | Year of historically documented peak popularity |
| `current_users_estimate` | enum or null | `niche` / `moderate` / `large` / `dominant` |

### Relationship Types

| Type | Count | Color | Description |
|------|-------|-------|-------------|
| `influenced` | 189 | Muted yellow | Language A influenced the design of language B |
| `compiler_written_in` | 54 | Muted red | Language A's compiler is written in language B |
| `runtime_written_in` | 38 | Muted blue | Language A's runtime is written in language B |
| `bootstrap_written_in` | 9 | Muted green | Bootstrap binary seed relationship |
| `transpiled_to` | 8 | Muted purple | Language A compiles to language B |
| `rewritten_in` | 2 | Muted orange | Implementation rewritten from one language to another |
| `influenced_by` | 0 | Muted yellow | Reverse influence (schema supports it, no auto-created edges) |

Each relationship includes: `start_year`, `end_year`, `confidence` (0.0-1.0), `evidence_source` (URL), and `notes`.

### Cluster Distribution

| Cluster | Count | Description |
|---------|-------|-------------|
| other | 41 | General purpose, uncategorized |
| tools | 14 | Build tools, analyzers, linters |
| systems | 13 | Systems programming (C, Rust, Zig, Go) |
| functional | 13 | Functional languages (Haskell, OCaml, Elm) |
| historical | 9 | Pre-1970 languages (COBOL, ALGOL, Fortran) |
| dynamic | 9 | Dynamic/scripting (Python, Ruby, JavaScript) |
| jvm | 5 | JVM ecosystem (Java, Kotlin, Scala) |
| scientific | 3 | Scientific computing (R, MATLAB, Julia) |
| clr | 3 | .NET/CLR ecosystem (C#, F#) |
| roots | 2 | Machine Code, Assembly |

### Graph Metrics

From the dataset analyzer:

- Most connected: C (41), Python (27), C++ (23), Rust (20), Haskell (19)
- Connected components: 1 (fully connected graph)
- Self-loops: 28 (self-hosting languages)
- Isolated nodes: 0

## Data Pipeline

```
loadDataset          Fetch JSON by version
    |
validateDataset      Check integrity (duplicates, dangling refs, confidence)
    |
normalizeDataset     Compute degrees, assign clusters, build lookup maps
    |
indexDataset         Build search index
    |
buildCytoscapeElements   Apply filters, convert to Cytoscape nodes/edges
    |
GraphView            Render with Cytoscape.js
```

### Validation Checks (runtime)

- Duplicate language IDs
- Dangling edge references (edges pointing to nonexistent languages)
- Missing required fields on nodes and edges
- Low-confidence edges (below 0.8) flagged as warnings

### Schema Validation (scripts)

The `scripts/analyzeDataset.ts` tool runs comprehensive validation:

- Zod schema validation (all 15 language fields, all 8 edge fields)
- Integrity: duplicates, unresolved refs, duplicate edges, circular bootstrap chains
- Historical logic: start_year must be >= release year, end_year must be >= start_year
- Graph metrics: degree distribution, connected components, top 10 nodes

```bash
npm run analyze:v4
```

## Quick Start

```bash
git clone https://github.com/sanketmuchhala/ProgrammingLanguageGraph.git
cd ProgrammingLanguageGraph

npm install

# Development server
npm run dev

# Production build
npm run build

# Type check
npm run type-check

# Run dataset analyzer
npm run analyze:v4
```

## Controls

### Layout Modes

- **Tree (DAG)**: Hierarchical top-down layout, good for seeing lineage chains
- **Network (Force)**: Organic clustering, shows communities and influence patterns

### Filters

- **Search**: Filter by language name or ID
- **Confidence Threshold**: Slider from 0.00 to 1.00, hides uncertain edges
- **Relationship Types**: Toggle each of the 7 edge types independently
- **Self-Loops**: Show or hide self-hosting edges (e.g., Rust to Rust)
- **Cluster Coloring**: Color nodes by language family
- **Labels**: Show or hide node labels

### Interaction

- Click a node to open the detail drawer with metadata and connections
- Click an edge to see relationship details, evidence source, and confidence
- Drag to pan the graph
- Scroll to zoom
- Type in the search box to highlight matching nodes

## Dataset Versioning

| Version | Languages | Edges | Key Changes |
|---------|-----------|-------|-------------|
| v1 | 28 | ~50 | Initial dataset, compilers and runtimes only |
| v2 | 67 | 128 | Extended with more languages, implementations array |
| v3 | 71 | 169 | Added influence relationships |
| v4 | 112 | 300 | Full enrichment: 5 new metadata fields, influence edges, 41 data fixes |

The app loads v4 by default. Previous versions remain available in `dataset/`.

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `analyze` | `npm run analyze` | Run dataset analyzer on default path |
| `analyze:v4` | `npm run analyze:v4` | Run analyzer on v4 dataset |

### Helper Scripts

These were used during the v4 enrichment process and are kept for reference:

- `schema.ts` - Zod schemas with all enums and field definitions
- `analyzeDataset.ts` - Full dataset validation and graph metrics
- `addNewFields.ts` - Adds 5 null fields to all languages
- `enrichData.ts` - Populates high-confidence metadata values
- `fixMalformedEntries.ts` - Normalizes inconsistent entries from v4 source data
- `future-work-plan.md` - Planned enhancements (logo URLs, popularity metrics, export formats, timeline view, new edge types)

## Notable Relationships

- **C to Go Bootstrap (2009-2014)**: Go's compiler was written in C, then rewritten in Go for v1.5
- **Rust Bootstrap**: OCaml (rustboot) to C++ (LLVM) to self-hosting Rust via staged builds
- **Swift**: C++/Swift hybrid compiler with SwiftCompilerSources
- **TypeScript to JavaScript**: Transpilation relationship (TypeScript compiles to JS)
- **Lisp's Influence**: 12 outgoing influence edges, 0 incoming
- **C's Dominance**: 41 total connections (33 outgoing), foundation of modern computing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with evidence sources
4. Run `npm run analyze:v4` to validate
5. Submit a pull request

### Data Contributions

- All new relationships must include `evidence_source` (URL)
- Confidence scores required (1.0 = primary source, 0.8+ preferred)
- Prefer null over guessing for enriched fields
- Run the analyzer before submitting. Schema and integrity must pass.

## License

MIT License. See [LICENSE](LICENSE) for details.
