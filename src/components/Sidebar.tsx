import React, { useState } from 'react';
import { ChevronRight, LayoutDashboard, Database, Activity, Code, Layers } from 'lucide-react';
import type { SidebarSection } from '../types';

const COMPONENT_SECTIONS: SidebarSection[] = [
  { 
    id: 'core-systems',
    title: 'Core Systems',
    items: [
      { id: 'bode-plotter', label: 'Bode & Root Locus', path: '/bode' },
      { id: 'tf-calc', label: 'Transfer Solver', path: '/transfer' },
    ],
  },
  {
    id: 'analytics',
    title: 'Dynamic Analysis',
    items: [
      { id: 'transient', label: 'Transient Response', path: '/transient' },
      { id: 'stability', label: 'Routh-Hurwitz Check', path: '/stability' },
    ],
  },
  {
    id: 'simulation',
    title: 'Simulation Sandbox',
    items: [
      { id: 'step', label: 'Step Generator', path: '/signals' },
      { id: 'state-matrices', label: 'State-Space Matrices', path: '/statespace' },
    ],
  },
  {
    id: 'workspace',
    title: 'Reference Workspace',
    items: [
      { id: 'cheatsheets', label: 'Systeemtheorie Cheatsheet', path: '/cheatsheet' },
      { id: 'states', label: 'Saved Systems', path: '/saved' },
    ],
  },
];
// Sidebar component for the application
export const Sidebar: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'core-systems': true,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectIcon = (id: string) => {
    switch (id) {
      case 'core-systems': return <Layers size={13} style={{ color: 'var(--sky-blue)' }} />;
      case 'analytics': return <Activity size={13} style={{ color: '#10b981' }} />;
      case 'simulation': return <Code size={13} style={{ color: '#a855f7' }} />;
      default: return <Database size={13} style={{ color: '#f59e0b' }} />;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className="action-btn">
          <div className="action-inner">
            <LayoutDashboard size={13} />
            <span>Workspace Panel</span>
          </div>
          <span className="hotkey-badge">⌘N</span>
        </button>
      </div>

      <div className="sidebar-content">
        {COMPONENT_SECTIONS.map((section) => {
          const isExpanded = !!expandedSections[section.id];
          return (
            <div key={section.id} className="accordion-section">
              <button
                onClick={() => toggleSection(section.id)}
                className="accordion-trigger"
              >
                <div className="trigger-title-wrapper">
                  {selectIcon(section.id)}
                  <span className="trigger-title">{section.title}</span>
                </div>
                {/* Single chevron with dynamic class for rotation */}
                <ChevronRight 
                  size={14} 
                  className={`chevron-icon ${isExpanded ? 'rotated' : ''}`} 
                />
              </button>

              <div className={`accordion-drawer ${isExpanded ? 'expanded' : ''}`}>
                <div className="drawer-items-list">
                  {section.items.map((item) => (
                    <button key={item.id} className="drawer-item">
                      <span>{item.label}</span>
                      <span className="item-indicator" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="profile-section">
          <div className="profile-avatar">KU</div>
          <div className="profile-info">
            <span className="profile-name">Leuven Workspace</span>
            <span className="profile-role">Offline Standby</span>
          </div>
        </div>
        <div className="status-dot" />
      </div>
    </aside>
  );
};