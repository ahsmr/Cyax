import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { HomeContent } from './components/HomeContent';
import type { Tab } from './types';
import SystemAnalysis from './components/SystemAnalysis';

type ViewType = 'home' | 'analysis';

export default function App() {
  // State for managing tabs and the active tab
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'tab-1', title: 'Home Dashboard', createdAt: Date.now() },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [tabViews, setTabViews] = useState<Record<string, ViewType>>({
    'tab-1': 'home',
  });

  // Triggers cloning of active workspace homepage
  const addTab = (viewType: ViewType = 'home', customTitle?: string) => {
    const newId = `tab-${Math.random().toString(36).substr(2, 9)}`;
    const count = tabs.filter((t) => t.title.startsWith('Home Dashboard')).length + 1;
    
    const newTab: Tab = {
      id: newId,
      title: customTitle || `Home Dashboard (${count})`,
      createdAt: Date.now(),
    };
    
    setTabs((prev) => [...prev, newTab]);
    setTabViews((prev) => ({ ...prev, [newId]: viewType }));
    setActiveTabId(newId);
  };

  // Closes a specific tab tab safely
  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Prevent closing the final home

    const currentIdx = tabs.findIndex((t) => t.id === id);
    const updatedTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(updatedTabs);

    setTabViews((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    if (activeTabId === id) {
      const fallbackTab = updatedTabs[currentIdx - 1] || updatedTabs[0];
      setActiveTabId(fallbackTab.id);
    }
  };

  return (
    <div className="app-container">
      {/* Top OS Window style bar and tabs */}
      <TopBar
        tabs={tabs}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
        addTab={() => addTab('home')}
        closeTab={closeTab}
      />

      {/* Workspace Panel */}
      <div className="workspace-container">
        <Sidebar />

        {/* Home Sandbox Container */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                opacity: tab.id === activeTabId ? 1 : 0,
                pointerEvents: tab.id === activeTabId ? 'auto' : 'none',
                transition: 'opacity 0.15s ease',
              }}
            >
              {tabViews[tab.id] === 'analysis' ? (
                <SystemAnalysis />
              ) : (
                <HomeContent
                  onInitialize={() => addTab('analysis', 'System Analysis')}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}