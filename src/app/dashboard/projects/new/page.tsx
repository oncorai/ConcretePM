"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, Copy, GripVertical, Upload, FileText, Image, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

interface SubPhase {
  costCode?: string;
  name: string;
  budget?: string;
  budgetHours: string;
  budgetQuantity: string;
  unit: string;
  initialHours: string;
  initialQuantity: string;
  isStarted: boolean;
}

interface Phase {
  name: string;
  subPhases: SubPhase[];
  isExpanded: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [phases, setPhases] = useState<Phase[]>([
    { 
      name: "", 
      subPhases: [{ costCode: "", name: "", budget: "", budgetHours: "", budgetQuantity: "", unit: "ft", initialHours: "", initialQuantity: "", isStarted: false }],
      isExpanded: true
    }
  ]);
  const [draggedPhase, setDraggedPhase] = useState<number | null>(null);
  const [draggedSubPhase, setDraggedSubPhase] = useState<{phase: number, subPhase: number} | null>(null);
  const [dragOverPhase, setDragOverPhase] = useState<number | null>(null);
  const [dragOverSubPhase, setDragOverSubPhase] = useState<{phase: number, subPhase: number} | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [costImportData, setCostImportData] = useState<any>(null); // Store material/equipment data from cost import

  const addPhase = () => {
    setPhases([...phases, { 
      name: "", 
      subPhases: [{ name: "", budgetHours: "", budgetQuantity: "", unit: "ft", initialHours: "", initialQuantity: "", isStarted: false }],
      isExpanded: true
    }]);
  };

  const copyPhase = (phaseIndex: number) => {
    const phaseToCopy = phases[phaseIndex];
    const copiedPhase = {
      name: `${phaseToCopy.name} (Copy)`,
      subPhases: phaseToCopy.subPhases.map(sp => ({
        ...sp,
        isStarted: false,
        initialHours: "",
        initialQuantity: ""
      })),
      isExpanded: true
    };
    const newPhases = [...phases];
    newPhases.splice(phaseIndex + 1, 0, copiedPhase);
    setPhases(newPhases);
  };

  const removePhase = (phaseIndex: number) => {
    setPhases(phases.filter((_, i) => i !== phaseIndex));
  };

  const updatePhase = (phaseIndex: number, name: string) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].name = name;
    setPhases(newPhases);
  };

  const togglePhaseExpansion = (phaseIndex: number) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].isExpanded = !newPhases[phaseIndex].isExpanded;
    setPhases(newPhases);
  };

  const addSubPhase = (phaseIndex: number) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].subPhases.push({ 
      costCode: "",
      name: "", 
      budget: "",
      budgetHours: "", 
      budgetQuantity: "", 
      unit: "ft", 
      initialHours: "", 
      initialQuantity: "", 
      isStarted: false 
    });
    setPhases(newPhases);
  };

  const copySubPhase = (phaseIndex: number, subPhaseIndex: number) => {
    const newPhases = [...phases];
    const subPhaseToCopy = newPhases[phaseIndex].subPhases[subPhaseIndex];
    const copiedSubPhase = {
      ...subPhaseToCopy,
      name: `${subPhaseToCopy.name} (Copy)`,
      isStarted: false,
      initialHours: "",
      initialQuantity: ""
    };
    newPhases[phaseIndex].subPhases.splice(subPhaseIndex + 1, 0, copiedSubPhase);
    setPhases(newPhases);
  };

  const removeSubPhase = (phaseIndex: number, subPhaseIndex: number) => {
    const newPhases = [...phases];
    newPhases[phaseIndex].subPhases = newPhases[phaseIndex].subPhases.filter((_, i) => i !== subPhaseIndex);
    setPhases(newPhases);
  };

  const updateSubPhase = (phaseIndex: number, subPhaseIndex: number, field: keyof SubPhase, value: string) => {
    const newPhases = [...phases];
    if (field === 'isStarted') {
      newPhases[phaseIndex].subPhases[subPhaseIndex][field] = value === 'true';
    } else {
      newPhases[phaseIndex].subPhases[subPhaseIndex][field] = value as any;
    }
    setPhases(newPhases);
  };

  const handlePhaseDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPhase(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handlePhaseDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Only update dragOver if it's a different index
    if (draggedPhase !== null && draggedPhase !== index) {
      setDragOverPhase(index);
    }
  };

  const handlePhaseDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedPhase === null || draggedPhase === dropIndex) {
      setDraggedPhase(null);
      setDragOverPhase(null);
      return;
    }

    // Create a new array with items reordered
    const newPhases = Array.from(phases);
    const [reorderedItem] = newPhases.splice(draggedPhase, 1);
    newPhases.splice(dropIndex, 0, reorderedItem);
    
    setPhases(newPhases);
    setDraggedPhase(null);
    setDragOverPhase(null);
  };

  const handleSubPhaseDragStart = (e: React.DragEvent, phaseIndex: number, subPhaseIndex: number) => {
    setDraggedSubPhase({ phase: phaseIndex, subPhase: subPhaseIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${phaseIndex}-${subPhaseIndex}`);
  };

  const handleSubPhaseDragOver = (e: React.DragEvent, phaseIndex: number, subPhaseIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSubPhase({ phase: phaseIndex, subPhase: subPhaseIndex });
  };

  const handleSubPhaseDrop = (e: React.DragEvent, dropPhaseIndex: number, dropSubPhaseIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    
    if (!draggedSubPhase) {
      setDraggedSubPhase(null);
      setDragOverSubPhase(null);
      return;
    }
    
    // Don't do anything if dropping in the same position
    if (draggedSubPhase.phase === dropPhaseIndex && draggedSubPhase.subPhase === dropSubPhaseIndex) {
      setDraggedSubPhase(null);
      setDragOverSubPhase(null);
      return;
    }

    const newPhases = [...phases];
    
    // Get the dragged item
    const draggedItem = newPhases[draggedSubPhase.phase].subPhases[draggedSubPhase.subPhase];
    
    // Remove from source
    newPhases[draggedSubPhase.phase].subPhases.splice(draggedSubPhase.subPhase, 1);
    
    // Insert at destination
    newPhases[dropPhaseIndex].subPhases.splice(dropSubPhaseIndex, 0, draggedItem);
    
    setPhases(newPhases);
    setDraggedSubPhase(null);
    setDragOverSubPhase(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    // Reset the file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const extractDataFromFile = async () => {
    console.log('🚀 extractDataFromFile called');
    if (!uploadedFile) {
      console.log('❌ No uploaded file');
      return;
    }
    
    console.log('📁 Uploaded file:', uploadedFile.name);
    setExtracting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      // Always use cost import endpoint
      const response = await fetch('/api/extract-cost-data-v2', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to extract data';
        try {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      console.log('✅ Extraction successful, received data:', data);
      console.log('🔍 Cost items:', data.costItems);
      
      // Don't set project name from API - let user control it completely
      console.log('✅ Preserving user project name field (not overwriting with API data)');
      
      // Store the full cost data for later processing
      setCostImportData(data);
      
      // Convert cost items to phases
      if (data.costItems && data.costItems.length > 0) {
          const phaseMap = new Map<string, any[]>();
          
          // Group by phase, including ALL phases (labor, material, equipment, subcontractor)
          data.costItems.forEach((item: any) => {
            const phaseLower = item.phase.toLowerCase();
            
            // Parse hours - for non-labor phases this will be 0
            const hoursStr = (item.hours || '').toString().replace(/,/g, '');
            const hours = hoursStr === '-' || hoursStr === '' ? 0 : parseFloat(hoursStr) || 0;
            
            // Include all phases - don't skip any
            if (!phaseMap.has(item.phase)) {
              phaseMap.set(item.phase, []);
            }
            phaseMap.get(item.phase)!.push({
              costCode: item.costCode || '',
              name: item.subphase,
              budget: item.budget || '',
              budgetHours: hours.toString(),
              budgetQuantity: (item.quantity || '').toString().replace(/,/g, ''),
              unit: item.unit || 'ea',
              initialHours: '',
              initialQuantity: '',
              isStarted: false
            });
          });
          
          // Convert to phases array
          const newPhases = Array.from(phaseMap.entries()).map(([phaseName, subPhases]) => ({
            name: phaseName,
            subPhases: subPhases,
            isExpanded: false
          }));
          
          console.log('📋 Created phases:', newPhases);
          console.log('📋 Number of phases:', newPhases.length);
          
          if (newPhases.length > 0) {
            console.log('🔄 Calling setPhases with:', newPhases);
            setPhases(newPhases);
            console.log('✅ setPhases called successfully');
          } else {
            console.log('⚠️ No phases created - newPhases is empty');
          }
        } else {
          console.log('⚠️ No cost items found in data');
        }
      
      // Show success message
      alert('Data extracted successfully! Review and adjust as needed.');
      
    } catch (error: any) {
      console.error('❌ Error extracting data:', error);
      const errorMessage = error.response ? await error.response.text() : error.message;
      console.error('❌ Error message:', errorMessage);
      alert(`Failed to extract data: ${errorMessage || 'Unknown error'}. Please check the file format and try again.`);
    } finally {
      console.log('🏁 Extraction finished, setting extracting to false');
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const requestBody = {
      name: projectName,
      location,
      startDate: new Date(startDate),
      phases: phases.filter(p => p.name).map((phase, phaseIndex) => ({
        name: phase.name,
        orderIndex: phaseIndex,
        subPhases: phase.subPhases.filter(sp => sp.name).map((subPhase, subPhaseIndex) => ({
          name: subPhase.name,
          costCode: subPhase.costCode || null,
          budget: subPhase.budget ? parseFloat(subPhase.budget.replace(/[$,]/g, '')) : null,
          orderIndex: subPhaseIndex,
          budgetHours: parseFloat(subPhase.budgetHours) || 0,
          budgetQuantity: subPhase.budgetQuantity ? parseFloat(subPhase.budgetQuantity) : null,
          unit: subPhase.unit || null,
          initialHours: subPhase.isStarted ? (parseFloat(subPhase.initialHours) || 0) : 0,
          initialQuantity: subPhase.isStarted && subPhase.initialQuantity ? parseFloat(subPhase.initialQuantity) : null,
        })),
      })),
    };
    
    console.log('Creating project with data:', JSON.stringify(requestBody, null, 2));
    
    try {
      let response;
      
      // If we have cost import data, use the create-from-cost endpoint
      if (costImportData) {
        // Override the project name with user input, keeping other form data
        const costDataWithUserInput = {
          ...costImportData,
          projectName: projectName, // Use user's project name
          location: location,       // Use user's location
          startDate: startDate      // Use user's start date
        };
        
        console.log('🎯 Sending cost import data with user inputs:', costDataWithUserInput);
        
        response = await fetch("/api/projects/create-from-cost", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(costDataWithUserInput),
        });
      } else {
        // Otherwise use the regular project creation
        response = await fetch("/api/projects/with-phases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Create project error:", errorData);
        throw new Error(errorData.error || "Failed to create project");
      }

      const result = await response.json();
      
      // Handle different response formats
      const projectId = result.projectId || result.id;
      
      if (!projectId) {
        throw new Error("No project ID returned from server");
      }
      
      router.push(`/dashboard/projects/${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
      alert(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <Card className="max-w-5xl">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">New Project</h1>
          <p className="mt-1 text-muted-foreground">
            Set up your project with phases, subphases, and budget estimates
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-6">
            {/* File Upload Section */}
            <Card className="border-dashed">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-foreground">Import Cost Control Sheet (Optional)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your cost control spreadsheet (CSV/Excel) to automatically import phases, budget hours, and equipment data
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="h-10 w-10 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Excel (.xlsx, .xls) or CSV files
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {uploadedFile && (
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {uploadedFile.type.includes('image') ? (
                          <Image className="h-5 w-5 text-blue-500" />
                        ) : uploadedFile.name.includes('.xls') ? (
                          <FileSpreadsheet className="h-5 w-5 text-green-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={extractDataFromFile}
                          disabled={extracting}
                          size="sm"
                        >
                          {extracting ? "Extracting..." : "Extract Data"}
                        </Button>
                        <Button
                          type="button"
                          onClick={removeUploadedFile}
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                  placeholder="e.g., MSA2A Trenches"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                  placeholder="e.g., Site A - North Section"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Phases & Budget</h3>
              <Button type="button" onClick={addPhase} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Phase
              </Button>
            </div>

            <div 
              className="space-y-6"
              onDragOver={(e) => e.preventDefault()}
            >
              {phases.map((phase, phaseIndex) => (
                <div 
                  key={phaseIndex} 
                  className={`border rounded-lg transition-all ${
                    draggedPhase === phaseIndex ? 'opacity-50' : ''
                  } ${
                    dragOverPhase === phaseIndex ? 'border-blue-500 border-2' : 'border-border'
                  }`}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (draggedPhase !== null && draggedPhase !== phaseIndex) {
                      setDragOverPhase(phaseIndex);
                    }
                  }}
                  onDragOver={(e) => handlePhaseDragOver(e, phaseIndex)}
                  onDrop={(e) => handlePhaseDrop(e, phaseIndex)}
                  onDragLeave={(e) => {
                    if (e.currentTarget === e.target) {
                      setDragOverPhase(null);
                    }
                  }}
                >
                  {/* Phase Header */}
                  <div className="bg-muted p-4">
                    <div className="flex items-center gap-4">
                      <div
                        draggable
                        onDragStart={(e) => handlePhaseDragStart(e, phaseIndex)}
                        onDragEnd={() => {
                          setDraggedPhase(null);
                          setDragOverPhase(null);
                        }}
                        className="cursor-move p-1 hover:bg-gray-700 rounded"
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-5 w-5 text-gray-500" />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => togglePhaseExpansion(phaseIndex)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        {phase.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => updatePhase(phaseIndex, e.target.value)}
                        className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                        placeholder={`Phase ${phaseIndex + 1} name (e.g., Foundation, Framing)`}
                      />

                      <div className="flex items-center gap-2">

                        <button
                          type="button"
                          onClick={() => copyPhase(phaseIndex)}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg"
                          title="Copy phase"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        
                        {phases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhase(phaseIndex)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                            title="Delete phase"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subphases */}
                  {phase.isExpanded && (
                    <div 
                      className="p-4 space-y-4"
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Subphases</h4>
                        <Button 
                          type="button" 
                          onClick={() => addSubPhase(phaseIndex)} 
                          size="sm" 
                          variant="ghost"
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Subphase
                        </Button>
                      </div>

                      {phase.subPhases.map((subPhase, subPhaseIndex) => (
                        <div 
                          key={subPhaseIndex} 
                          className={`space-y-4 p-6 bg-gray-900 rounded-lg border transition-all ${
                            draggedSubPhase?.phase === phaseIndex && draggedSubPhase?.subPhase === subPhaseIndex
                              ? 'opacity-50'
                              : ''
                          } ${
                            dragOverSubPhase?.phase === phaseIndex && dragOverSubPhase?.subPhase === subPhaseIndex
                              ? 'border-blue-500 border-2' 
                              : 'border-gray-700'
                          }`}
                          onDragOver={(e) => handleSubPhaseDragOver(e, phaseIndex, subPhaseIndex)}
                          onDrop={(e) => handleSubPhaseDrop(e, phaseIndex, subPhaseIndex)}
                        >
                          {/* Subphase Header with Copy/Delete Buttons */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                draggable
                                onDragStart={(e) => handleSubPhaseDragStart(e, phaseIndex, subPhaseIndex)}
                                onDragEnd={() => {
                                  setDraggedSubPhase(null);
                                  setDragOverSubPhase(null);
                                }}
                                className="cursor-move p-1 hover:bg-gray-800 rounded"
                                title="Drag to reorder"
                              >
                                <GripVertical className="h-4 w-4 text-gray-500" />
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              
                              <button
                                type="button"
                                onClick={() => copySubPhase(phaseIndex, subPhaseIndex)}
                                className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg"
                                title="Copy subphase"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              {phase.subPhases.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSubPhase(phaseIndex, subPhaseIndex)}
                                  className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"
                                  title="Delete subphase"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Subphase Definition Row */}
                          <div className="grid gap-4 md:grid-cols-7">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Cost Code
                              </label>
                              <input
                                type="text"
                                value={subPhase.costCode || ''}
                                onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, 'costCode', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                                placeholder="e.g., 01.001"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Name
                              </label>
                              <input
                                type="text"
                                value={subPhase.name}
                                onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                                placeholder="e.g., Trench 1, Pour Footings"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Budget
                              </label>
                              <input
                                type="text"
                                value={subPhase.budget || ''}
                                onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, 'budget', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                                placeholder="$10,000"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Budget Hours
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                value={subPhase.budgetHours}
                                onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, 'budgetHours', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                                placeholder="26"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={subPhase.budgetQuantity}
                                onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, 'budgetQuantity', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                                placeholder="100"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                Unit
                              </label>
                              <select
                                value={subPhase.unit}
                                onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, 'unit', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground"
                              >
                                <option value="ft">ft</option>
                                <option value="cy">cy</option>
                                <option value="sf">sf</option>
                                <option value="ea">ea</option>
                                <option value="hr">hr</option>
                                <option value="wks">wks</option>
                              </select>
                            </div>
                          </div>

                          {/* Initial Progress Row */}
                          <div className="border-t border-gray-700 pt-3">
                            <label className="flex items-center gap-2 mb-3">
                              <input
                                type="checkbox"
                                checked={subPhase.isStarted}
                                onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, 'isStarted', e.target.checked.toString())}
                                className="h-4 w-4 text-blue-600 rounded border-border focus:ring-blue-500 bg-gray-700"
                              />
                              <span className="text-sm font-medium text-foreground">This subphase has already started</span>
                            </label>

                            {subPhase.isStarted && (
                              <div className="grid gap-4 md:grid-cols-2 ml-6">
                                <div>
                                  <label className="block text-sm font-medium mb-1 text-muted-foreground">
                                    Hours Worked to Date
                                  </label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={subPhase.initialHours}
                                    onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, 'initialHours', e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                                    placeholder="0"
                                  />
                                </div>

                                {subPhase.budgetQuantity && (
                                  <div>
                                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                                      Quantity Completed to Date ({subPhase.unit})
                                    </label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={subPhase.initialQuantity}
                                      onChange={(e) => updateSubPhase(phaseIndex, subPhaseIndex, 'initialQuantity', e.target.value)}
                                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-foreground placeholder-muted-foreground"
                                      placeholder="0"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={loading || !projectName || phases.filter(p => p.name && p.subPhases.some(sp => sp.name)).length === 0}
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}