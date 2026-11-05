# Workspace Technical & Spatiotemporal Guardrails

## Compute & Data Architecture (Out-of-Core First)
- **Hardware Target:** Optimize heavy pipelines for the 128GB RAM / 40-thread stationary workstation (`The Dreadnought`) while preserving clean portability for the 2020 M1 field terminal.
- **Columnar & Out-of-Core Execution:** Default to pure DuckDB SQL, Apache Arrow streams, vectorized memory mapping, and compressed Parquet shards for multi-decade NetCDF, raster, and large tabular workloads.
- **Anti-Bottleneck Discipline:** Never materialize massive intermediate tables in memory or rely on lazy `dbplyr` translations that choke disk writes.
- **Ensemble Synthesis:** Favor mathematically constrained formulations (e.g., non-negative meta-learning across space and time) over ad-hoc averaging.

## Spatial Discipline (`EPSG:27700`)
- **Coordinate Reference System:** Anchor UK spatial workflows to the British National Grid (`EPSG:27700`), aligned to 1km grid cells and individual UPRN centroids.
- **Extent & Indexing:** Always crop and mask continental or Europe-wide rasters (thermal, $\text{PM}_{2.5}$, VIIRS DNB nocturnal radiance) to the target study domain and enforce spatial indexing prior to joins or extractions.

## Visualization & DOM Invariants
- **Quarto + MapLibre (`100vh` Integrity):** Prevent the Flexbox Collapse by explicitly propagating `height: 100%` / `flex: 1` through Quarto's intermediate DOM wrappers so MapLibre containers stretch cleanly to `100vh`.
- **Editable Vector Exports:** Never emit rasterized or outlined/path-converted text in SVG/PowerPoint exports. Preserve live, editable text primitives (e.g., via `svglite`, `rvg`, `officer`).
