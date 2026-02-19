"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { 
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Calendar
} from "lucide-react";

interface WorkHistoryItem {
  id: string;
  company: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

interface WorkHistorySectionProps {
  workHistory: WorkHistoryItem[];
  workerId: string;
}

export default function WorkHistorySection({ workHistory, workerId }: WorkHistorySectionProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      company: formData.get("company") as string,
      position: formData.get("position") as string,
      description: formData.get("description") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string || null,
      current: formData.get("current") === "on",
    };

    try {
      const url = editingId 
        ? `/api/work-history/${editingId}`
        : "/api/work-history";
      
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save work history");
      }

      setIsAdding(false);
      setEditingId(null);
      router.refresh();
    } catch (error) {
      setError("Failed to save work history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work history?")) {
      return;
    }

    try {
      const response = await fetch(`/api/work-history/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to delete work history");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const WorkHistoryForm = ({ item }: { item?: WorkHistoryItem }) => (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            defaultValue={item?.company}
            required
            placeholder="ABC Construction"
          />
        </div>
        <div>
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            name="position"
            defaultValue={item?.position}
            required
            placeholder="Concrete Finisher"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={item?.description}
          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
          placeholder="Describe your responsibilities and achievements..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={item?.startDate ? new Date(item.startDate).toISOString().split('T')[0] : ''}
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={item?.endDate ? new Date(item.endDate).toISOString().split('T')[0] : ''}
            disabled={item?.current}
          />
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="current"
              name="current"
              defaultChecked={item?.current}
              className="mr-2"
              onChange={(e) => {
                const endDateInput = document.getElementById("endDate") as HTMLInputElement;
                endDateInput.disabled = e.target.checked;
                if (e.target.checked) {
                  endDateInput.value = "";
                }
              }}
            />
            <Label htmlFor="current" className="text-sm font-normal">
              I currently work here
            </Label>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsAdding(false);
            setEditingId(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Work History
        </CardTitle>
        {!isAdding && !editingId && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Experience
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAdding && <WorkHistoryForm />}
        
        {workHistory.length === 0 && !isAdding ? (
          <p className="text-muted-foreground">No work history added yet.</p>
        ) : (
          <div className="space-y-4">
            {workHistory.map((item) => (
              <div key={item.id}>
                {editingId === item.id ? (
                  <WorkHistoryForm item={item} />
                ) : (
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{item.position}</h4>
                          {item.current && (
                            <Badge variant="success" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {item.company}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.startDate)} - {item.current ? "Present" : formatDate(item.endDate!)}
                        </p>
                        {item.description && (
                          <p className="text-sm mt-2">{item.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingId(item.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}