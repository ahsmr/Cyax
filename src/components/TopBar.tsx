import React from "react";
import { Plus, X, Code2 } from "lucide-react";
import type { Tab } from "../types";
import packageJson from "../../package.json";

const GITHUB_REPO_URL = "https://github.com/ahsmr/Cyax";

interface TopBarProps {
  tabs: Tab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  addTab: () => void;
  closeTab: (id: string, e: React.MouseEvent) => void;
}

// Export this since the top bar is a core component of the app and will be used in multiple places, including the main App component.
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
      <div
        className="window-controls"
        style={{ width: "auto", minWidth: "unset", paddingRight: "12px" }}
      >
        <div className="app-branding">
          <img
            src="./logo_square_transparent.png"
            alt="CYAX Logo"
            className="app-logo-img"
          />
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
                className={`chrome-tab ${isActive ? "active" : ""}`}
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
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="util-btn"
          title="View Cyax Repository on GitHub"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <Code2 size={14} />
        </a>
        <span className="version-badge">v{packageJson.version}</span>
      </div>
    </header>
  );
};
