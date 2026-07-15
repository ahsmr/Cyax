import React from 'react';
import { Plus, X, Settings, Bell } from 'lucide-react';
import type { Tab } from '../types';

interface TopBarProps {
  tabs: Tab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  addTab: () => void;
  closeTab: (id: string, e: React.MouseEvent) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  tabs,
  activeTabId,
  setActiveTabId,
  addTab,
  closeTab,
}) => {
  return (
    <header className="top-bar">
      {/* OS Simulation Window Buttons and branding */}
      <div className="window-controls">
        <div className="mac-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        
        <div className="app-branding">
          <div className="app-logo">C</div>
          <span className="app-name">CYAX</span>
        </div>
      </div>

      {/* Chrome Tab Center Workspace */}
      <div className="tabs-container">
        <div className="tabs-list">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`chrome-tab ${isActive ? 'active' : ''}`}
              >
                <span className="tab-title">{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="close-tab-btn"
                  >
                    <X size={10} />
                  </button>
                )}
                {isActive && <div className="active-tab-line" />}
              </div>
            );
          })}

          <button
            onClick={addTab}
            className="add-tab-btn"
            title="Clone current workspace"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Desktop utilities on the right */}
      <div className="system-utilities">
        <button className="util-btn">
          <Bell size={14} />
        </button>
        <button className="util-btn">
          <Settings size={14} />
        </button>
        <span className="version-badge">v0.0.0.1</span>
      </div>
    </header>
  );
};