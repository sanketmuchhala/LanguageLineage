# Dataset SEO Analysis — Programming Language Graph v4

Generated: 2026-05-07
Dataset: `dataset/v4/lineage_v4.json`

---

## 1. Dataset Overview

| Metric | Value |
|--------|-------|
| Total language/tool nodes | 112 |
| Language nodes (lang:*) | 98 |
| Tool/runtime/compiler nodes (tool:*) | 14 |
| Total relationships | 347 |
| Evidence source coverage | 347 / 347 (100%) |
| Date range | ~1949 (Assembly) to 2023 (Mojo) |

---

## 2. Relationship Type Breakdown

| Relationship Type | Count | % of Total |
|-------------------|-------|------------|
| influenced | 189 | 54.5% |
| compiler_written_in | 78 | 22.5% |
| runtime_written_in | 56 | 16.1% |
| bootstrap_written_in | 14 | 4.0% |
| transpiled_to | 8 | 2.3% |
| rewritten_in | 2 | 0.6% |
| **Total** | **347** | **100%** |

---

## 3. Top 20 Languages by Total Relationships

(Counted as source OR target across all relationship types)

| Rank | Language | First Release | Total Relationships |
|------|----------|---------------|---------------------|
| 1 | C | 1972 | 64 |
| 2 | Python | 1991 | 28 |
| 3 | C++ | 1983 | 27 |
| 4 | Haskell | 1990 | 23 |
| 5 | Rust | 2015 | 23 |
| 6 | Go | 2009 | 19 |
| 7 | Java | 1995 | 18 |
| 8 | JavaScript | 1995 | 16 |
| 9 | Pascal | 1970 | 14 |
| 10 | Lisp | 1958 | 14 |
| 11 | Ruby | 1995 | 13 |
| 12 | Julia | 2012 | 13 |
| 13 | Smalltalk | 1972 | 12 |
| 14 | Assembly | 1949 | 12 |
| 15 | Swift | 2014 | 11 |
| 16 | Fortran | 1957 | 11 |
| 17 | Erlang | 1986 | 10 |
| 18 | C# | 2000 | 10 |
| 19 | OCaml | 1996 | 10 |
| 20 | TypeScript | 2012 | 9 |

---

## 4. Top 15 Languages by Outgoing "Influenced" Edges

(How many languages each language directly influenced)

| Rank | Language | Outgoing Influenced Edges |
|------|----------|--------------------------|
| 1 | Lisp | 12 |
| 1 | Haskell | 12 |
| 1 | C | 12 |
| 1 | Python | 12 |
| 5 | Smalltalk | 10 |
| 6 | Pascal | 8 |
| 6 | Java | 8 |
| 8 | Scheme | 6 |
| 8 | ML | 6 |
| 8 | Ruby | 6 |
| 8 | Fortran | 6 |
| 12 | ALGOL | 5 |
| 13 | C++ | 4 |
| 13 | JavaScript | 4 |
| 13 | Rust | 4 |

---

## 5. Self-Hosting Languages (compiler_written_in where from == to)

26 languages in the dataset are self-hosting (their compiler is written in themselves):

| Language | Self-Host Confidence |
|----------|---------------------|
| Haskell | 0.98 |
| Rust | 0.98 |
| Go | 0.98 |
| TypeScript | 0.98 |
| OCaml | 0.98 |
| Java | 0.95 |
| Erlang | 0.95 |
| Kotlin | 0.95 |
| C# | 0.95 |
| Crystal | 0.95 |
| Nim | 0.95 |
| Zig | 0.95 |
| Scala | 0.95 |
| Common Lisp | 0.95 |
| C++ | 0.95 |
| Elixir | 0.92 |
| F# | 0.92 |
| Standard ML | 0.90 |
| Pascal | 0.90 |
| Swift | 0.90 |
| Racket | 0.90 |
| Ada | 0.90 |
| D | 0.90 |
| CoffeeScript | 0.90 |
| Fortran | 0.85 |
| Julia | 0.85 |

---

## 6. Bootstrap Written-In Relationships

Languages that were bootstrapped from a different earlier language:

| Language | Bootstrapped From | Confidence |
|----------|-------------------|------------|
| B | BCPL | 0.90 |
| C | B | 0.85 |
| F# | OCaml | 0.90 |
| Crystal | Ruby | 0.92 |
| Elixir | Erlang | 0.92 |
| Rust | Machine Code | 0.88 |
| Swift | Machine Code | 0.80 |
| Julia | FemtoLisp | 0.90 |
| GHC | Lazy ML | 0.95 |
| Oberon | Modula-2 | 0.90 |
| Free Pascal | Pascal | 0.90 |
| Delphi | Pascal | 0.90 |
| Mercury | Prolog | 0.90 |
| Idris | Haskell | 0.90 |

---

## 7. Transpiled-To Relationships

| Source Language | Transpiles To | Confidence |
|----------------|---------------|------------|
| CoffeeScript | JavaScript | 0.98 |
| Elm | JavaScript | 0.98 |
| PureScript | JavaScript | 0.98 |
| ReasonML | JavaScript | 0.90 |
| Dart | JavaScript | 0.90 |
| Nim | C | 0.95 |
| V | C | 0.95 |
| Nim | JavaScript | 0.85 |

---

## 8. Rewritten-In Relationships

| From | To | Confidence | Notes |
|------|----|------------|-------|
| Go | TypeScript | 0.95 | TypeScript 7.0 compiler rewritten in Go for 10x speedup |
| Zig | Zig | 0.95 | Zig compiler rewritten from C++ to Zig (self-hosting) |

---

## 9. Tool/Compiler/Runtime Nodes

14 tool nodes are in the dataset (named `tool:*`):

| Tool | Year | Role |
|------|------|------|
| Chez Scheme | 1985 | Scheme runtime |
| BEAM VM | 1986 | Erlang/Elixir runtime |
| GCC | 1987 | C/C++ compiler |
| GHC | 1992 | Haskell compiler |
| SpiderMonkey | 1996 | JavaScript engine (Firefox) |
| HotSpot JVM | 1999 | Java runtime |
| JavaScriptCore | 2001 | JavaScript engine (WebKit/Safari) |
| .NET Runtime | 2002 | C#/VB.NET/F# runtime |
| LLVM | 2003 | Compiler infrastructure |
| Clang | 2007 | C/C++/Obj-C compiler frontend |
| V8 | 2008 | JavaScript engine (Chrome/Node) |
| FemtoLisp | 2009 | Lisp used to bootstrap Julia |
| Roslyn | 2014 | C# compiler platform |
| mrustc | 2016 | Rust compiler written in C++ |

---

## 10. Runtime Written-In Relationships (by implementation language)

**C** implements the most runtimes (31 languages):
Perl, Lua, Python, PHP, Ruby, R, OCaml, Haskell, BEAM VM, JavaScript, JavaScriptCore, .NET Runtime, GHC, Julia, Erlang, Cython, Bash, APL, Smalltalk, ML, Scheme, S, AWK, Bourne Shell, MATLAB, ABC, Tcl, J, Dylan, GNU Guile, LuaJIT, Pharo

**C++** implements: V8, SpiderMonkey, JavaScriptCore, HotSpot JVM, .NET Runtime, Dart, Julia, Self

**Assembly** implements: Go, OCaml, JavaScriptCore, .NET Runtime

**Erlang** implements: BEAM VM, Elixir

**LLVM** implements: Julia

---

## 11. Evidence Source Coverage

| Metric | Value |
|--------|-------|
| Relationships with evidence_source | 347 |
| Relationships missing evidence_source | 0 |
| Coverage percentage | 100.0% |

All 347 relationships have a documented evidence source (Wikipedia links, official documentation, etc.).

---

## 12. Low Confidence Records (confidence < 0.8)

5 relationships have confidence below 0.8:

| From | To | Type | Confidence | Notes |
|------|----|------|------------|-------|
| Scheme | Elixir | influenced | 0.75 | Partial influence via macro system design |
| Haskell | CoffeeScript | influenced | 0.70 | Partial influence, lower confidence |
| Pascal | D | influenced | 0.75 | Pascal influenced D's module system |
| Ruby | D | influenced | 0.75 | D influenced by Ruby's expressiveness |
| Objective-C | C++ | influenced | 0.75 | Minor influence on C++ OOP model |

All 5 low-confidence records are `influenced` relationships. All implementation relationships (compiler_written_in, runtime_written_in, bootstrap_written_in) have confidence >= 0.8.

---

## 13. Languages With No Implementation Relationships

Every language/tool node in the dataset appears in at least one implementation relationship (compiler_written_in, runtime_written_in, bootstrap_written_in, rewritten_in, or transpiled_to). No nodes are isolated from implementation context.

---

## 14. Compiler Written-In Summary

**Languages that compile other languages:**

| Compiler Language | Compiles |
|-------------------|---------|
| C | Go, Rust, GCC, Swift, Icon, Miranda, Newsqueak, Modula-3, Alef, Limbo, Fortran 95, Cyclone |
| C++ | C++, LLVM, Clang, GCC, mrustc, Swift, Carbon, Mojo, Zig, Objective-C |
| Assembly | FLOW-MATIC, COMTRAN, ALGOL, Lisp, COBOL, PL/I, ALGOL 68, CLU |
| Haskell | Haskell, Elm, PureScript, GHC, Agda |
| Java | Java, Kotlin, Clojure, Groovy |
| LLVM | Swift, Rust, Crystal, Zig, Mojo |
| OCaml | Rust, OCaml |
| TypeScript | TypeScript, Angular |
| Rust | Rust, Gleam |
| Python | mypy |
| Ruby | Crystal |
| Oberon | Oberon-2 |
| Fortran | Prolog |
