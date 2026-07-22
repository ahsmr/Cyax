import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Radio, RefreshCw } from 'lucide-react';
import styles from './SamplingInterpolationSection.module.css';

export const SamplingInterpolationSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [samplingFreq, setSamplingFreq] = useState<string>('100');
  const [maxSignalFreq, setMaxSignalFreq] = useState<string>('30');
  const [samplingResult, setSamplingResult] = useState<string | null>(null);

  const calculateNyquist = () => {
    const fs = parseFloat(samplingFreq);
    const fmax = parseFloat(maxSignalFreq);
    const nyquistRate = 2 * fmax;

    if (fs >= nyquistRate) {
      setSamplingResult(
        `Nyquist Criterion Satisfied (fs = ${fs} Hz ≥ 2*fmax = ${nyquistRate} Hz). Zero-Order Hold (ZOH) reconstructed cleanly without aliasing.`
      );
    } else {
      setSamplingResult(
        `Aliasing Warning! fs (${fs} Hz) is less than Nyquist rate (${nyquistRate} Hz). Increase sampling rate or add anti-aliasing filter.`
      );
    }
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.headerTitle}>
          <Radio size={18} className={styles.iconAmber} />
          <span>4. Sampling & Interpolation</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className={styles.body}>
          <p className={styles.description}>
            Analyze discretization ($s \to z$), Nyquist-Shannon theorem, Zero-Order Hold (ZOH), and signal reconstruction.
          </p>

          <div className={styles.inputGrid}>
            <div className={styles.inputGroup}>
              <label>Sampling Freq fs (Hz):</label>
              <input
                type="number"
                value={samplingFreq}
                onChange={(e) => setSamplingFreq(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Max Signal Freq fmax (Hz):</label>
              <input
                type="number"
                value={maxSignalFreq}
                onChange={(e) => setMaxSignalFreq(e.target.value)}
              />
            </div>
          </div>

          <button className={styles.calcBtn} onClick={calculateNyquist}>
            <RefreshCw size={14} /> Compute Discretization Bounds
          </button>

          {samplingResult && <div className={styles.resultBox}>{samplingResult}</div>}
        </div>
      )}
    </div>
  );
};