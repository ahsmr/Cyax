export interface Tab {
  id: string;
  title: string;
  createdAt: number;
}

export interface SidebarItem {
  id: string;
  label: string;
  path: string;
}

export interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
}