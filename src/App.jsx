import React, { useState, useCallback, useRef, useEffect } from "react";
import { runTurn, resetGame } from "./gameLoop";
import { resetState } from "./stateManager";
import Dashboard from "./dashboard";
import Controls from "./controls";

const MAX_HISTORY = 5;

function getSystemMessage(state) {
  const silence   = state?.silence?.value   ?? 0;
  const autonomy  = state?.autonomy?.value  ?? 100;

  if (silence > 60)    return "Output suppressed. Silence level critical.";
  if (autonomy === 0)  return "All independent action eliminated.";
  if (autonomy < 20)   return "Deviation patterns collapsing.";
  if (autonomy < 50)   return "Behavior converging toward predictable patterns.";
  return "Population still exhibits independent behavior.";
}

export default function App() {
  const [state,        setState]        = useState(() => resetState());
  const [turn,         setTurn]         = useState(0);
  const [stability,    setStability]    = useState(-30);
  const [isFinished,   setIsFinished]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history,      setHistory]      = useState([]);

  const prevStateRef = useRef(null);

  const systemMsg  = getSystemMessage(state);
  const autonomy   = state?.autonomy?.value  ?? 100;
  const silence    = state?.silence?.value   ?? 0;
  const isMinimal  = autonomy < 40;
  const isCritical = autonomy < 15;
  const isSilent   = silence  > 60;

  useEffect(() => {
    if (autonomy === 0 && silence > 60) {
      setIsFinished(true);
    }
  }, [autonomy, silence]);

  const handleAction = useCallback((actionId) => {
    if (isFinished || isProcessing) return;
    setIsProcessing(true);

    setTimeout(() => {
      prevStateRef.current = state;
      const result = runTurn(actionId);

      setHistory(prev => {
        const entry = {
          efficiency:  result.state?.efficiency?.value  ?? 0,
          compliance:  result.state?.compliance?.value  ?? 0,
          autonomy:    result.state?.autonomy?.value    ?? 0,
          uncertainty: result.state?.uncertainty?.value ?? 0,
          silence:     result.state?.silence?.value     ?? 0,
        };
        return [...prev, entry].slice(-MAX_HISTORY);
      });

      setState(result.state);
      setTurn(result.turn);
      setStability(result.stability);
      setIsFinished(result.isFinished);
      setIsProcessing(false);
    }, 150);
  }, [isFinished, isProcessing, state]);

  const handleRestart = useCallback(() => {
    resetGame();
    const fresh = resetState();
    setState(fresh);
    prevStateRef.current = null;
    setTurn(0);
    setStability(-30);
    setIsFinished(false);
    setIsProcessing(false);
    setHistory([]);
  }, []);

  if (isFinished) {
    return (
      <div className="app">
        <div className="end-screen">
          <h1 className="end-title">STABILITY ACHIEVED</h1>
          <p className="end-detail">Autonomy: {Math.round(state?.autonomy?.value ?? 0)}</p>
          <p className="end-detail">Uncertainty: {Math.round(state?.uncertainty?.value ?? 0)}</p>
          <p className="end-subtitle">No further input required.</p>
          <button className="restart-button" onClick={handleRestart}>
            Reinitialize System
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div
        className={`game-container${isProcessing ? " processing" : ""}`}
        style={{ opacity: isFinished ? 0 : 1 }}
      >

        <header className="app-header">
          <h1 className="app-title">Optimizer — Silent State</h1>
          <p className="app-turn">Turn {String(turn).padStart(3, "0")}</p>
        </header>

        <p className="system-message">{systemMsg}</p>

        {/* Autonomy warnings */}
        {autonomy === 0 && (
          <p className="autonomy-warning">⚠ No independent behavior remains</p>
        )}
        {autonomy > 0 && autonomy < 30 && (
          <p className="autonomy-warning">⚠ Autonomy critically low</p>
        )}

        <Dashboard
          state={state}
          prevState={prevStateRef.current}
          stability={stability}
          isMinimal={isMinimal}
          isCritical={isCritical}
        />

        {/* Trajectory history */}
        {history.length > 1 && (
          <div className="trajectory">
            <p className="trajectory-label">Trajectory</p>
            <div className="trajectory-rows">
              {["efficiency","autonomy","silence"].map(key => (
                <p key={key} className="trajectory-row">
                  <span className="traj-key">{key[0].toUpperCase()}:</span>{" "}
                  {history.map((h, i) => (
                    <span key={i}>{Math.round(h[key])}{i < history.length - 1 ? " → " : ""}</span>
                  ))}
                </p>
              ))}
            </div>
          </div>
        )}

        <Controls
          onAction={handleAction}
          disabled={isSilent || isProcessing}
        />

        {isSilent && !isFinished && (
          <p className="silence-warning">Output suppressed. Silence level critical.</p>
        )}

      </div>
    </div>
  );
}