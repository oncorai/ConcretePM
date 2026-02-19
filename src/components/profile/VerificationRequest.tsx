"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Clock, Shield } from "lucide-react";

interface VerificationRequestProps {
  profile: {
    verified: boolean;
    verificationRequested: boolean;
    verificationNotes?: string;
  };
}

export default function VerificationRequest({ profile }: VerificationRequestProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRequestVerification = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/profile/verification", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to request verification");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to request verification");
    } finally {
      setLoading(false);
    }
  };

  if (profile.verified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            Verified Contractor
          </CardTitle>
          <CardDescription className="text-green-700">
            Your profile has been verified and you have access to all platform features.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (profile.verificationRequested) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Clock className="h-5 w-5" />
            Verification Pending
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Your verification request is being reviewed. We'll notify you once it's approved.
          </CardDescription>
        </CardHeader>
        {profile.verificationNotes && (
          <CardContent>
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> {profile.verificationNotes}
            </p>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Profile Verification
        </CardTitle>
        <CardDescription>
          Verify your profile to build trust and access all platform features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Benefits of Verification:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Verified badge on your profile</li>
              <li>Priority in worker search results</li>
              <li>Access to premium features</li>
              <li>Build trust with workers</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Requirements:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Complete company information</li>
              <li>Valid business license</li>
              <li>Proof of insurance</li>
              <li>Company website or documentation</li>
            </ul>
          </div>

          <Button 
            onClick={handleRequestVerification} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Requesting..." : "Request Verification"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}