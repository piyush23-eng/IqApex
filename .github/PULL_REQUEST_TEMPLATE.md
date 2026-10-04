## Engineering Description
<!-- Detailed summary of telemetry, algorithmic, or UI enhancements introduced in this change. -->

### Changes Summary
- [ ] Physics invariant preservation verified (non-linear tyre wear, v² aero drag, conservation of energy)
- [ ] Spatial 1.0m resampling verified over non-uniform telemetry traces
- [ ] Unit & regression test suite passing with >= 90% coverage
- [ ] Frontend responsive layout verified across standard desktop & pit-wall resolutions

### Validation Evidence
- **Backend Test Suite**: `pytest tests/`
- **Frontend Typecheck & Build**: `npm run build`
- **Benchmark Latency Budget**: < 50ms for 1m spatial alignment

### Traceability
- Addresses Issue: #
- Component Impact: [Telemetry Ingestion / Vehicle Performance / Strategy / HUD]
