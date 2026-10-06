import React, { useState } from "react";
import {
  ChevronRight,
  LayoutDashboard,
  Database,
  Activity,
  Code,
  Layers,
} from "lucide-react";
import type { SidebarSection } from "../types";

/**
 * * COMPONENT_SECTIONS
 * Static configuration defining the hierarchical navigation menu in the sidebar.
 * Categorized into domain-specific sections for systems theory and control simulation.
 */
const COMPONENT_SECTIONS: SidebarSection[] = [
  {
    id: "core-systems",
    title: "Core Systems",
    items: [
      { id: "bode-plotter", label: "Bode & Root Locus", path: "/bode" },
      { id: "tf-calc", label: "Transfer Solver", path: "/transfer" },
    ],
  },
  {
    id: "analytics",
    title: "Dynamic Analysis",
    items: [
      { id: "transient", label: "Transient Response", path: "/transient" },
      { id: "stability", label: "Routh-Hurwitz Check", path: "/stability" },
    ],
  },
  {
    id: "simulation",
    title: "Simulation Sandbox",
    items: [
      { id: "step", label: "Step Generator", path: "/signals" },
      {
        id: "state-matrices",
        label: "State-Space Matrices",
        path: "/statespace",
      },
    ],
  },
  {
    id: "workspace",
    title: "Reference Workspace",
    items: [
      {
        id: "cheatsheets",
        label: "Systeemtheorie Cheatsheet",
        path: "/cheatsheet",
      },
      { id: "states", label: "Saved Systems", path: "/saved" },
    ],
  },
];

/**
 * * Sidebar Component
 * Primary collapsible navigation bar for Cyax.
 * Renders accordion-style module categories, workspace quick-action triggers,
 * and user environment status indicator.
 *
 * @returns {JSX.Element} The rendered sidebar container.
 */
export const Sidebar: React.FC = () => {
  // ==========================================
  // 1. STATE & HELPER FUNCTIONS
  // ==========================================

  // * Tracks accordion open/closed toggle states using section IDs as keys
  // ? Initialized with 'core-systems' expanded by default for immediate accessibility
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    "core-systems": true,
  });

  /**
   * Toggles the expanded/collapsed visibility of a specific sidebar section.
   *
   * @param id - The unique section ID to toggle
   */
  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  /**
   * Helper utility mapping section IDs to their corresponding Lucide SVG icons and theme colors.
   *
   * @param id - Target section identifier
   * @returns {JSX.Element} Styled Lucide icon element
   */
  const selectIcon = (id: string) => {
    switch (id) {
      case "core-systems":
        return <Layers size={13} style={{ color: "var(--sky-blue)" }} />;
      case "analytics":
        return <Activity size={13} style={{ color: "#10b981" }} />;
      case "simulation":
        return <Code size={13} style={{ color: "#a855f7" }} />;
      default:
        return <Database size={13} style={{ color: "#f59e0b" }} />;
    }
  };

  // ==========================================
  // 2. LAYOUT & RENDER TREE
  // ==========================================
  return (
    <aside className="sidebar">
      {/* --- SIDEBAR HEADER: Quick Actions --- */}
      <div className="sidebar-header">
        {/* TODO: Bind click listener to trigger global command palette or new tab creation */}
        <button className="action-btn">
          <div className="action-inner">
            <LayoutDashboard size={13} />
            <span>Workspace Panel</span>
          </div>
          {/* Keyboard shortcut badge */}
          <span className="hotkey-badge">⌘N</span>
        </button>
      </div>

      {/* --- SIDEBAR NAVIGATION CONTENT --- */}
      <div className="sidebar-content">
        {COMPONENT_SECTIONS.map((section) => {
          // Double negation cast converts undefined lookup values safely to boolean
          const isExpanded = !!expandedSections[section.id];

          return (
            <div key={section.id} className="accordion-section">
              {/* Accordion Trigger Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="accordion-trigger"
              >
                <div className="trigger-title-wrapper">
                  {selectIcon(section.id)}
                  <span className="trigger-title">{section.title}</span>
                </div>

                {/* Animated Chevron: Rotates when expanded via CSS transition class */}
                <ChevronRight
                  size={14}
                  className={`chevron-icon ${isExpanded ? "rotated" : ""}`}
                />
              </button>

              {/* Accordion Drawer Panel */}
              <div
                className={`accordion-drawer ${isExpanded ? "expanded" : ""}`}
              >
                <div className="drawer-items-list">
                  {section.items.map((item) => (
                    /* TODO: Attach router navigation or active tab state change on item click */
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

      {/* --- SIDEBAR FOOTER: Environment Info --- */}
      <div className="sidebar-footer">
        <div className="profile-section">
          {/* KU Leuven avatar badge */}
          <div className="profile-avatar">KU</div>
          <div className="profile-info">
            <span className="profile-name">Leuven Workspace</span>
            <span className="profile-role">Offline Standby</span>
          </div>
        </div>
        {/* Engine connectivity status indicator */}
        <div className="status-dot" />
      </div>
    </aside>
  );
};
