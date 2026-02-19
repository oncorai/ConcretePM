"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/Badge";
import { 
  Search, 
  MapPin, 
  Star, 
  Award,
  Filter,
  User
} from "lucide-react";

interface Worker {
  id: string;
  user: {
    name: string;
    email: string;
  };
  location?: string;
  skills: string[];
  experience: number;
  totalPoints: number;
  currentLevel: number;
  profileCompleted: boolean;
}

export default function WorkersSearch() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (location) params.append("location", location);
      if (minExperience) params.append("minExperience", minExperience);
      if (selectedSkills.length > 0) params.append("skills", selectedSkills.join(","));

      const response = await fetch(`/api/workers?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch workers");
      
      const data = await response.json();
      setWorkers(data);
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWorkers();
  };

  const availableSkills = [
    "Concrete Finishing",
    "Form Setting",
    "Rebar Installation",
    "Concrete Pumping",
    "Flatwork",
    "Decorative Concrete",
    "Concrete Repair",
    "Foundation Work",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Workers</h1>
        <p className="text-muted-foreground">
          Search and filter workers based on skills, experience, and location
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Workers
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Search</Button>
            </div>

            {showFilters && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Minimum Experience (years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      value={minExperience}
                      onChange={(e) => setMinExperience(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableSkills.map((skill) => (
                      <label key={skill} className="cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selectedSkills.includes(skill)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSkills([...selectedSkills, skill]);
                            } else {
                              setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                            }
                          }}
                        />
                        <Badge
                          variant={selectedSkills.includes(skill) ? "default" : "outline"}
                          className="cursor-pointer"
                        >
                          {skill}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading workers...</p>
        </div>
      ) : workers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No workers found matching your criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <Card key={worker.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{worker.user.name}</h3>
                    {worker.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {worker.location}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">Level {worker.currentLevel}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {worker.totalPoints} points
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Experience</p>
                    <Badge variant="secondary">
                      {worker.experience} {worker.experience === 1 ? "year" : "years"}
                    </Badge>
                  </div>

                  {worker.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {worker.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {worker.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{worker.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3">
                    {worker.profileCompleted && (
                      <Badge variant="success" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Verified Profile
                      </Badge>
                    )}
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}