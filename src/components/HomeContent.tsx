import React from 'react';
import { Activity, Compass, Sliders, Settings2, Zap } from 'lucide-react';

import { ModellingSection } from './systems/ModellingSection';
import { SystemAnalysisSection } from './systems/SystemAnalysisSection';
import { ControlDesignSection } from './systems/ControlDesignSection';
import { SamplingInterpolationSection } from './systems/SamplingInterpolationSection';

interface HomeContentProps {
  onInitialize: () => void;
}

export const HomeContent: React.FC<HomeContentProps> = ({ onInitialize }) => {
  return (
    <div className="home-container">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-badge">
          <Zap size={10} style={{ color: 'var(--sky-blue)' }} />
          <span className="hero-badge-text">
            Systems Theory and Control Engine
          </span>
        </div>
        <h1 className="hero-title">Control Systems Simulator</h1>
        <p className="hero-description">
          An interactive, high-performance toolkit designed to trace frequencies, design compensators, and map transfer functions. Perfect for analyzing transient and frequency responses.
        </p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={onInitialize}> Initialize New System</button>
          <button className="secondary-btn">Load Template</button>
        </div>
      </div>

      {/* Quick Analytics Engines */}
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

      {/* Interactive Systems Theory Collapsible Sections */}
      <h2 className="section-label" style={{ marginTop: '28px' }}>
        Core Systems Theory Modules
      </h2>
      <div className="systems-interactive-container">
        <ModellingSection />
        <SystemAnalysisSection />
        <ControlDesignSection />
        <SamplingInterpolationSection />
      </div>

      {/* Status Panel */}
      <div className="status-panel" style={{ marginTop: '24px' }}>
        <div className="status-header">
          <div className="status-header-title">
            <Settings2 size={14} style={{ color: 'var(--sky-blue)' }} />
            <span>Core Calculator Engines</span>
          </div>
          <span className="status-header-subtitle">Idle Thread Status</span>
        </div>
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