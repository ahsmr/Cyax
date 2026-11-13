import React, { useState } from "react";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { HomeContent } from "./components/HomeContent";
import type { Tab } from "./types";
import SystemAnalysis from "./components/SystemAnalysis";
import {
  StandaloneTransferModule,
  type ModuleType,
} from "./components/StandaloneTransferModule";

/**
 * * ViewType
 * Defines the allowed view components mounted inside a tab workspace.
 * - 'home': Default workspace dashboard / sandbox launchpad.
 * - 'analysis': Systems theory state space / control analysis tool.
 * - 'bode' | 'nyquist' | 'impulse': Standalone transfer function analysis modules.
 */
type ViewType = "home" | "analysis" | ModuleType;

/**
 * Root component of the Cyax application.
 * Manages multi-tab workspace layouts, active tab view states ('home' | 'analysis' | 'bode' | 'nyquist' | 'impulse'),
 * and maintains DOM states across tabs using a keep-alive visibility model.
 *
 * @returns {JSX.Element} The top-level workspace layout with header, sidebar, and tab views.
 */
export default function App() {
  // ==========================================
  // 1. STATE MANAGEMENT (Tabs & Workspace Views)
  // ==========================================

  // * Master array of open tabs (maintains tab order & metadata)
  const [tabs, setTabs] = useState<Tab[]>(() => [
    { id: "tab-1", title: "Home Dashboard", createdAt: Date.now() },
  ]);

  // * Pointer ID to the currently visible/focused tab
  const [activeTabId, setActiveTabId] = useState<string>("tab-1");

  // * Dictionary mapping each tab ID to its view content
  const [tabViews, setTabViews] = useState<Record<string, ViewType>>({
    "tab-1": "home",
  });

  // ==========================================
  // 2. TAB LIFECYCLE HANDLERS
  // ==========================================

  /**
   * Creates a new tab and focuses it immediately.
   *
   * @param viewType The initial view component to render inside the tab (defaults to 'home')
   * @param customTitle Optional explicit title (e.g., 'System Analysis')
   */
  const addTab = (viewType: ViewType = "home", customTitle?: string) => {
    // Generate a short unique ID string (e.g., "tab-a8f3k2x9q")
    const newId = `tab-${Math.random().toString(36).substr(2, 9)}`;

    // Auto-increment default titles based on current Home count
    const count =
      tabs.filter((t) => t.title.startsWith("Home Dashboard")).length + 1;

    const newTab: Tab = {
      id: newId,
      title: customTitle || `Home Dashboard (${count})`,
      createdAt: Date.now(),
    };

    // Batch state updates for new tab registration
    setTabs((prev) => [...prev, newTab]);
    setTabViews((prev) => ({ ...prev, [newId]: viewType }));
    setActiveTabId(newId);
  };

  /**
   * Opens a new standalone transfer function module tab (Bode, Nyquist, or Impulse Response).
   *
   * @param moduleType The standalone engine type to mount inside the new tab
   */
  const openStandaloneModule = (moduleType: ModuleType) => {
    const moduleTitles: Record<ModuleType, string> = {
      bode: "Bode Plotter",
      nyquist: "Nyquist Diagram",
      impulse: "Impulse Response",
    };

    addTab(moduleType, moduleTitles[moduleType]);
  };

  /**
   * Safely removes a tab and falls back focus to an adjacent active tab.
   *
   * @param id Unique string ID of the target tab to close
   * @param e Mouse event trigger from the tab close button
   */
  const closeTab = (id: string, e: React.MouseEvent) => {
    // ! CRITICAL: Stop click propagation so closing a tab doesn't trigger tab selection
    e.stopPropagation();

    // ! SAFETY GUARD: Prevent closing the last remaining tab in the workspace
    if (tabs.length === 1) return;

    const currentIdx = tabs.findIndex((t) => t.id === id);
    const updatedTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(updatedTabs);

    // Clean up mapping reference in tabViews
    setTabViews((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    // * Smart Tab Fallback: If closing the active tab, pivot to adjacent tab on left
    if (activeTabId === id) {
      const fallbackTab = updatedTabs[currentIdx - 1] || updatedTabs[0];
      setActiveTabId(fallbackTab.id);
    }
  };

  // ==========================================
  // 3. LAYOUT & VIEW RENDERING
  // ==========================================

  return (
    <div className="app-container">
      {/* Top OS Window style bar and tabs */}
      <TopBar
        tabs={tabs}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
        addTab={() => addTab("home")}
        closeTab={closeTab}
      />

      {/* Workspace Panel */}
      <div className="workspace-container">
        <Sidebar />

        {/* Home Sandbox Container */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {tabs.map((tab) => {
            const view = tabViews[tab.id];

            return (
              <div
                key={tab.id}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  opacity: tab.id === activeTabId ? 1 : 0,
                  pointerEvents: tab.id === activeTabId ? "auto" : "none",
                  transition: "opacity 0.15s ease",
                }}
              >
                {view === "analysis" ? (
                  <SystemAnalysis />
                ) : view === "bode" ||
                  view === "nyquist" ||
                  view === "impulse" ? (
                  <StandaloneTransferModule moduleType={view} />
                ) : (
                  <HomeContent
                    onInitialize={() => addTab("analysis", "System Analysis")}
                    onOpenStandaloneModule={openStandaloneModule}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
