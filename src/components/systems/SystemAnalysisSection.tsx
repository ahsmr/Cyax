import React, { useState } from "react";
import { ChevronDown, ChevronUp, Search, Activity } from "lucide-react";
import styles from "./SystemAnalysisSection.module.css";

export const SystemAnalysisSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [damping, setDamping] = useState<string>("0.5");
  const [natFreq, setNatFreq] = useState<string>("10");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const analyzeSystem = () => {
    const zeta = parseFloat(damping);
    const wn = parseFloat(natFreq);
    const overshoot = (
      Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta)) * 100
    ).toFixed(2);
    const settlingTime = (4 / (zeta * wn)).toFixed(2);

    setAnalysisResult(
      `Underdamped Response (ζ = ${zeta}) | Peak Overshoot %Mp = ${overshoot}% | Settling Time Ts = ${settlingTime} s`,
    );
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.headerTitle}>
          <Search size={18} className={styles.iconPurple} />
          <span>2. System Analysis</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className={styles.body}>
          <p className={styles.description}>
            Evaluate stability (Routh-Hurwitz, Nyquist), transient dynamics
            (overshoot, settling time), and observability.
          </p>

          <div className={styles.inputGrid}>
            <div className={styles.inputGroup}>
              <label>Damping Ratio (ζ):</label>
              <input
                type="number"
                step="0.1"
                value={damping}
                onChange={(e) => setDamping(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Natural Freq (ωn rad/s):</label>
              <input
                type="number"
                value={natFreq}
                onChange={(e) => setNatFreq(e.target.value)}
              />
            </div>
          </div>

          <button className={styles.calcBtn} onClick={analyzeSystem}>
            <Activity size={14} /> Analyze Time/Frequency Dynamics
          </button>

          {analysisResult && (
            <div className={styles.resultBox}>{analysisResult}</div>
          )}
        </div>
      )}
    </div>
  );
};
