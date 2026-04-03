import React, { useRef } from "react";

const METRIC_CONFIG = [
  { key: "efficiency",  label: "Efficiency",  short: "EFF"  },
  { key: "compliance",  label: "Compliance",  short: "COMP" },
  { key: "autonomy",    label: "Autonomy",    short: "AUT"  },
  { key: "uncertainty", label: "Uncertainty", short: "UNC"  },
  { key: "silence",     label: "Silence",     short: "SIL"  },
];

function getStateLabel(state) {
  const autonomy   = state?.autonomy?.value    ?? 100;
  const compliance = state?.compliance?.value  ?? 0;
  const silence    = state?.silence?.value     ?? 0;

  if (autonomy === 0 && compliance >= 80) return "FULLY CONTROLLED";
  if (autonomy < 20)                      return "CRITICAL SUPPRESSION";
  if (silence > 60)                       return "SILENCED";
  if (autonomy < 50)                      return "CONTROLLED";
  if (compliance > 50)                    return "COMPLIANCE RISING";
  return "MONITORING";
}

function getDeltaColor(delta) {
  if (delta > 0)  return "#4caf50";
  if (delta < 0)  return "#f44336";
  return "#888";
}

export default function Dashboard({ state, prevState, stability, isMinimal }) {
  const stabilityClass =
    stability < 0    ? "negative" :
    stability < 50   ? "low"      : "high";

  const stateLabel = getStateLabel(state);

  return (
    <div className="dashboard">

      {/* State label */}
      <p className="state-label">STATE: {stateLabel}</p>

      {/* Stability */}
      <div className="stability-display">
        <span className="stability-label">Stability Index</span>
        <span className={`stability-value ${stabilityClass}`}>
          {Math.round(stability)}
        </span>
      </div>

      {/* Metrics */}
      <ul className="dashboard-metrics">
        {METRIC_CONFIG.map(({ key, label, short }) => {
          const variable  = state?.[key];
          if (!variable) return null;
          const val       = Math.round(variable.value ?? 0);
          const prevVal   = prevState?.[key]?.value != null
            ? Math.round(prevState[key].value)
            : null;
          const delta     = prevVal != null ? val - prevVal : null;
          const deltaColor = delta != null ? getDeltaColor(delta) : "transparent";

          return (
            <li key={key} className="dashboard-metric">
              <span className="metric-label">
                {isMinimal ? short : label}
              </span>
              <span className="metric-value">{val}</span>
              {delta != null && delta !== 0 && (
                <span className="metric-delta" style={{ color: deltaColor }}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Delay queue */}
      {Array.isArray(state?._delayQueue) && state._delayQueue.length > 0 && (
        <div className="delay-section">
          <p className="delay-title">Pending Effects</p>
          <div className="delay-indicator">
            {state._delayQueue.map((entry, i) => {
              const parts = Object.entries(entry.effects || {}).map(
                ([k, v]) => `${v > 0 ? "+" : ""}${Math.round(v)} ${k[0].toUpperCase()}${k.slice(1)}`
              );
              return (
                <span key={i} className="delay-tag">
                  {parts.join(", ")} in {entry.turnsLeft} turn{entry.turnsLeft !== 1 ? "s" : ""}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}