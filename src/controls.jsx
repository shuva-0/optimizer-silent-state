import React from "react";
import { ACTIONS } from "./decisionEngine";

export default function Controls({ onAction, disabled }) {
  const actions = Object.values(ACTIONS);

  return (
    <div className="controls">
      <div className="controls-buttons">
        {actions.map((action) => (
          <div key={action.id} className="control-group">
            <button
              className="control-button"
              onClick={() => onAction(action.id)}
              disabled={disabled}
              aria-label={action.label}
            >
              {action.label}
            </button>
            <span className="preview">{action.preview}</span>
          </div>
        ))}
      </div>
    </div>
  );
}