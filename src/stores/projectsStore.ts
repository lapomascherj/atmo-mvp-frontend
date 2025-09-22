import { create } from 'zustand';
import { Project } from '@/models/Project';
import projectsMock from '@/mocks/projectsMock';

interface ProjectsState {
  projects: Project[];
  addProjects: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: projectsMock,
  
  addProjects: (project) => set((state) => ({
    projects: [...state.projects, project]
  })),
  
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(project =>
      project.id === id ? { ...project, ...updates } : project
    )
  })),
  
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter(project => project.id !== id)
  })),
  
  getProject: (id) => {
    const state = get();
    return state.projects.find(project => project.id === id);
  }
}));
