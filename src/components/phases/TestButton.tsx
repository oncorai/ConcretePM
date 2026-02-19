"use client";

import { Button } from "@/components/ui/button";

export function TestButton() {
  return (
    <Button
      onClick={() => alert('Test button clicked!')}
      variant="outline"
      size="sm"
    >
      Test Button
    </Button>
  );
}