# ApexIQ Telemetry Quality & Validation Engine

## 1. Quality Validation Gates
The quality validation engine (`TelemetryQualityChecker`) acts as a gatekeeper preventing corrupt, incomplete, or corrupted sensor acquisitions from passing into machine learning or performance modeling layers.

### Audit Criteria:
1. **Missing Value Ratio**: Checks for `null`, `NaN`, or infinite values across mandatory channels.
2. **Monotonic Timestamps**: Verifies that time strictly advances. Duplicate timestamps are counted as acquisition anomalies.
3. **Discontinuities**:
   - Gaps where $\Delta t > 0.25\text{s}$ indicate radio or telemetry telemetry transmitter dropouts.
   - Spatial reversal where $\Delta s < -1.0\text{m}$ indicates odometer or GPS reset anomalies.
4. **Physical Boundary Violations**:
   - Speed exceeds vehicle terminal capability ($> 395\text{ km/h}$).
   - Acceleration exceeds physical tyre adhesion limits ($> 6.5\text{g}$).
   - Engine rotational velocity exceeds rev-limiter regulations ($> 16,000\text{ RPM}$).
5. **Sampling Frequency Jitter**:
   - Calculates the coefficient of variation ($CV = \sigma_{\Delta t} / \mu_{\Delta t}$). A $CV > 0.50$ triggers an inconsistent sampling rate warning.
6. **Sector Sum Consistency**:
   - Compares the sum of $S_1 + S_2 + S_3$ against elapsed lap time with a $50\text{ms}$ tolerance.

## 2. Output Schema (`DataQualityResult`)
- `status`: `PASS` | `WARNING` | `FAIL`
- `quality_score`: $0.0 - 100.0$
- `missing_percentage`: Floating-point percentage
- `invalid_percentage`: Floating-point percentage
- `warnings`: Detailed array of anomaly messages
