/**
 * gameLoop.js
 *
 * Orchestrates turn execution for OPTIMIZER — SILENT STATE.
 * Delegates all state mutation to stateManager and all decision
 * logic to decisionEngine.
 *
 * FIX: Removed duplicate runTurn declaration that caused fatal ES module
 * crash (white screen). currentState is now declared before use.
 */

import { resetState } from "./stateManager";
import { decide } from "./decisionEngine";

// Single mutable reference — declared BEFORE runTurn to avoid temporal dead zone
let currentState = resetState();

/**
 * Execute a single turn by choosing the given action.
 *
 * @param {string} actionId — one of the valid action IDs
 * @returns {{ state: object, stability: number, turn: number, isFinished: boolean }}
 */
function runTurn(actionId) {
  const result = decide(currentState, actionId);
  currentState = result.new_state;

  return {
    state:      currentState,
    stability:  result.stability,
    turn:       result.turn,
    isFinished: result.isFinished,
  };
}

/**
 * Reset the game loop back to initial state.
 * Call this when the player restarts the game.
 */
function resetGame() {
  currentState = resetState();
}

export { runTurn, resetGame };