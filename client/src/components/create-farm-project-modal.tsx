import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X, MapPin, User, Globe, Sprout, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertFarmSchema, type InsertFarm } from "@shared/schema";
import { z } from "zod";

// Extended form schema with additional validation
const projectFormSchema = insertFarmSchema.extend({
  crops: z.array(z.string()).optional().nullable(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface CreateFarmProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Common crop options for quick selection
const COMMON_CROPS = [
  "Corn", "Wheat", "Soybeans", "Rice", "Tomatoes", "Potatoes", 
  "Carrots", "Lettuce", "Onions", "Peppers", "Beans", "Peas",
  "Strawberries", "Apples", "Oranges", "Grapes"
];

export function CreateFarmProjectModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: CreateFarmProjectModalProps) {
  const { toast } = useToast();
  const [selectedCrops, setSelectedCrops] = React.useState<string[]>([]);
  const [customCrop, setCustomCrop] = React.useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      ownerName: "",
      location: "",
      latitude: null,
      longitude: null,
      farmSize: null,
      crops: [],
      notes: "",
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectFormData) => 
      apiRequest("/api/projects", "POST", data),
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: `Farm project has been created successfully.`,
      });
      reset();
      setSelectedCrops([]);
      setCustomCrop("");
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create farm project. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle crop selection
  const handleCropToggle = (crop: string) => {
    const newCrops = selectedCrops.includes(crop)
      ? selectedCrops.filter(c => c !== crop)
      : [...selectedCrops, crop];
    
    setSelectedCrops(newCrops);
    setValue("crops", newCrops);
  };

  // Add custom crop
  const handleAddCustomCrop = () => {
    if (customCrop.trim() && !selectedCrops.includes(customCrop.trim())) {
      const newCrops = [...selectedCrops, customCrop.trim()];
      setSelectedCrops(newCrops);
      setValue("crops", newCrops);
      setCustomCrop("");
    }
  };

  // Remove crop
  const handleRemoveCrop = (crop: string) => {
    const newCrops = selectedCrops.filter(c => c !== crop);
    setSelectedCrops(newCrops);
    setValue("crops", newCrops);
  };

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate({
      ...data,
      crops: selectedCrops.length > 0 ? selectedCrops : null,
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSelectedCrops([]);
      setCustomCrop("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            Create New Farm Project
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Basic Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Project Name *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g., Smith Family Farm"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Owner/Farmer Name *
              </Label>
              <Input
                id="ownerName"
                {...register("ownerName")}
                placeholder="e.g., John Smith"
                disabled={isSubmitting}
              />
              {errors.ownerName && (
                <p className="text-sm text-red-600">{errors.ownerName.message}</p>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Farm Location *
              </Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="e.g., 123 Farm Road, Farmville, State 12345"
                disabled={isSubmitting}
              />
              {errors.location && (
                <p className="text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Latitude (Optional)
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register("latitude", { valueAsNumber: true })}
                  placeholder="40.7128"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (Optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register("longitude", { valueAsNumber: true })}
                  placeholder="-74.0060"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmSize">Farm Size (Acres)</Label>
                <Input
                  id="farmSize"
                  type="number"
                  step="0.1"
                  {...register("farmSize", { valueAsNumber: true })}
                  placeholder="100"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Crop Selection */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Sprout className="h-4 w-4" />
              Crops to Grow (Optional)
            </Label>
            
            {/* Selected Crops */}
            {selectedCrops.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {selectedCrops.map((crop) => (
                  <Badge
                    key={crop}
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-red-100"
                    onClick={() => handleRemoveCrop(crop)}
                  >
                    {crop}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Common Crops Selection */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {COMMON_CROPS.map((crop) => (
                <Button
                  key={crop}
                  type="button"
                  variant={selectedCrops.includes(crop) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCropToggle(crop)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  {crop}
                </Button>
              ))}
            </div>

            {/* Custom Crop Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom crop..."
                value={customCrop}
                onChange={(e) => setCustomCrop(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && e.preventDefault()}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCustomCrop}
                disabled={!customCrop.trim() || isSubmitting}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Project Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional notes about this farm project..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}