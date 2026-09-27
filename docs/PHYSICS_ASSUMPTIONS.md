# Physical Assumptions & Limitations

To maintain scientific integrity, the simplifying assumptions of the synthetic vehicle performance model are explicitly declared:

1. **Point-Mass Quasi-Steady Cornering**:
   - The vehicle is modeled as a lumped point mass at the center of gravity.
   - Dynamic load transfer (lateral and longitudinal roll/pitch rates) is lumped into effective tyre grip $\mu$.
   - Transient yaw inertia response and tyre slip angle relaxation lengths are omitted in favor of quasi-steady radius equilibrium.

2. **Aerodynamic Coupling**:
   - Downforce and drag are calculated under freestream velocity with simplified rake and yaw degradation multipliers.
   - Flow detachment and stall are modeled with quadratic penalties beyond critical angles, but do not reproduce 3D boundary-layer separation or complex vortex breakdown.

3. **Straight-Line Power Delivery**:
   - The hybrid powertrain is treated as a continuous power source (~1,000 hp) capped by a low-speed mechanical traction limit ($1.6g$).
   - Gear shift interruption delays are lumped into transit slack.

4. **Circuit Geometry**:
   - Autodromo Nazionale Monza is approximated using 11 discrete corner radii and 5 connecting longitudinal acceleration zones.
   - Elevation changes (e.g. Curva Grande dip, Ascari curb ramps) are treated as flat ground.

5. **Scientific Labeling**:
   - Every metric generated from this pipeline is categorized as `MODELLED` or `PHYSICS_ESTIMATE` and accompanied by the disclaimer:
   > *"Synthetic engineering dataset / Physics-based synthetic model. Not real F1 CFD, wind-tunnel, vehicle-dynamics, or team data."*
