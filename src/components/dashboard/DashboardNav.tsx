"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Home,
  Trophy,
  Gift,
  ClipboardList,
  Users,
  LogOut,
  User,
  Target,
  Menu,
  X,
  ChevronRight,
  Activity,
  Award,
  HardHat,
  MessageCircle,
  UserCheck,
  Send
} from "lucide-react";

interface DashboardNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const workerNavItems = [
    { href: "/dashboard", label: "Overview", icon: Home },
    { href: "/dashboard/productivity", label: "Log Activity", icon: Activity },
    { href: "/dashboard/leaderboards", label: "Leaderboards", icon: Trophy },
    { href: "/dashboard/challenges", label: "Challenges", icon: Target },
    { href: "/dashboard/achievements", label: "Achievements", icon: Award },
    { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ];

  const contractorNavItems = [
    { href: "/dashboard", label: "Overview", icon: Home },
    { href: "/dashboard/projects", label: "Projects", icon: ClipboardList },
    { href: "/dashboard/buyout", label: "Buyout", icon: Gift },
    { href: "/dashboard/submittals", label: "Submittals", icon: ClipboardList },
    { href: "/dashboard/rfis", label: "RFIs", icon: MessageCircle },
    { href: "/dashboard/pours", label: "Pour Log", icon: Activity },
    { href: "/dashboard/delays", label: "Delays", icon: HardHat },
    { href: "/dashboard/invoices", label: "Invoices", icon: ClipboardList },
    { href: "/dashboard/daily", label: "Daily Reports", icon: Activity },
  ];

  const navItems = user.role === "WORKER" ? workerNavItems : contractorNavItems;

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-lg bg-card shadow-lg"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-full bg-card border-r border-border shadow-xl">
          {/* Logo and brand */}
          <div className="p-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <HardHat className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-xl">ConcretePM</h1>
                <p className="text-sm text-muted-foreground">Project Management</p>
              </div>
            </Link>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                {user.name?.[0] || user.email?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'animate-pulse' : ''}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${
                    isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                  }`} />
                </Link>
              );
            })}
          </nav>

          {/* Sign out button */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}