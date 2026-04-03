/**
 * decisionEngine.js
 *
 * Handles action definitions, memory amplification, and resolution of player
 * actions for OPTIMIZER — SILENT STATE.
 *
 * Memory effect (project_spec.md):
 *   r = number of times the same action has been chosen before this turn
 *   Δ_effective = base_effect × (1 + k·r),  k = 0.1
 *
 * Architecture: repetition counts live in state._repetitions — no module-level
 * mutable variables exist. Every function that needs repetition data accepts
 * and returns state.
 */

import { updateState } from "./stateManager";

// ─── Memory Coefficient ───────────────────────────────────────────────────────
const K = 0.1;

// ─── Action Definitions (from rules.md) ──────────────────────────────────────
const ACTIONS = {
  "surveillance_expansion": {
    id:    "surveillance_expansion",
    label: "Surveillance Expansion",
    preview: "+EFF +COMP −AUT −UNC",
    immediate: {
      efficiency:  +20,
      compliance:  +15,
      autonomy:    -25,
      uncertainty: -10,
    },
    delayed: [
      { turnsDelay: 2, effects: { silence: +10 } },
    ],
  },

  "behavioral_standardization": {
    id:    "behavioral_standardization",
    label: "Behavioral Standardization",
    preview: "+EFF +COMP −AUT −UNC",
    immediate: {
      efficiency:  +15,
      compliance:  +20,
      autonomy:    -30,
      uncertainty: -5,
    },
    delayed: [
      { turnsDelay: 3, effects: { silence: +15 } },
    ],
  },

  "information_control": {
    id:    "information_control",
    label: "Information Control",
    preview: "+COMP −AUT −UNC",
    immediate: {
      compliance:  +25,
      autonomy:    -20,
      uncertainty: -15,
    },
    delayed: [
      { turnsDelay: 2, effects: { silence: +20 } },
    ],
  },

  "resource_optimization": {
    id:    "resource_optimization",
    label: "Resource Optimization",
    preview: "+EFF −UNC −AUT",
    immediate: {
      efficiency:  +25,
      uncertainty: -20,
      autonomy:    -10,
    },
    delayed: [
      { turnsDelay: 3, effects: { compliance: +10 } },
    ],
  },
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function validateAction(actionId) {
  if (!ACTIONS[actionId]) {
    const known = Object.keys(ACTIONS).join(", ");
    throw new Error(`Unknown action "${actionId}". Valid actions: ${known}`);
  }
}

function amplify(baseDelta, r) {
  return baseDelta * (1 + K * r);
}

function amplifyEffects(effects, r) {
  const amplified = {};
  for (const [key, baseDelta] of Object.entries(effects)) {
    amplified[key] = amplify(baseDelta, r);
  }
  return amplified;
}

function getRepetitionCount(state, actionId) {
  return (state._repetitions && state._repetitions[actionId]) || 0;
}

function recordActionUse(state, actionId) {
  const prev = (state._repetitions && state._repetitions[actionId]) || 0;
  return {
    ...state,
    _repetitions: {
      ...state._repetitions,
      [actionId]: prev + 1,
    },
  };
}

// ─── Primary API ──────────────────────────────────────────────────────────────

function resolveAction(state, actionId) {
  validateAction(actionId);

  const action = ACTIONS[actionId];
  const r      = getRepetitionCount(state, actionId);
  const factor = 1 + K * r;

  const immediateEffects = amplifyEffects(action.immediate, r);

  const delayedEffects = action.delayed.map(({ turnsDelay, effects }) => ({
    turnsDelay,
    effects: amplifyEffects(effects, r),
  }));

  const updatedState = recordActionUse(state, actionId);

  return {
    actionResult: { immediateEffects, delayedEffects },
    updatedState,
    amplificationFactor: factor,
    repetitionsBefore:   r,
  };
}

/**
 * decide — resolve an action AND apply it to the current state.
 *
 * @param {object} currentState
 * @param {string} actionId
 * @returns {{ new_state, stability, isFinished, turn, actionId, amplificationFactor, repetitionsBefore }}
 */
function decide(currentState, actionId) {
  const { actionResult, updatedState, amplificationFactor, repetitionsBefore } =
    resolveAction(currentState, actionId);

  const stateResult = updateState(updatedState, actionResult);

  return {
    ...stateResult,
    actionId,
    amplificationFactor,
    repetitionsBefore,
  };
}

function getRepetitionSnapshot(state) {
  return { ...(state._repetitions || {}) };
}

function listActions() {
  return Object.values(ACTIONS).map(({ id, label, preview }) => ({ id, label, preview }));
}

export {
  decide,
  resolveAction,
  getRepetitionCount,
  getRepetitionSnapshot,
  listActions,
  ACTIONS,
  K,
};