'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LeaderboardsView from '@/components/leaderboards/LeaderboardsView';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentWorker, setCurrentWorker] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      // Fetch or construct current worker data from session
      setCurrentWorker({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      });
    }
  }, [session]);

  if (status === 'loading' || !currentWorker) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading leaderboards...</div>
      </div>
    );
  }

  return <LeaderboardsView currentWorker={currentWorker} />;
}
