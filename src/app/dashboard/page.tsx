'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { 
  FolderOpen, 
  Package, 
  FileText, 
  MessageCircle, 
  Droplets, 
  Clock, 
  Receipt,
  ClipboardList,
  ArrowRight
} from 'lucide-react';

const modules = [
  { href: '/dashboard/projects', label: 'Projects', icon: FolderOpen, description: 'Manage your construction projects', color: 'bg-blue-500' },
  { href: '/dashboard/buyout', label: 'Buyout', icon: Package, description: 'Track material buyouts and quotes', color: 'bg-green-500' },
  { href: '/dashboard/submittals', label: 'Submittals', icon: FileText, description: 'Product data and approvals', color: 'bg-purple-500' },
  { href: '/dashboard/rfis', label: 'RFIs', icon: MessageCircle, description: 'Requests for information', color: 'bg-yellow-500' },
  { href: '/dashboard/pours', label: 'Pour Log', icon: Droplets, description: 'Concrete placement records', color: 'bg-cyan-500' },
  { href: '/dashboard/delays', label: 'Delays', icon: Clock, description: 'Track project delays', color: 'bg-red-500' },
  { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt, description: 'Invoice tracking and payments', color: 'bg-orange-500' },
  { href: '/dashboard/daily', label: 'Daily Reports', icon: ClipboardList, description: 'Daily progress logs', color: 'bg-indigo-500' },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome to ConcretePM</h1>
        <p className="text-muted-foreground mt-2">
          Your concrete project management command center
        </p>
      </div>

      {/* Quick Stats - placeholder for now */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active Projects</p>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Open RFIs</p>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending Submittals</p>
          <p className="text-2xl font-bold">0</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
          <p className="text-2xl font-bold">$0</p>
        </Card>
      </div>

      {/* Module Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">PM Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href}>
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${module.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{module.label}</h3>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
