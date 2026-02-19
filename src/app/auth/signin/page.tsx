"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting sign in with:", email);

      const result: any = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("Sign in result:", JSON.stringify(result, null, 2));

      if (result?.error) {
        console.error("Sign in error:", result.error);
        setError(`Login failed: ${result.error}`);
        setLoading(false);
      } else if (result?.ok) {
        console.log("Sign in successful, redirecting...");
        // Use router instead of window.location
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 100);
      } else {
        console.error("Unexpected result:", result);
        setError("Sign in failed - unexpected response");
        setLoading(false);
      }
    } catch (err) {
      console.error("Sign in exception:", err);
      setError("An error occurred during sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
                <Trophy className="h-5 w-5 text-yellow-900" />
              </div>
              <span className="font-semibold text-lg text-white">Leaderboards</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 items-center justify-center shadow-md mb-4">
            <Trophy className="h-7 w-7 text-yellow-900" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-card border border-gray-700 rounded-lg p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-blue-500 hover:text-blue-400">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            ← Back to home
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
