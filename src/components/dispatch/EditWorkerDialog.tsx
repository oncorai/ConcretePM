"use client";

import { useState, useEffect } from "react";
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

interface Worker {
  id: string;
  name: string;
  phone: string;
  workerRole: string;
  status: string;
  groupId: string | null;
}

interface EditWorkerDialogProps {
  worker: Worker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (worker: Worker) => void;
}

export default function EditWorkerDialog({
  worker,
  open,
  onOpenChange,
  onSubmit,
}: EditWorkerDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [workerRole, setWorkerRole] = useState("laborer");

  useEffect(() => {
    if (worker) {
      setName(worker.name);
      setPhone(worker.phone);
      setWorkerRole(worker.workerRole || "laborer");
    }
  }, [worker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim() && worker) {
      onSubmit({
        ...worker,
        name,
        phone,
        workerRole,
      });
      onOpenChange(false);
    }
  };

  if (!worker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Worker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={workerRole}
                onChange={(e) => setWorkerRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="superintendent">Superintendent</option>
                <option value="foreman">Foreman</option>
                <option value="carpenter">Carpenter</option>
                <option value="operator">Operator</option>
                <option value="finisher">Finisher</option>
                <option value="sawcutter">Sawcutter</option>
                <option value="patcher">Patcher</option>
                <option value="laborer">Laborer</option>
                <option value="project manager">Project Manager</option>
                <option value="field engineer">Field Engineer</option>
                <option value="safety">Safety</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}