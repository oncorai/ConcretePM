'use client';

import { SessionProvider } from 'next-auth/react';
import { ProjectProvider } from '@/context/ProjectContext';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </SessionProvider>
  );
}
