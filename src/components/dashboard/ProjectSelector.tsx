'use client';

import { useProject } from '@/context/ProjectContext';
import { useState } from 'react';
import { ChevronDown, Plus, FolderOpen } from 'lucide-react';
import Link from 'next/link';

export default function ProjectSelector() {
  const { projects, selectedProject, setSelectedProject, loading } = useProject();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <FolderOpen className="h-4 w-4" />
        <span>Loading...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Link
        href="/dashboard/projects/new"
        className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        <span>Create Project</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80 min-w-[200px]"
      >
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left truncate">
          {selectedProject?.name || 'Select Project'}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 ${
                    selectedProject?.id === project.id ? 'bg-muted' : ''
                  }`}
                >
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 truncate">
                    <p className="font-medium">{project.name}</p>
                    {project.location && (
                      <p className="text-xs text-muted-foreground truncate">{project.location}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-border">
              <Link
                href="/dashboard/projects/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
