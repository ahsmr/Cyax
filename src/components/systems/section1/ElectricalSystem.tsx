import React, { useState } from "react";
import { Zap, Play, Lightbulb } from "lucide-react";
import styles from "./ElectricalSystem.module.css";
import { MathView } from "../../common/MathView";

export const ElectricalSystem: React.FC = () => {
  const [resistance, setResistance] = useState<string>("10");
  const [inductance, setInductance] = useState<string>("0.5");
  const [capacitance, setCapacitance] = useState<string>("0.01");
  const [showDerivation, setShowDerivation] = useState<boolean>(false);

  const R = parseFloat(resistance.replace(",", ".")) || 0;
  const L = parseFloat(inductance.replace(",", ".")) || 0;
  const C = parseFloat(capacitance.replace(",", ".")) || 0;

  return (
    <div className={styles.container}>
      <div className={styles.subHeader}>
        <Zap size={16} className={styles.icon} />
        <span>Series RLC Circuit — Differential Equation Derivation</span>
      </div>

      <p className={styles.description}>
        Derive the continuous-time differential equation for a series RLC
        circuit where input is source voltage <MathView math="u = v_s" /> and
        output is capacitor charge <MathView math="y = q_C" />.
      </p>

      {/* RLC Circuit SVG Diagram */}
      <div className={styles.diagramWrapper}>
        <svg
          width="320"
          height="160"
          viewBox="0 0 320 160"
          style={{
            background: "#0f172a",
            borderRadius: "8px",
            padding: "10px",
          }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Main Loop Wire */}
          <rect
            x="50"
            y="30"
            width="220"
            height="100"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* Voltage Source vs */}
          <circle
            cx="50"
            cy="80"
            r="16"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          <text x="50" y="85" fill="#38bdf8" fontSize="14" textAnchor="middle">
            vₛ
          </text>

          {/* Resistor R */}
          <rect
            x="110"
            y="24"
            width="40"
            height="12"
            fill="#0f172a"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          <text x="130" y="18" fill="#f59e0b" fontSize="12" textAnchor="middle">
            R ({R} Ω)
          </text>

          {/* Capacitor C */}
          <line
            x1="210"
            y1="20"
            x2="210"
            y2="40"
            stroke="#a855f7"
            strokeWidth="3"
          />
          <line
            x1="216"
            y1="20"
            x2="216"
            y2="40"
            stroke="#a855f7"
            strokeWidth="3"
          />
          <text x="213" y="14" fill="#a855f7" fontSize="12" textAnchor="middle">
            C ({C} F)
          </text>

          {/* Inductor L */}
          <path
            d="M 270 55 Q 282 62 270 70 Q 282 77 270 85 Q 282 92 270 100"
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
          />
          <text x="295" y="80" fill="#34d399" fontSize="12" textAnchor="middle">
            L ({L} H)
          </text>

          {/* Current Arrow i */}
          <line
            x1="130"
            y1="130"
            x2="170"
            y2="130"
            stroke="#38bdf8"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
          <text
            x="150"
            y="148"
            fill="#38bdf8"
            fontSize="12"
            textAnchor="middle"
          >
            i(t)
          </text>
        </svg>
      </div>

      {/* Inputs Grid */}
      <div className={styles.inputGrid}>
        <div className={styles.inputGroup}>
          <label>Resistance R (Ω):</label>
          <input
            type="number"
            step="any"
            value={resistance}
            onChange={(e) => setResistance(e.target.value)}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Inductance L (H):</label>
          <input
            type="number"
            step="any"
            value={inductance}
            onChange={(e) => setInductance(e.target.value)}
          />
        </div>
        <div className={styles.inputGroup}>
          <label>Capacitance C (F):</label>
          <input
            type="number"
            step="any"
            value={capacitance}
            onChange={(e) => setCapacitance(e.target.value)}
          />
        </div>
      </div>

      {/* Fundamental Rules Callout */}
      <div className={styles.tipBox}>
        <div className={styles.tipHeader}>
          <Lightbulb size={18} />
          <span>Key Rules for Series System:</span>
        </div>
        <ul className={styles.tipList}>
          <li>
            <strong>Kirchhoff's Voltage Law (KVL):</strong>{" "}
            <MathView math="v_s = v_L + v_C + v_R" />
          </li>
          <li>
            <strong>Series Current:</strong>{" "}
            <MathView math="i = i_L = i_R = i_C" />
          </li>
          <li>
            <strong>Capacitor Charge Relations:</strong>{" "}
            <MathView math="v_C = \frac{1}{C}\cdot q_C" /> ,{" "}
            <MathView math="i = \frac{dq}{dt}" /> ,{" "}
            <MathView math="\frac{di}{dt} = \frac{d^2q}{dt^2}" />
          </li>
        </ul>
      </div>

      <button
        className={styles.calcBtn}
        onClick={() => setShowDerivation(true)}
      >
        <Play size={14} /> Derive Differential Equation
      </button>

      {/* Derivation Steps */}
      {showDerivation && (
        <div className={styles.resultBox}>
          <h4 className={styles.subHeader}>Step-by-Step Derivation:</h4>

          <div className={styles.stepBlock}>
            <strong>Step 1: Apply KVL across the loop</strong>
            <MathView math="v_s = v_C + v_L + v_R" displayMode />
          </div>

          <div className={styles.stepBlock}>
            <strong>
              Step 2: Express branch voltages in terms of charge{" "}
              <MathView math="q_C" /> and current <MathView math="i" />
            </strong>
            <MathView
              math={`v_s = \\frac{1}{C}\\cdot q_C + L\\cdot \\frac{di}{dt} + R\\cdot i`}
              displayMode
            />
          </div>

          <div className={styles.stepBlock}>
            <strong>
              Step 3: Substitute <MathView math="i = \frac{dq}{dt}" /> and{" "}
              <MathView math="\frac{di}{dt} = \frac{d^2q}{dt^2}" />
            </strong>
            <MathView
              math={`v_s = \\frac{1}{C}\\cdot q_C + L\\cdot \\frac{d^2q}{dt^2} + R\\cdot \\frac{dq}{dt}`}
              displayMode
            />
          </div>

          <div className={styles.stepBlock}>
            <strong>
              Step 4: Final Differential Equation (with{" "}
              <MathView math="u = v_s" /> and <MathView math="y = q_C" />)
            </strong>
            <div className={styles.finalBox}>
              <MathView
                math={`u = ${L}\\ddot{y} + ${R}\\dot{y} + \\frac{1}{${C}} y`}
                displayMode
              />
              <p
                className={styles.description}
                style={{ marginTop: "8px", marginBottom: 0 }}
              >
                Symbolic Form:{" "}
                <MathView math="u = L\ddot{y} + R\dot{y} + \frac{1}{C}y" />
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
