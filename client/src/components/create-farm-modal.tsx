import { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

// Simple form schema for the basic create modal
const simpleFormSchema = z.object({
  name: z.string().min(1, "Farm name is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string().optional(),
});

type SimpleFormData = z.infer<typeof simpleFormSchema>;

interface CreateFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateFarmModal({ isOpen, onClose, onSuccess }: CreateFarmModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SimpleFormData>({
    resolver: zodResolver(simpleFormSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
    },
  });

  const handleSubmit = async (data: SimpleFormData) => {
    console.log("Form submission started");
    console.log("Form data:", data);
    
    // Validate required fields
    if (!data.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Farm name is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.location?.trim()) {
      toast({
        title: "Validation Error", 
        description: "Location is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create data in the correct format for the API
      const farmData = {
        name: data.name.trim(),
        ownerName: data.name.trim(), // Use farm name as owner if not specified
        location: data.location.trim(),
        notes: data.description?.trim() || null,
        latitude: null,
        longitude: null,
        farmSize: null,
        crops: null,
        layoutData: null,
      };
      
      console.log("Sending to API:", farmData);
      
      const response = await apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(farmData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("API success response:", response);
      
      toast({
        title: "Success!",
        description: `${data.name} has been created successfully.`,
      });
      
      form.reset();
      onClose(); // Close modal immediately
      onSuccess(); // Trigger refresh of parent component
      
    } catch (error) {
      console.error("API error:", error);
      toast({
        title: "Error",
        description: "Failed to create farm. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Create New Farm Project</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" 
              onInvalid={(e) => console.log("Simple form invalid:", e)}>
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Farm Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter farm name"
              {...form.register("name", { required: "Farm name is required" })}
              className="w-full"
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="City, State/Country"
              {...form.register("location", { required: "Location is required" })}
              className="w-full"
              disabled={isSubmitting}
            />
            {form.formState.errors.location && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.location.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Brief description of your farm"
              rows={3}
              {...form.register("description")}
              className="w-full"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-farm-green text-white hover:bg-farm-deep disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              onClick={() => {
                console.log("Create Farm button clicked!");
                console.log("Form values:", form.getValues());
                console.log("Form errors:", form.formState.errors);
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                "Create Farm"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
