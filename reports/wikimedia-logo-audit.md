# Wikimedia Logo Audit

Policy: deterministic curated title/QID mapping, Wikidata P154 only, Commons URLs only. P18 representative images are intentionally excluded.

## Summary

- Accepted: 22
- Unresolved: 41
- Replacement policy: fill missing logos and replace proxy logos; preserve direct Devicon logos except targeted verified replacements where the Devicon asset is unsuitable in graph nodes.
- Graph rendering assets: 77 local PNGs generated in `public/logos/graph/` from canonical v5 logo URLs to avoid Cytoscape canvas SVG rendering bugs and reduce remote graph image fetches.

## Accepted Logos

| ID | Name | Action | Commons file | License |
|----|------|--------|--------------|---------|
| `lang:ada` | Ada | filled | [Ada horizon green logo with slogan.svg](https://commons.wikimedia.org/wiki/File:Ada_horizon_green_logo_with_slogan.svg) | Public domain |
| `lang:algol` | ALGOL | filled | [1965 ALGOL Logotype.jpg](https://commons.wikimedia.org/wiki/File:1965_ALGOL_Logotype.jpg) | CC BY-SA 3.0 |
| `lang:cython` | Cython | filled | [Cython logo.svg](https://commons.wikimedia.org/wiki/File:Cython_logo.svg) | Apache License 2.0 |
| `lang:d` | D | filled | [D Programming Language logo.svg](https://commons.wikimedia.org/wiki/File:D_Programming_Language_logo.svg) | Public domain |
| `lang:fortran95` | Fortran 95 | replaced_proxy | [Fortran logo.svg](https://commons.wikimedia.org/wiki/File:Fortran_logo.svg) | Public domain |
| `lang:freepascal` | Free Pascal | replaced_proxy | [FPClogogif.gif](https://commons.wikimedia.org/wiki/File:FPClogogif.gif) | GPL |
| `lang:guile` | GNU Guile | filled | [GNU-Guile-logo.svg](https://commons.wikimedia.org/wiki/File:GNU-Guile-logo.svg) | CC BY-SA 4.0 |
| `lang:lisp` | Lisp | filled | [Lisp logo.svg](https://commons.wikimedia.org/wiki/File:Lisp_logo.svg) | CC BY-SA 4.0 |
| `lang:modula3` | Modula-3 | filled | [M3Logo.gif](https://commons.wikimedia.org/wiki/File:M3Logo.gif) | Public domain |
| `lang:oberon` | Oberon | filled | [Oberon programming language logo.svg](https://commons.wikimedia.org/wiki/File:Oberon_programming_language_logo.svg) | Public domain |
| `lang:oberon2` | Oberon-2 | filled | [Oberon programming language logo.svg](https://commons.wikimedia.org/wiki/File:Oberon_programming_language_logo.svg) | Public domain |
| `lang:pharo` | Pharo | filled | [Pharo Logo v3.0.svg](https://commons.wikimedia.org/wiki/File:Pharo_Logo_v3.0.svg) | MIT |
| `lang:reasonml` | ReasonML | filled | [Reason-logo.svg](https://commons.wikimedia.org/wiki/File:Reason-logo.svg) | MIT |
| `lang:rust` | Rust | replaced_devicon | [Rust programming language black logo.svg](https://commons.wikimedia.org/wiki/File:Rust_programming_language_black_logo.svg) | CC BY 4.0; trademark retained by Rust Foundation |
| `lang:scheme` | Scheme | filled | [Lambda lc.svg](https://commons.wikimedia.org/wiki/File:Lambda_lc.svg) | Public domain |
| `lang:self` | Self | filled | [Self-logo.svg](https://commons.wikimedia.org/wiki/File:Self-logo.svg) | CC BY-SA 3.0 |
| `lang:simula` | Simula | filled | [Simula - logo.svg](https://commons.wikimedia.org/wiki/File:Simula_-_logo.svg) | Public domain |
| `lang:smalltalk` | Smalltalk | filled | [Smalltalk Balloon.svg](https://commons.wikimedia.org/wiki/File:Smalltalk_Balloon.svg) | CC BY-SA 4.0 |
| `lang:v` | V | filled | [V Logo SVG.svg](https://commons.wikimedia.org/wiki/File:V_Logo_SVG.svg) | MIT |
| `tool:ghc` | GHC | replaced_proxy | [Haskell-logo.png](https://commons.wikimedia.org/wiki/File:Haskell-logo.png) | Public domain |
| `tool:roslyn` | Roslyn | replaced_proxy | [Roslyn.png](https://commons.wikimedia.org/wiki/File:Roslyn.png) | MIT |
| `tool:spidermonkey` | SpiderMonkey | replaced_proxy | [SpiderMonkey Logo.png](https://commons.wikimedia.org/wiki/File:SpiderMonkey_Logo.png) | MPL 2 |

## Unresolved

| ID | Name | Reason | Mapping |
|----|------|--------|---------|
| `lang:abc` | ABC | Wikidata item has no P154 logo image | Q1057802 |
| `lang:agda` | Agda | Wikidata item has no P154 logo image | Q20479 |
| `lang:alef` | Alef | Wikidata item has no P154 logo image | Q1895587 |
| `lang:algol68` | ALGOL 68 | Wikidata item has no P154 logo image | Q2166735 |
| `lang:assembly` | Assembly | Wikidata item has no P154 logo image | Q165436 |
| `lang:b` | B | Wikidata item has no P154 logo image | Q797302 |
| `lang:bcpl` | BCPL | Wikidata item has no P154 logo image | Q810009 |
| `lang:clu` | CLU | Wikidata item has no P154 logo image | Q775159 |
| `lang:common_lisp` | Common Lisp | Wikidata item has no P154 logo image | Q849146 |
| `lang:comtran` | COMTRAN | Wikidata item has no P154 logo image | Q5013384 |
| `lang:cyclone` | Cyclone | Wikidata item has no P154 logo image | Q79598 |
| `lang:dylan` | Dylan | Wikidata item has no P154 logo image | Q1268744 |
| `lang:flow_matic` | FLOW-MATIC | Wikidata item has no P154 logo image | Q1389173 |
| `lang:icon` | Icon | Wikidata P154 resolves to an unrelated magazine logo, not the Icon programming language. | Q1156474 |
| `lang:idris` | Idris | Wikidata item has no P154 logo image | Q15408477 |
| `lang:j` | J | Wikidata item has no P154 logo image | Q383994 |
| `lang:lazy_ml` | Lazy ML | Wikidata item has no P154 logo image | Q6522721 |
| `lang:limbo` | Limbo | Wikidata item has no P154 logo image | Q544927 |
| `lang:luajit` | LuaJIT | Wikidata item has no P154 logo image | Q41584446 |
| `lang:machine_code` | Machine Code | Wikidata item has no P154 logo image | Q55813 |
| `lang:mercury` | Mercury | Wikidata item has no P154 logo image | Q206040 |
| `lang:miranda` | Miranda | Wikidata item has no P154 logo image | Q780803 |
| `lang:ml` | ML | Wikidata item has no P154 logo image | Q860654 |
| `lang:modula2` | Modula-2 | Wikidata item has no P154 logo image | Q777358 |
| `lang:mojo` | Mojo | Wikidata item has no P154 logo image | Q118152673 |
| `lang:mypy` | mypy | Wikipedia title resolution points at Python and returns Python branding, not mypy branding. | Q28865 |
| `lang:newsqueak` | Newsqueak | Wikidata item has no P154 logo image | Q262003 |
| `lang:pascal` | Pascal | Wikidata item has no P154 logo image | Q81571 |
| `lang:pl1` | PL/I | Wikidata item has no P154 logo image | Q223433 |
| `lang:planner` | Planner | Wikidata item has no P154 logo image | Q2349274 |
| `lang:s` | S | Wikidata item has no P154 logo image | Q1283865 |
| `lang:sh` | Bourne Shell | Wikidata item has no P154 logo image | Q844595 |
| `lang:sml` | Standard ML | Wikidata item has no P154 logo image | Q597330 |
| `lang:tcl` | Tcl | Wikidata item has no P154 logo image | Q400649 |
| `tool:beam` | BEAM VM | Wikidata item has no P154 logo image | Q17382855 |
| `tool:chez_scheme` | Chez Scheme | Wikidata item has no P154 logo image | Q5094657 |
| `tool:clang` | Clang | Wikidata item has no P154 logo image | Q864915 |
| `tool:femtolisp` | FemtoLisp | Wikidata P154 resolves to Julia branding, not a FemtoLisp-specific logo. | Q2613697 |
| `tool:hotspot` | HotSpot JVM | Wikidata item has no P154 logo image | Q633804 |
| `tool:javascriptcore` | JavaScriptCore | Wikidata item has no P154 logo image | Q654034 |
| `tool:mrustc` | mrustc | Wikipedia page not found | MRustC |
