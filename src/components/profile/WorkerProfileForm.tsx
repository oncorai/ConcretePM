"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import WorkHistorySection from "./WorkHistorySection";
import PrivacySettings from "./PrivacySettings";
import { 
  User, 
  Phone, 
  MapPin, 
  Award,
  Plus,
  Trash2
} from "lucide-react";

interface WorkerProfileFormProps {
  profile: any;
}

export default function WorkerProfileForm({ profile }: WorkerProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [newSkill, setNewSkill] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      location: formData.get("location") as string,
      experience: parseInt(formData.get("experience") as string) || 0,
      skills,
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

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Full Name</Label>
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
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  defaultValue={profile?.experience || 0}
                />
              </div>
            </div>

            <div>
              <Label>Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" onClick={addSkill} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="pr-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
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
            <Award className="h-5 w-5" />
            Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile?.certifications.length > 0 ? (
            <div className="space-y-3">
              {profile.certifications.map((cert: any) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{cert.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cert.issuer} • Issued {new Date(cert.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={cert.verified ? "success" : "secondary"}>
                    {cert.verified ? "Verified" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No certifications added yet.</p>
          )}
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </CardContent>
      </Card>

      <WorkHistorySection 
        workHistory={profile?.workHistory || []} 
        workerId={profile?.id || ""} 
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-secondary">
              <p className="text-2xl font-bold">{profile?.totalPoints || 0}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary">
              <p className="text-2xl font-bold">Level {profile?.currentLevel || 1}</p>
              <p className="text-sm text-muted-foreground">Current Level</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary">
              <p className="text-2xl font-bold">{profile?.currentStreak || 0} days</p>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PrivacySettings 
        settings={{
          profileVisibility: profile?.profileVisibility || "PUBLIC",
          showEmail: profile?.showEmail,
          showPhone: profile?.showPhone || true,
          showLocation: profile?.showLocation || true,
        }}
      />
    </div>
  );
}