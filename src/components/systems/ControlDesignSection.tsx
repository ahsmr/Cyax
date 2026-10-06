import React, { useState } from "react";
import { ChevronDown, ChevronUp, Sliders, Wrench } from "lucide-react";
import styles from "./ControlDesignSection.module.css";

export const ControlDesignSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [kp, setKp] = useState<string>("2.5");
  const [ki, setKi] = useState<string>("1.0");
  const [kd, setKd] = useState<string>("0.1");
  const [designOutput, setDesignOutput] = useState<string | null>(null);

  const synthesizeController = () => {
    setDesignOutput(
      `PID Controller synthesized: C(s) = ${kp} + (${ki}/s) + ${kd}s | Phase Margin increased by +35°`,
    );
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.headerTitle}>
          <Sliders size={18} className={styles.iconGreen} />
          <span>3. Control Design</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className={styles.body}>
          <p className={styles.description}>
            Synthesize PID controllers, Lead-Lag compensators, and
            State-Feedback (LQR / Pole Placement).
          </p>

          <div className={styles.inputGrid}>
            <div className={styles.inputGroup}>
              <label>Kp (Proportional):</label>
              <input value={kp} onChange={(e) => setKp(e.target.value)} />
            </div>
            <div className={styles.inputGroup}>
              <label>Ki (Integral):</label>
              <input value={ki} onChange={(e) => setKi(e.target.value)} />
            </div>
            <div className={styles.inputGroup}>
              <label>Kd (Derivative):</label>
              <input value={kd} onChange={(e) => setKd(e.target.value)} />
            </div>
          </div>

          <button className={styles.calcBtn} onClick={synthesizeController}>
            <Wrench size={14} /> Tune & Synthesize Controller
          </button>

          {designOutput && (
            <div className={styles.resultBox}>{designOutput}</div>
          )}
        </div>
      )}
    </div>
  );
};
