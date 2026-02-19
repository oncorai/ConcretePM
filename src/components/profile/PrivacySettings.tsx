"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Eye, Users, Lock } from "lucide-react";

interface PrivacySettingsProps {
  settings: {
    profileVisibility: string;
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
}

export default function PrivacySettings({ settings }: PrivacySettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState(settings.profileVisibility);
  const [showEmail, setShowEmail] = useState(settings.showEmail);
  const [showPhone, setShowPhone] = useState(settings.showPhone);
  const [showLocation, setShowLocation] = useState(settings.showLocation);

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/profile/privacy", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileVisibility: visibility,
          showEmail,
          showPhone,
          showLocation,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update privacy settings");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to update privacy settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control who can see your profile and what information is visible
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Profile Visibility
          </Label>
          <div className="space-y-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={visibility === "PUBLIC"}
                onChange={(e) => setVisibility(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">Public</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Anyone can view your profile
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="CONTRACTORS"
                checked={visibility === "CONTRACTORS"}
                onChange={(e) => setVisibility(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Contractors Only</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Only verified contractors can view your profile
                </p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                checked={visibility === "PRIVATE"}
                onChange={(e) => setVisibility(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="font-medium">Private</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Only you can view your profile
                </p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold mb-3 block">
            Information Visibility
          </Label>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Show email address</span>
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                className="h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Show phone number</span>
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(e) => setShowPhone(e.target.checked)}
                className="h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Show location</span>
              <input
                type="checkbox"
                checked={showLocation}
                onChange={(e) => setShowLocation(e.target.checked)}
                className="h-4 w-4"
              />
            </label>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}