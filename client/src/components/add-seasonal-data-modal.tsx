import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertSeasonalDataSchema, type InsertSeasonalData } from "@shared/schema";
import { Plus, Calculator, Wheat, Package, Beaker } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AddSeasonalDataModalProps {
  farmId: string;
}

// Predefined options for common fertilizers and crop varieties
const FERTILIZER_TYPES = {
  basal: ["DAP", "NPK 17:17:17", "Mavuno planting", "TSP", "SSP"],
  topDressing: ["CAN", "Urea", "NPK 23:23:0", "Ammonium Sulphate"]
};

const CROP_VARIETIES = {
  "Maize": ["DK777", "HB 6213", "SC Duma 43", "WH 505", "PH 5052"],
  "Beans": ["Rose Coco", "Mexican 142", "GLP 2", "Mwitemania", "Canadian Wonder"],
  "Sorghum": ["Serena", "Kari Mtama-1", "Gadam", "IESV 23006 DL"],
  "Millet": ["Okoa", "White Millet", "Finger Millet", "Pearl Millet"]
};

export function AddSeasonalDataModal({ farmId }: AddSeasonalDataModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertSeasonalData>({
    resolver: zodResolver(insertSeasonalDataSchema),
    defaultValues: {
      farmId,
      seasonName: "",
      year: new Date().getFullYear() - 1,
      cropGrown: "",
      landAreaAcres: 0,
      landAreaM2: 0,
      seedVariety: "",
      basalFertilizerType: "",
      basalFertilizerAmountBags: null,
      basalFertilizerAmountKgs: null,
      topDressingFertilizerType: "",
      topDressingFertilizerAmountBags: null,
      topDressingFertilizerAmountKgs: null,
      yieldBags: null,
      yieldKgs: null,
    },
  });

  const createSeasonalDataMutation = useMutation({
    mutationFn: (data: InsertSeasonalData) =>
      apiRequest(`/api/farms/${farmId}/seasonal-data`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'seasonal-data'] });
      toast({
        title: "Success",
        description: "Seasonal data has been added successfully.",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add seasonal data. Please try again.",
      });
      console.error("Error creating seasonal data:", error);
    },
  });

  const onSubmit = (data: InsertSeasonalData) => {
    // Convert acres to square meters if not provided
    if (data.landAreaAcres && !data.landAreaM2) {
      data.landAreaM2 = data.landAreaAcres * 4046.86; // 1 acre = 4046.86 m²
    }
    
    createSeasonalDataMutation.mutate(data);
  };

  const watchedCrop = form.watch("cropGrown");
  const watchedLandAreaAcres = form.watch("landAreaAcres");

  // Auto-calculate area in square meters when acres are entered
  const handleAreaChange = (acres: number) => {
    const m2 = acres * 4046.86;
    form.setValue("landAreaM2", Math.round(m2 * 100) / 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Season Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wheat className="h-5 w-5" />
            Add Baseline Seasonal Data
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Season Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="seasonName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Previous Season 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="2000" 
                        max={new Date().getFullYear()}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cropGrown"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop Grown</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select crop type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(CROP_VARIETIES).map((crop) => (
                          <SelectItem key={crop} value={crop}>
                            {crop}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Land Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="landAreaAcres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Land Area (Acres)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          field.onChange(value);
                          handleAreaChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="landAreaM2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Land Area (m²)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="bg-gray-50"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="seedVariety"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seed Variety</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select variety" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {watchedCrop && CROP_VARIETIES[watchedCrop as keyof typeof CROP_VARIETIES]?.map((variety) => (
                          <SelectItem key={variety} value={variety}>
                            {variety}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Basal Fertilizer */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <Beaker className="h-5 w-5" />
                Basal Fertilizer Application
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="basalFertilizerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fertilizer Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fertilizer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FERTILIZER_TYPES.basal.map((fertilizer) => (
                            <SelectItem key={fertilizer} value={fertilizer}>
                              {fertilizer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="basalFertilizerAmountBags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (Bags)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="basalFertilizerAmountKgs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (Kgs)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Top Dressing Fertilizer */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <Beaker className="h-5 w-5" />
                Top Dressing Fertilizer Application
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="topDressingFertilizerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fertilizer Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fertilizer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FERTILIZER_TYPES.topDressing.map((fertilizer) => (
                            <SelectItem key={fertilizer} value={fertilizer}>
                              {fertilizer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="topDressingFertilizerAmountBags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (Bags)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="topDressingFertilizerAmountKgs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (Kgs)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Yield Data */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <Package className="h-5 w-5" />
                Yield Data
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yieldBags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Yield (Bags)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="yieldKgs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Yield (Kgs)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSeasonalDataMutation.isPending}>
                {createSeasonalDataMutation.isPending ? "Adding..." : "Add Seasonal Data"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}