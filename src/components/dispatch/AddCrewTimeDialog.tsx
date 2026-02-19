"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddCrewTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; time: string }) => void;
  projectName: string;
}

export default function AddCrewTimeDialog({
  open,
  onOpenChange,
  onSubmit,
  projectName,
}: AddCrewTimeDialogProps) {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("7:00 AM");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), time: startTime });
      setName("");
      setStartTime("7:00 AM");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Crew</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Add a new crew to {projectName}
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Crew Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Crew 1, Crew A, Morning Crew"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
            <select
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 mt-2"
              autoFocus
            >
              <option value="12:00 AM">12:00 AM</option>
              <option value="12:30 AM">12:30 AM</option>
              <option value="1:00 AM">1:00 AM</option>
              <option value="1:30 AM">1:30 AM</option>
              <option value="2:00 AM">2:00 AM</option>
              <option value="2:30 AM">2:30 AM</option>
              <option value="3:00 AM">3:00 AM</option>
              <option value="3:30 AM">3:30 AM</option>
              <option value="4:00 AM">4:00 AM</option>
              <option value="4:30 AM">4:30 AM</option>
              <option value="5:00 AM">5:00 AM</option>
              <option value="5:30 AM">5:30 AM</option>
              <option value="6:00 AM">6:00 AM</option>
              <option value="6:30 AM">6:30 AM</option>
              <option value="7:00 AM">7:00 AM</option>
              <option value="7:30 AM">7:30 AM</option>
              <option value="8:00 AM">8:00 AM</option>
              <option value="8:30 AM">8:30 AM</option>
              <option value="9:00 AM">9:00 AM</option>
              <option value="9:30 AM">9:30 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="10:30 AM">10:30 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="11:30 AM">11:30 AM</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="12:30 PM">12:30 PM</option>
              <option value="1:00 PM">1:00 PM</option>
              <option value="1:30 PM">1:30 PM</option>
              <option value="2:00 PM">2:00 PM</option>
              <option value="2:30 PM">2:30 PM</option>
              <option value="3:00 PM">3:00 PM</option>
              <option value="3:30 PM">3:30 PM</option>
              <option value="4:00 PM">4:00 PM</option>
              <option value="4:30 PM">4:30 PM</option>
              <option value="5:00 PM">5:00 PM</option>
              <option value="5:30 PM">5:30 PM</option>
              <option value="6:00 PM">6:00 PM</option>
              <option value="6:30 PM">6:30 PM</option>
              <option value="7:00 PM">7:00 PM</option>
              <option value="7:30 PM">7:30 PM</option>
              <option value="8:00 PM">8:00 PM</option>
              <option value="8:30 PM">8:30 PM</option>
              <option value="9:00 PM">9:00 PM</option>
              <option value="9:30 PM">9:30 PM</option>
              <option value="10:00 PM">10:00 PM</option>
              <option value="10:30 PM">10:30 PM</option>
              <option value="11:00 PM">11:00 PM</option>
              <option value="11:30 PM">11:30 PM</option>
            </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Crew</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}