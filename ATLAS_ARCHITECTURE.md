# Programming Language Atlas Architecture (v6)

## Current State (v6)
The project is a comprehensive "Programming Language Atlas", distinguishing between languages, compilers, runtimes, VMs, AI frameworks, and compiler infrastructure.

### 1. Schema & Dataset Structure
- **EntitySchema**: Replaces `LanguageSchema`. Contains common fields (id, name, release_year, logo, etc.) and an `entity_type` field.
- **Entity Types**: `language`, `compiler`, `runtime`, `virtual_machine`, `toolchain`, `compiler_infrastructure`, `ai_framework`, `ai_compiler`, `gpu_runtime`.
- **RelationshipSchema**: Defines semantic relationships.
- **File Structure**:
  - `dataset/v6/entities.json`
  - `dataset/v6/relationships.json`

### 2. Relationship Semantics
- `compiler_written_in`: The compiler for Language A is written in Language B.
- `runtime_written_in`: The runtime environment or VM for Language A is written in Language B.
- `bootstrap_written_in`: Used specifically for tracing the bootstrap sequence (e.g., Rust's original OCaml compiler to the self-hosted Rust compiler).
- `influenced`: Language A conceptually influenced the design of Language B.
- `transpiled_to`: Source code in Language A translates into source code in Language B (e.g., TypeScript -> JavaScript).
- `compiles_to`: Source code compiles into bytecode, IR, or a lower-level format (e.g., Julia -> LLVM IR).
- `targets_runtime`: An entity specifically targets a runtime environment (e.g., PyTorch targets CUDA).
- `runs_on`: A framework or tool executes natively on top of a specific language or infrastructure (e.g., TensorFlow runs_on C++).

### 3. Conceptual Layers
The graph UI provides specific, user-selectable modes:
1. **Influence**: Conceptual influence and ancestry.
2. **Implementation**: Compiler, runtime, and VM implementation relationships.
3. **AI Ecosystem**: Relationships between languages, AI frameworks (PyTorch, TensorFlow), and compiler infrastructure (LLVM, MLIR).
4. **Bootstrap**: Historical execution paths for self-hosting.

### 4. User Interface
- **Mini-Lineage (DOM/SVG)**: Language detail pages feature a fast, DOM/CSS-based mini-lineage visualization (Ancestors -> Node -> Descendants) rather than a heavy Cytoscape instance.
- **Stories Mode**: Guided tours through historical narratives (`/stories`).
- **Bootstrap Explorer**: Dedicated page (`/bootstrap`) for exploring bootstrap sequences.

### 5. Adding New Entities/Relationships
- Add the entity to `dataset/v6/entities.json` with the correct `entity_type`.
- Add relationships to `dataset/v6/relationships.json`. Every relationship **must** include an `evidence_source` URL and a `confidence` score (0 to 1.0).
- Run `npm run analyze:v5` (which analyzes v6 using the updated scripts) to ensure schema validity before committing.
