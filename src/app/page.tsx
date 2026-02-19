import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, BarChart3, Users, Clock, Target, ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
                <Trophy className="h-5 w-5 text-yellow-900" />
              </div>
              <span className="font-semibold text-lg text-white">Leaderboards</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/api/auth/signin">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative py-32 lg:py-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-8 flex justify-center">
                <div className="rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 shadow-lg">
                  <Trophy className="h-16 w-16 text-yellow-900" />
                </div>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Construction Progress
                <span className="block bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Tracking That Works</span>
              </h1>
              <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
                Compare bid estimates to actual field progress. Track efficiency, identify trends, and empower your teams through real-time visibility.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="group">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white">
                Real-Time Progress Visibility
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                Know exactly where you stand compared to your bid estimates
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-card rounded-lg p-6 shadow-sm border border-gray-700">
                <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Bid vs Actual Tracking</h3>
                <p className="text-gray-300">
                  Compare your original bid estimates against actual hours and progress. Identify variances early.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border border-gray-700">
                <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Daily Progress Entry</h3>
                <p className="text-gray-300">
                  Simple forms for supervisors to enter daily progress, manpower, and equipment usage from the field.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border border-gray-700">
                <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Productivity Trends</h3>
                <p className="text-gray-300">
                  Track productivity improvements over time. See which crews and methods are most efficient.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border border-gray-700">
                <div className="w-12 h-12 bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Team Views</h3>
                <p className="text-gray-300">
                  Compare performance across job sites. Foster healthy competition and share best practices.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border border-gray-700">
                <div className="w-12 h-12 bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Real-time Dashboards</h3>
                <p className="text-gray-300">
                  Visual dashboards show progress at a glance. Know if you're ahead or behind instantly.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border border-gray-700">
                <div className="w-12 h-12 bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Automated Reports</h3>
                <p className="text-gray-300">
                  Generate daily and weekly progress reports automatically. Share insights with stakeholders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics Preview */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white">
                Track What Matters
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                Key metrics that drive construction productivity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="bg-card rounded-xl p-6 shadow-sm border border-gray-700">
                <p className="text-sm font-medium text-gray-400">Actual vs Budget</p>
                <p className="mt-2 text-3xl font-bold text-white">92%</p>
                <p className="mt-2 text-sm text-green-600">↓ 8% under budget</p>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm border border-gray-700">
                <p className="text-sm font-medium text-gray-400">Productivity Rate</p>
                <p className="mt-2 text-3xl font-bold text-white">4.2 ft/hr</p>
                <p className="mt-2 text-sm text-green-600">↑ 15% improvement</p>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm border border-gray-700">
                <p className="text-sm font-medium text-gray-400">Schedule Status</p>
                <p className="mt-2 text-3xl font-bold text-white">On Track</p>
                <p className="mt-2 text-sm text-green-600">2 days ahead</p>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm border border-gray-700">
                <p className="text-sm font-medium text-gray-400">Efficiency Trend</p>
                <p className="mt-2 text-3xl font-bold text-white">+12%</p>
                <p className="mt-2 text-sm text-green-600">vs. last phase</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-blue-900 to-blue-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Start tracking your progress today
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join construction teams improving their productivity through better visibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-yellow-500 hover:bg-yellow-400 text-white font-semibold">
                  Get Started Free
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Leaderboards. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}