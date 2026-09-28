import React from 'react';
import { Activity, Compass, Sliders, Settings2, Zap } from 'lucide-react';

import { ModellingSection } from './systems/ModellingSection';
import { SystemAnalysisSection } from './systems/SystemAnalysisSection';
import { ControlDesignSection } from './systems/ControlDesignSection';
import { SamplingInterpolationSection } from './systems/SamplingInterpolationSection';

/**
 * * HomeContentProps
 * Defines the props interface for the HomeContent dashboard landing view.
 * @property onInitialize - Callback function triggered when initializing a new system analysis tab.
 */
interface HomeContentProps {
  onInitialize: () => void;
}

/**
 * * HomeContent Component
 * The main launchpad / dashboard view for the Cyax application.
 * Serves as the central hub for quick-launching analysis engines (Bode, Root Locus, State-Space),
 * accessing interactive core theory modules, and viewing engine health metrics.
 * 
 * @param {HomeContentProps} props - Component properties containing execution callbacks.
 * @returns {JSX.Element} The rendered dashboard layout.
 */
export const HomeContent: React.FC<HomeContentProps> = ({ onInitialize }) => {
  return (
    <div className="home-container">

      {/* ==========================================
          1. HERO BANNER (Workspace Launchpad)
          ========================================== */}
      <div className="hero-banner">

        {/* Category Badge */}
        <div className="hero-badge">
          <Zap size={10} style={{ color: 'var(--sky-blue)' }} />
          <span className="hero-badge-text">
            Systems Theory and Control Engine
          </span>
        </div>

        {/* Main Title & Description */}
        <h1 className="hero-title">Control Systems Simulator</h1>
        <p className="hero-description">
          An interactive, high-performance toolkit designed to trace frequencies, design compensators, and map transfer functions. Perfect for analyzing transient and frequency responses.
        </p>

        {/* Workspace Action Buttons */}
        <div className="hero-actions">

          {/* * Spawns a new System Analysis workspace tab in App.tsx */}
          <button className="primary-btn" onClick={onInitialize}> Initialize New System</button>

          {/* TODO: Implement pre-configured control system templates picker */}
          <button className="secondary-btn">Load Template</button>
        </div>
      </div>

      {/* ==========================================
          2. QUICK ANALYTICS ENGINES (Feature Cards)
          ========================================== */}
      <h2 className="section-label">Quick Analytics Engines</h2>
      <div className="card-grid">
        <div className="card">
          <div>
            <div className="card-icon-wrapper icon-blue">
              <Activity size={16} />
            </div>
            <h3 className="card-title">Bode Plotter</h3>
            <p className="card-body">Calculate gain margins (GM) and phase margins (PM) visually.</p>
          </div>
          <span className="card-link">Launch Module →</span>
        </div>

        <div className="card">
          <div>
            <div className="card-icon-wrapper icon-green">
              <Compass size={16} />
            </div>
            <h3 className="card-title">Root Locus Map</h3>
            <p className="card-body">Determine root trajectory lines dynamically with gain increments.</p>
          </div>
          <span className="card-link">Launch Module →</span>
        </div>

        <div className="card">
          <div>
            <div className="card-icon-wrapper icon-purple">
              <Sliders size={16} />
            </div>
            <h3 className="card-title">State-Space Model</h3>
            <p className="card-body">Extract transient characteristics and verify complete observability.</p>
          </div>
          <span className="card-link">Launch Module →</span>
        </div>
      </div>

      {/* ==========================================
          3. CORE SYSTEMS THEORY MODULES (Interactive Collapsibles)
          ========================================== */}
      <h2 className="section-label" style={{ marginTop: '28px' }}>
        Core Systems Theory Modules
      </h2>

      {/* 
        ? Interactive accordions/collapsible panels housing state-space equations,
        ? transfer function derivation, control design, and discretization tools.
      */}
      <div className="systems-interactive-container">
        <ModellingSection />
        <SystemAnalysisSection />
        <ControlDesignSection />
        <SamplingInterpolationSection />
      </div>

      {/* ==========================================
          4. STATUS PANEL (Engine Diagnostics & Health)
          ========================================== */}
      <div className="status-panel" style={{ marginTop: '24px' }}>
        <div className="status-header">
          <div className="status-header-title">
            <Settings2 size={14} style={{ color: 'var(--sky-blue)' }} />
            <span>Core Calculator Engines</span>
          </div>
          <span className="status-header-subtitle">Idle Thread Status</span>
        </div>

        {/* Engine Performance Metrics Grid */}

        {/* TODO: Replace hardcoded values with dynamic engine metrics from state or context*/}
        <div className="status-metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Engine Memory</span>
            <span className="metric-value cyan">18.4 MB</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Thread Safety</span>
            <span className="metric-value green">Nominal</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Active Modules</span>
            <span className="metric-value purple">4 Active</span>
          </div>
          <div className="metric-box">
            <span className="metric-label">Workspace Synced</span>
            <span className="metric-value amber">Standby</span>
          </div>
        </div>
      </div>
    </div>
  );
};