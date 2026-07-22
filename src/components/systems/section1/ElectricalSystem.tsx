import React, { useState } from 'react';
import { Zap, Play } from 'lucide-react';
import styles from './ElectricalSystem.module.css';
import { MathView } from '../../common/MathView';

export const ElectricalSystem: React.FC = () => {
  const [resistance, setResistance] = useState<string>('10');
  const [inductance, setInductance] = useState<string>('0.5');
  const [capacitance, setCapacitance] = useState<string>('0.01');
  const [resultMath, setResultMath] = useState<{
    tfFormula: string;
    wn: string;
  } | null>(null);

  const calculateRLC = () => {
    const R = parseFloat(resistance.replace(',', '.'));
    const L = parseFloat(inductance.replace(',', '.'));
    const C = parseFloat(capacitance.replace(',', '.'));

    if (isNaN(R) || isNaN(L) || isNaN(C) || L === 0 || C === 0) {
      setResultMath(null);
      return;
    }

    const lc = (L * C).toPrecision(4);
    const rc = (R * C).toPrecision(4);
    const wnVal = (1 / Math.sqrt(L * C)).toFixed(2);

    setResultMath({
      tfFormula: `G(s) = \\frac{1}{${lc}s^2 + ${rc}s + 1}`,
      wn: `\\omega_n = ${wnVal}\\text{ rad/s}`,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.subHeader}>
        <Zap size={16} className={styles.icon} />
        <span>Series RLC Circuit Model Generator</span>
      </div>

      <p className={styles.description}>
        Specify passive circuit parameters to derive the continuous-time voltage transfer function{' '}
        <MathView math="G(s) = \frac{V_{out}(s)}{V_{in}(s)}" />.
      </p>

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

      <button className={styles.calcBtn} onClick={calculateRLC}>
        <Play size={14} /> Derive Electrical Transfer Function
      </button>

      {resultMath && (
        <div className={styles.resultBox}>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>
              Derived Transfer Function:
            </strong>
            <MathView math={resultMath.tfFormula} displayMode={true} />
          </div>
          <div>
            <strong>Natural Frequency:</strong>{' '}
            <MathView math={resultMath.wn} />
          </div>
        </div>
      )}
    </div>
  );
};