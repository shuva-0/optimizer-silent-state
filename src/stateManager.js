/**
 * stateManager.js
 *
 * Manages game state for OPTIMIZER — SILENT STATE.
 * Implements system dynamics equations from project_spec.md exactly.
 * All state updates go through updateState().
 *
 * Architecture: ALL mutable runtime data lives inside the state object.
 *   state._turn        {number}  — current turn counter
 *   state._delayQueue  {Array}   — pending delayed effects
 *   No module-level mutable variables exist.
 */

// ─── Coefficients (from project_spec.md) ─────────────────────────────────────
const COEFFICIENTS = {
  alpha:  0.05, // autonomy decay from compliance
  beta:   0.03, // autonomy decay from silence
  gamma:  0.04, // uncertainty reduction from efficiency
  delta:  0.02, // uncertainty growth from low autonomy
  lambda: 0.06, // silence growth from compliance × low autonomy
  mu:     0.03, // compliance growth from efficiency
  nu:     0.02, // compliance decay from uncertainty
};

// ─── Initial State (from game_state_schema.json) ──────────────────────────────
const INITIAL_STATE = {
  efficiency:  { value: 20,  min: 0, max: 100 },
  compliance:  { value: 10,  min: 0, max: 100 },
  autonomy:    { value: 90,  min: 0, max: 100 },
  uncertainty: { value: 60,  min: 0, max: 100 },
  silence:     { value: 5,   min: 0, max: 100 },
  _turn:       0,
  _delayQueue: [],
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function cloneState(state) {
  const clone = {};
  for (const [key, val] of Object.entries(state)) {
    if (key === "_delayQueue") {
      clone._delayQueue = val.map(entry => ({
        turnsLeft: entry.turnsLeft,
        effects:   { ...entry.effects },
      }));
    } else if (typeof val === "object" && val !== null) {
      clone[key] = { ...val };
    } else {
      clone[key] = val;
    }
  }
  return clone;
}

function applyDelta(state, key, delta) {
  if (!(key in state) || typeof state[key] !== "object" || !("value" in state[key])) {
    throw new Error(`Unknown game variable: "${key}"`);
  }
  const { min, max } = state[key];
  state[key] = { ...state[key], value: clamp(state[key].value + delta, min, max) };
  return state;
}

/**
 * System dynamics — applied once per turn, after immediate & delayed effects.
 *
 * 1. A(t+1) = A(t) - α·C - β·S
 * 2. U(t+1) = U(t) - γ·E + δ·(1 - A/100)
 * 3. S(t+1) = S(t) + λ·C·(1 - A/100)
 * 4. C(t+1) = C(t) + μ·E - ν·U
 *
 * Pre-dynamics snapshot eliminates order-of-application bias.
 */
function applySystemDynamics(state) {
  const { alpha, beta, gamma, delta, lambda, mu, nu } = COEFFICIENTS;

  const E = state.efficiency.value;
  const C = state.compliance.value;
  const A = state.autonomy.value;
  const U = state.uncertainty.value;
  const S = state.silence.value;

  const deltaA = -(alpha * C) - (beta * S);
  const deltaU = -(gamma * E) + (delta * (1 - A / 100));
  const deltaS = lambda * C * (1 - A / 100);
  const deltaC = (mu * E) - (nu * U);

  applyDelta(state, "autonomy",    deltaA);
  applyDelta(state, "uncertainty", deltaU);
  applyDelta(state, "silence",     deltaS);
  applyDelta(state, "compliance",  deltaC);

  return state;
}

function processDelayQueue(state) {
  const stillPending = [];

  for (const entry of state._delayQueue) {
    const updated = { ...entry, turnsLeft: entry.turnsLeft - 1 };

    if (updated.turnsLeft <= 0) {
      for (const [key, delta] of Object.entries(updated.effects)) {
        applyDelta(state, key, delta);
      }
    } else {
      stillPending.push(updated);
    }
  }

  state._delayQueue = stillPending;
  return state;
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

/** Stability = efficiency + compliance − uncertainty  (project_spec.md) */
function computeStability(state) {
  return (
    state.efficiency.value +
    state.compliance.value -
    state.uncertainty.value
  );
}

/** Final condition: E=100, C=100, U=0, A=0, S=100 */
function isFinalState(state) {
  return (
    state.efficiency.value  === 100 &&
    state.compliance.value  === 100 &&
    state.uncertainty.value === 0   &&
    state.autonomy.value    === 0   &&
    state.silence.value     === 100
  );
}

// ─── Primary API ──────────────────────────────────────────────────────────────

/**
 * updateState — single entry point for all state mutations.
 *
 * @param {object} currentState  - full state object (never mutated)
 * @param {object} actionResult  - from decisionEngine.resolveAction()
 * @returns {{ new_state, stability, isFinished, turn }}
 */
function updateState(currentState, actionResult) {
  const state = cloneState(currentState);

  // 1. Immediate effects
  for (const [key, delta] of Object.entries(actionResult.immediateEffects)) {
    applyDelta(state, key, delta);
  }

  // 2. Enqueue delayed effects
  for (const { turnsDelay, effects } of actionResult.delayedEffects) {
    state._delayQueue.push({ turnsLeft: turnsDelay, effects: { ...effects } });
  }

  // 3. Tick delay queue
  processDelayQueue(state);

  // 4. System dynamics
  applySystemDynamics(state);

  // 5. Advance turn
  state._turn += 1;

  return {
    new_state:  state,
    stability:  computeStability(state),
    isFinished: isFinalState(state),
    turn:       state._turn,
  };
}

function resetState() {
  return cloneState(INITIAL_STATE);
}

function getDelayQueue(state) {
  return state._delayQueue.map(entry => ({
    turnsLeft: entry.turnsLeft,
    effects:   { ...entry.effects },
  }));
}

export {
  updateState,
  resetState,
  cloneState,
  computeStability,
  isFinalState,
  getDelayQueue,
  INITIAL_STATE,
  COEFFICIENTS,
};