# Strategy Simulation & Environmental Scenarios

> **GOVERNANCE NOTICE**:
> **SYNTHETIC ENGINEERING DATASET** — **MODELLED SCENARIO — NOT REAL F1 RACE DATA**.
> Simulation models fuel burn mass depletion, track traffic interference, and virtual/full safety car interventions on the 53-lap Monza Grand Prix circuit.

---

## 1. Fuel Mass Depletion Dynamics

The vehicle mass decreases monotonically across the race distance:

$$m(l) = m_{\text{base}} + m_{\text{fuel}}(l)$$
$$m_{\text{fuel}}(l) = m_{\text{fuel, start}} - (l - 1) \cdot \dot{m}_{\text{fuel}}$$

Where:
- $m_{\text{base}} = 798\text{ kg}$ (FIA minimum technical weight).
- $m_{\text{fuel, start}} = 105.0\text{ kg}$.
- $\dot{m}_{\text{fuel}} = 1.85\text{ kg/lap}$.
- Finish fuel mass: $m_{\text{fuel}}(53) = 105.0 - 52 \times 1.85 = 8.8\text{ kg}$ (adheres to FIA 1.0 kg fuel sample rule).

As fuel is depleted, the reduced vehicle inertia improves braking distances, corner apex speeds, and longitudinal acceleration:

$$\Delta t_{\text{fuel}}(l) = -\alpha_{\text{fuel}} \cdot (m_{\text{fuel, start}} - m_{\text{fuel}}(l))$$

Where $\alpha_{\text{fuel}} \approx 0.035\text{ s/kg}$, yielding up to $\approx -3.37\text{ s}$ lap time benefit towards the race finish.

---

## 2. Interventions & Safety Car Modelling

The simulation engine models three neutralization states:
1. **GREEN FLAG**:
   - Nominal track conditions.
   - Stationary pit stop loss: $24.5\text{ s}$ (pit lane transit time minus equivalent track transit time).
2. **VIRTUAL SAFETY CAR (VSC)**:
   - Activated on laps 20 to 22.
   - Cars throttled to delta lap time ($+15.0\text{ s/lap}$).
   - Pit stop loss reduced to $14.5\text{ s}$ (net "cheap pit stop" advantage of $10.0\text{ s}$).
3. **FULL SAFETY CAR (SC)**:
   - Activated on laps 20 to 24.
   - Pack bunched behind safety car ($+35.0\text{ s/lap}$).
   - Pit stop loss reduced to $11.5\text{ s}$ (net "cheap pit stop" advantage of $13.0\text{ s}$).

---

## 3. Traffic Scenarios

Traffic interference models the time lost when following slower cars or encountering out-of-sequence traffic after a pit stop:
- **CLEAN AIR**: Car runs in free air; zero traffic interference penalty.
- **LIGHT TRAFFIC**: Periodic traffic delays averaging $+0.30\text{ s/lap}$ with stochastic dispersion ($\sigma = 0.15\text{ s}$).
- **HEAVY TRAFFIC**: Severe DRS-train congestion averaging $+0.80\text{ s/lap}$ with stochastic dispersion ($\sigma = 0.35\text{ s}$).

Coupled with tyre degradation and fuel burn, this creates a deterministic, physically grounded scenario testing environment for race strategy engineering.
