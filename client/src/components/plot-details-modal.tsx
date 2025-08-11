import { useState } from "react";
import { X, Sprout, Calendar, Beaker, Target, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plot } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface PlotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plot: Plot;
  farmId: string;
}

const plotUpdateSchema = z.object({
  name: z.string().min(1, "Plot name is required"),
  cropType: z.string().optional(),
  seedVariety: z.string().optional(),
  plantingDate: z.string().optional(),
  expectedHarvestDate: z.string().optional(),
  basalFertilizerType: z.string().optional(),
  basalFertilizerRate: z.string().optional(),
  basalApplicationDate: z.string().optional(),
  topDressingFertilizerType: z.string().optional(),
  topDressingFertilizerRate: z.string().optional(),
  topDressingApplicationDate: z.string().optional(),
  pesticidesUsed: z.string().optional(),
  fungicidesUsed: z.string().optional(),
  herbicidesUsed: z.string().optional(),
  treatmentNotes: z.string().optional(),
  expectedYieldPerHectare: z.string().optional(),
  actualYieldPerHectare: z.string().optional(),
  growthStage: z.string().optional(),
  notes: z.string().optional(),
});

type PlotUpdateData = z.infer<typeof plotUpdateSchema>;

export function PlotDetailsModal({ isOpen, onClose, plot, farmId }: PlotDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PlotUpdateData>({
    resolver: zodResolver(plotUpdateSchema),
    defaultValues: {
      name: plot.name,
      cropType: plot.cropType || "",
      seedVariety: plot.seedVariety || "",
      plantingDate: plot.plantingDate ? new Date(plot.plantingDate).toISOString().split('T')[0] : "",
      expectedHarvestDate: plot.expectedHarvestDate ? new Date(plot.expectedHarvestDate).toISOString().split('T')[0] : "",
      basalFertilizerType: plot.basalFertilizerType || "",
      basalFertilizerRate: plot.basalFertilizerRate?.toString() || "",
      basalApplicationDate: plot.basalApplicationDate ? new Date(plot.basalApplicationDate).toISOString().split('T')[0] : "",
      topDressingFertilizerType: plot.topDressingFertilizerType || "",
      topDressingFertilizerRate: plot.topDressingFertilizerRate?.toString() || "",
      topDressingApplicationDate: plot.topDressingApplicationDate ? new Date(plot.topDressingApplicationDate).toISOString().split('T')[0] : "",
      pesticidesUsed: plot.pesticidesUsed?.join(', ') || "",
      fungicidesUsed: plot.fungicidesUsed?.join(', ') || "",
      herbicidesUsed: plot.herbicidesUsed?.join(', ') || "",
      treatmentNotes: plot.treatmentNotes || "",
      expectedYieldPerHectare: plot.expectedYieldPerHectare?.toString() || "",
      actualYieldPerHectare: plot.actualYieldPerHectare?.toString() || "",
      growthStage: plot.growthStage || "",
      notes: plot.notes || "",
    },
  });

  const updatePlotMutation = useMutation({
    mutationFn: async (data: PlotUpdateData) => {
      console.log("Starting plot update mutation for plot:", plot.id);
      console.log("Raw form data:", data);
      
      // Process the form data
      const processedData = {
        ...data,
        plantingDate: data.plantingDate ? new Date(data.plantingDate).toISOString() : null,
        expectedHarvestDate: data.expectedHarvestDate ? new Date(data.expectedHarvestDate).toISOString() : null,
        basalFertilizerRate: data.basalFertilizerRate ? parseFloat(data.basalFertilizerRate) : null,
        basalApplicationDate: data.basalApplicationDate ? new Date(data.basalApplicationDate).toISOString() : null,
        topDressingFertilizerRate: data.topDressingFertilizerRate ? parseFloat(data.topDressingFertilizerRate) : null,
        topDressingApplicationDate: data.topDressingApplicationDate ? new Date(data.topDressingApplicationDate).toISOString() : null,
        pesticidesUsed: data.pesticidesUsed ? data.pesticidesUsed.split(',').map(s => s.trim()).filter(Boolean) : [],
        fungicidesUsed: data.fungicidesUsed ? data.fungicidesUsed.split(',').map(s => s.trim()).filter(Boolean) : [],
        herbicidesUsed: data.herbicidesUsed ? data.herbicidesUsed.split(',').map(s => s.trim()).filter(Boolean) : [],
        expectedYieldPerHectare: data.expectedYieldPerHectare ? parseFloat(data.expectedYieldPerHectare) : null,
        actualYieldPerHectare: data.actualYieldPerHectare ? parseFloat(data.actualYieldPerHectare) : null,
      };

      console.log("Processed data:", processedData);
      console.log("Making API request to:", `/api/plots/${plot.id}`);
      
      const result = await apiRequest(`/api/plots/${plot.id}`, 'PUT', processedData);
      console.log("API request result:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'plots'] });
      toast({
        title: "Plot updated",
        description: "Plot information has been updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("Plot update mutation failed:", error);
      toast({
        title: "Error",
        description: `Failed to update plot information: ${error?.message || "Unknown error"}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PlotUpdateData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    updatePlotMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Plot Details - {plot.name}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="crop">Crop Details</TabsTrigger>
                <TabsTrigger value="fertilizer">Fertilizers</TabsTrigger>
                <TabsTrigger value="treatments">Treatments</TabsTrigger>
                <TabsTrigger value="yield">Yield & Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Plot Name</Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        placeholder="e.g., North Field, Plot A1"
                      />
                      {form.formState.errors.name && (
                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Position</Label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {plot.width}×{plot.height} units at ({plot.x}, {plot.y})
                        </div>
                      </div>
                      <div>
                        <Label>Plot Size</Label>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {(plot.width * plot.height * 0.01).toFixed(2)} hectares estimated
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="crop" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sprout className="h-5 w-5" />
                      Crop Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cropType">Crop Type</Label>
                        <Select
                          value={form.watch("cropType")}
                          onValueChange={(value) => form.setValue("cropType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select crop type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Maize">Maize</SelectItem>
                            <SelectItem value="Beans">Beans</SelectItem>
                            <SelectItem value="Tomatoes">Tomatoes</SelectItem>
                            <SelectItem value="Potatoes">Potatoes</SelectItem>
                            <SelectItem value="Cabbages">Cabbages</SelectItem>
                            <SelectItem value="Onions">Onions</SelectItem>
                            <SelectItem value="Carrots">Carrots</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="seedVariety">Seed Variety</Label>
                        <Input
                          id="seedVariety"
                          {...form.register("seedVariety")}
                          placeholder="e.g., DK777, HB 6213, Cal J"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="plantingDate">Planting Date</Label>
                        <Input
                          id="plantingDate"
                          type="date"
                          {...form.register("plantingDate")}
                        />
                      </div>

                      <div>
                        <Label htmlFor="expectedHarvestDate">Expected Harvest Date</Label>
                        <Input
                          id="expectedHarvestDate"
                          type="date"
                          {...form.register("expectedHarvestDate")}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="growthStage">Current Growth Stage</Label>
                      <Select
                        value={form.watch("growthStage")}
                        onValueChange={(value) => form.setValue("growthStage", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select growth stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Land Preparation">Land Preparation</SelectItem>
                          <SelectItem value="Planting">Planting</SelectItem>
                          <SelectItem value="Germination">Germination</SelectItem>
                          <SelectItem value="Vegetative">Vegetative Growth</SelectItem>
                          <SelectItem value="Flowering">Flowering</SelectItem>
                          <SelectItem value="Fruit Development">Fruit Development</SelectItem>
                          <SelectItem value="Maturity">Maturity</SelectItem>
                          <SelectItem value="Harvested">Harvested</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fertilizer" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basal Fertilizer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="basalFertilizerType">Fertilizer Type</Label>
                        <Input
                          id="basalFertilizerType"
                          {...form.register("basalFertilizerType")}
                          placeholder="e.g., DAP, NPK 17:17:17"
                        />
                      </div>

                      <div>
                        <Label htmlFor="basalFertilizerRate">Rate (kg/hectare)</Label>
                        <Input
                          id="basalFertilizerRate"
                          type="number"
                          step="0.1"
                          {...form.register("basalFertilizerRate")}
                          placeholder="e.g., 125"
                        />
                      </div>

                      <div>
                        <Label htmlFor="basalApplicationDate">Application Date</Label>
                        <Input
                          id="basalApplicationDate"
                          type="date"
                          {...form.register("basalApplicationDate")}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Dressing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="topDressingFertilizerType">Fertilizer Type</Label>
                        <Input
                          id="topDressingFertilizerType"
                          {...form.register("topDressingFertilizerType")}
                          placeholder="e.g., CAN, Urea"
                        />
                      </div>

                      <div>
                        <Label htmlFor="topDressingFertilizerRate">Rate (kg/hectare)</Label>
                        <Input
                          id="topDressingFertilizerRate"
                          type="number"
                          step="0.1"
                          {...form.register("topDressingFertilizerRate")}
                          placeholder="e.g., 100"
                        />
                      </div>

                      <div>
                        <Label htmlFor="topDressingApplicationDate">Application Date</Label>
                        <Input
                          id="topDressingApplicationDate"
                          type="date"
                          {...form.register("topDressingApplicationDate")}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="treatments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Beaker className="h-5 w-5" />
                      Pest & Disease Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="pesticidesUsed">Pesticides Used</Label>
                      <Input
                        id="pesticidesUsed"
                        {...form.register("pesticidesUsed")}
                        placeholder="e.g., Marshal 20EC, Bulldock 025EC (separate with commas)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple pesticides with commas</p>
                    </div>

                    <div>
                      <Label htmlFor="fungicidesUsed">Fungicides Used</Label>
                      <Input
                        id="fungicidesUsed"
                        {...form.register("fungicidesUsed")}
                        placeholder="e.g., Dithane M45, Ridomil Gold (separate with commas)"
                      />
                    </div>

                    <div>
                      <Label htmlFor="herbicidesUsed">Herbicides Used</Label>
                      <Input
                        id="herbicidesUsed"
                        {...form.register("herbicidesUsed")}
                        placeholder="e.g., Roundup, 2,4-D (separate with commas)"
                      />
                    </div>

                    <div>
                      <Label htmlFor="treatmentNotes">Treatment Notes</Label>
                      <Textarea
                        id="treatmentNotes"
                        {...form.register("treatmentNotes")}
                        placeholder="Additional notes about treatments, application methods, or observed results..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="yield" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Yield Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="expectedYieldPerHectare">Expected Yield (kg/hectare)</Label>
                        <Input
                          id="expectedYieldPerHectare"
                          type="number"
                          step="0.1"
                          {...form.register("expectedYieldPerHectare")}
                          placeholder="e.g., 2500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="actualYieldPerHectare">Actual Yield (kg/hectare)</Label>
                        <Input
                          id="actualYieldPerHectare"
                          type="number"
                          step="0.1"
                          {...form.register("actualYieldPerHectare")}
                          placeholder="e.g., 2200"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label htmlFor="notes">General Notes</Label>
                        <Textarea
                          id="notes"
                          {...form.register("notes")}
                          placeholder="Any additional observations, issues, or important information about this plot..."
                          rows={5}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updatePlotMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-farm-green text-white hover:bg-farm-deep"
                disabled={updatePlotMutation.isPending}
              >
                {updatePlotMutation.isPending ? "Updating..." : "Update Plot"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}