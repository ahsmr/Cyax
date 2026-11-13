import React from "react";
import { Activity, Compass, Waves, Settings2, Zap } from "lucide-react";
import type { ModuleType } from "./StandaloneTransferModule";

/**
 * HomeContentProps
 * Defines the props interface for the HomeContent dashboard landing view.
 * @property onInitialize - Callback function triggered when initializing a new system analysis tab.
 * @property onOpenStandaloneModule - Callback function triggered when launching a standalone transfer function tab (Bode, Nyquist, or Impulse).
 */
interface HomeContentProps {
  onInitialize: () => void;
  onOpenStandaloneModule: (moduleType: ModuleType) => void;
}

/**
 * HomeContent Component
 * The main launchpad / dashboard view for the Cyax application.
 * Serves as the central hub for launching the Block Diagram System Analyzer
 * and standalone transfer function engines (Bode, Nyquist, Impulse Response).
 *
 * @param {HomeContentProps} props Component properties containing execution callbacks.
 * @returns {JSX.Element} The rendered dashboard layout.
 */
export const HomeContent: React.FC<HomeContentProps> = ({
  onInitialize,
  onOpenStandaloneModule,
}) => {
  return (
    <div className="home-container">
      {/* ==========================================
          1. HERO BANNER (Workspace Launchpad)
          ========================================== */}
      <div className="hero-banner">
        {/* Category Badge */}
        <div className="hero-badge">
          <Zap size={10} style={{ color: "var(--sky-blue)" }} />
          <span className="hero-badge-text">
            Systems Theory and Control Engine
          </span>
        </div>

        {/* Main Title & Description */}
        <h1 className="hero-title">Control Systems Simulator</h1>
        <p className="hero-description">
          An interactive, high-performance toolkit designed to model block
          diagrams, derive continuous state-space realizations, and evaluate
          transfer function responses in time and frequency domains.
        </p>

        {/* Workspace Action Buttons */}
        <div className="hero-actions">
          {/* Spawns a new System Analysis workspace tab in App.tsx */}
          <button className="primary-btn" onClick={onInitialize}>
            Initialize New System
          </button>
        </div>
      </div>

      {/* ==========================================
          2. QUICK ANALYTICS ENGINES (Standalone Modules)
          ========================================== */}
      <h2 className="section-label">Standalone Transfer Function Engines</h2>
      <div className="card-grid">
        {/* Standalone Bode Plotter Card */}
        <div
          className="card"
          onClick={() => onOpenStandaloneModule("bode")}
          style={{ cursor: "pointer" }}
        >
          <div>
            <div className="card-icon-wrapper icon-blue">
              <Activity size={16} />
            </div>
            <h3 className="card-title">Bode Plotter</h3>
            <p className="card-body">
              Enter transfer function polynomials to compute magnitude (dB) and
              unwrapped phase frequency responses.
            </p>
          </div>
          <span className="card-link">Launch Module →</span>
        </div>

        {/* Standalone Nyquist Diagram Card */}
        <div
          className="card"
          onClick={() => onOpenStandaloneModule("nyquist")}
          style={{ cursor: "pointer" }}
        >
          <div>
            <div className="card-icon-wrapper icon-green">
              <Compass size={16} />
            </div>
            <h3 className="card-title">Nyquist Diagram</h3>
            <p className="card-body">
              Plot complex frequency loci and inspect encirclements around the
              (-1, j0) critical stability point.
            </p>
          </div>
          <span className="card-link">Launch Module →</span>
        </div>

        {/* Standalone Impulse Response Card */}
        <div
          className="card"
          onClick={() => onOpenStandaloneModule("impulse")}
          style={{ cursor: "pointer" }}
        >
          <div>
            <div className="card-icon-wrapper icon-purple">
              <Waves size={16} />
            </div>
            <h3 className="card-title">Impulse Response h(t)</h3>
            <p className="card-body">
              Derive closed-form time-domain responses via analytic inverse
              Laplace transformation.
            </p>
          </div>
          <span className="card-link">Launch Module →</span>
        </div>
      </div>

      {/* ==========================================
          3. STATUS PANEL (Engine Diagnostics & Health)
          ========================================== */}
      <div className="status-panel" style={{ marginTop: "28px" }}>
        <div className="status-header">
          <div className="status-header-title">
            <Settings2 size={14} style={{ color: "var(--sky-blue)" }} />
            <span>Core Calculator Engines</span>
          </div>
          <span className="status-header-subtitle">Offline LTI Runtime</span>
        </div>

        {/* Engine Capabilities Grid */}
        <div className="status-metrics-grid">
          <div className="metric-box">
            <span className="metric-label">State-Space Solver</span>
            <span className="metric-value cyan">Continuous LTI</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Symbolic Reduction</span>
            <span className="metric-value green">Euclidean GCD</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Standalone Engines</span>
            <span className="metric-value purple">3 Active</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Execution Mode</span>
            <span className="metric-value amber">Local / Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};
