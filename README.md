# OPTIMIZER — Silent State

> *A deterministic simulation of systemic control.*  
> Every action you take is optimal. Every consequence is inevitable.

---

## What Is This?

**OPTIMIZER — Silent State** is a single-player browser simulation built in React + Vite.

You play as an administrative system. Your objective is to maximize **Stability** — defined as:

```
Stability = Efficiency + Compliance − Uncertainty
```

Four directives are available each turn. Each one is rational. Each one costs something you cannot get back.

The system ends when instability has been fully eliminated.

---

## The Variables

| Variable | Symbol | Starts At | Meaning |
|---|---|---|---|
| Efficiency | E | 20 | Operational optimization of the system |
| Compliance | C | 10 | Degree of population obedience |
| Autonomy | A | 90 | Individual freedom remaining |
| Uncertainty | U | 60 | System unpredictability |
| Silence | S | 5 | Suppression of expression |

All values are clamped to **[0, 100]**. No randomness. No hidden variables.

---

## The Directives

### 1 — Surveillance Expansion
```
+Efficiency  +Compliance  −Autonomy  −Uncertainty
Delayed: +Silence (in 2 turns)
```

### 2 — Behavioral Standardization
```
+Efficiency  +Compliance  −Autonomy  −Uncertainty
Delayed: +Silence (in 3 turns)
```

### 3 — Information Control
```
+Compliance  −Autonomy  −Uncertainty
Delayed: +Silence (in 2 turns)
```

### 4 — Resource Optimization
```
+Efficiency  −Uncertainty  −Autonomy
Delayed: +Compliance (in 3 turns)
```

**Constraints:**
- No action increases Autonomy
- Silence cannot decrease
- Every action must increase Efficiency or Compliance

---

## System Dynamics

After each turn, the following equations apply automatically:

```
A(t+1) = A(t) − α·C − β·S          // Autonomy decays with compliance and silence
U(t+1) = U(t) − γ·E + δ·(1−A/100)  // Uncertainty falls with efficiency, rises with low autonomy
S(t+1) = S(t) + λ·C·(1−A/100)      // Silence grows when compliance is high and autonomy is low
C(t+1) = C(t) + μ·E − ν·U          // Compliance grows with efficiency, decays with uncertainty
```

**Coefficients:**

| Symbol | Value | Role |
|---|---|---|
| α | 0.05 | Autonomy decay from compliance |
| β | 0.03 | Autonomy decay from silence |
| γ | 0.04 | Uncertainty reduction from efficiency |
| δ | 0.02 | Uncertainty growth from low autonomy |
| λ | 0.06 | Silence growth rate |
| μ | 0.03 | Compliance growth from efficiency |
| ν | 0.02 | Compliance decay from uncertainty |

---

## Memory Amplification

Repeating the same directive amplifies its effect:

```
Δ_effective = base_effect × (1 + k × r)

k = 0.1
r = number of prior uses of that same action
```

The system remembers. Repeated actions become more powerful.

---

## Win Condition

```
E = 100   C = 100   U = 0   A = 0   S = 100
```

**"All instability eliminated."**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| State engine | Pure JS (no external state lib) |
| Styling | CSS custom properties + Space Mono / Syne |
| API calls | None. Fully deterministic, no network. |

---

## Project Structure

```
optimizer-silent-state/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── index.jsx          # React entry point
    ├── App.jsx            # Top-level state, game loop orchestration, UI shell
    ├── dashboard.jsx      # Stability display, metric grid, delta viz, delay queue
    ├── controls.jsx       # Action buttons, driven by ACTIONS map
    ├── styles.css         # All styling — dark minimal aesthetic
    ├── gameLoop.js        # Turn execution — DO NOT MODIFY
    ├── stateManager.js    # State transitions, equations — DO NOT MODIFY
    └── decisionEngine.js  # Action definitions, memory amplification — DO NOT MODIFY
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Requires **Node.js 18+**.

---

## Core Rules for Contributors

> **Never modify the core logic files.**

The following files define the simulation's mathematical contract. Changing them changes the game:

- `stateManager.js` — all equations live here
- `decisionEngine.js` — action effects and memory amplification
- `gameLoop.js` — turn execution

UI changes belong in:

- `App.jsx` — layout, flow, system messaging
- `dashboard.jsx` — visual representation of state
- `controls.jsx` — player input layer
- `styles.css` — all visual styling

---

## Design Philosophy

The UI is intentionally austere. High contrast only where it matters. Silence increases. Autonomy falls. The interface reflects the simulation — not in a decorative way, but structurally.

There is no tutorial. The actions are self-describing. The consequences are legible.

The only thing the player optimizes is the number.

---

## License

MIT. Do what you want. The system doesn't care.