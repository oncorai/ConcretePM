"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import VerificationRequest from "./VerificationRequest";
import { 
  User, 
  Phone, 
  MapPin, 
  Building2
} from "lucide-react";

interface ContractorProfileFormProps {
  profile: any;
}

export default function ContractorProfileForm({ profile }: ContractorProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      company: formData.get("company") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      location: formData.get("location") as string,
    };

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      router.refresh();
    } catch (error) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={profile?.user.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={profile?.user.email}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  name="company"
                  defaultValue={profile?.company}
                  required
                  placeholder="ABC Construction Inc."
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  defaultValue={profile?.phoneNumber}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={profile?.location}
                  placeholder="City, State"
                />
              </div>
              <div className="flex items-end">
                <div>
                  <Label>Verification Status</Label>
                  <Badge 
                    variant={profile?.verified ? "success" : "secondary"}
                    className="mt-2"
                  >
                    {profile?.verified ? "Verified" : "Pending Verification"}
                  </Badge>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-secondary">
              <p className="text-2xl font-bold">{profile?.teams?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Teams Created</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary">
              <p className="text-2xl font-bold">{profile?.jobPostings?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Job Postings</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary">
              <p className="text-2xl font-bold">
                {new Date(profile?.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">Member Since</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <VerificationRequest 
        profile={{
          verified: profile?.verified,
          verificationRequested: profile?.verificationRequested,
          verificationNotes: profile?.verificationNotes,
        }}
      />
    </div>
  );
}