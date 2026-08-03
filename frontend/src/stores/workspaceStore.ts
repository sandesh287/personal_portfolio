import { create } from "zustand";

type WorkspacePanel = "home" | "projects" | "blog" | "resume" | "github" | "admin";

interface WorkspaceState {
  activePanel: WorkspacePanel;
  setActivePanel: (panel: WorkspacePanel) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activePanel: "home",
  setActivePanel: (activePanel) => set({ activePanel }),
}));
