import { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFarmSchema, InsertFarm } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { localStorageService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface CreateFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateFarmModal({ isOpen, onClose, onSuccess }: CreateFarmModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InsertFarm>({
    resolver: zodResolver(insertFarmSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
    },
  });

  const handleSubmit = async (data: InsertFarm) => {
    setIsSubmitting(true);
    try {
      const farm = localStorageService.createFarm(data);
      toast({
        title: "Farm created",
        description: `${farm.name} has been added to your projects.`,
      });
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create farm. Please try again.",
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
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Farm Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter farm name"
              {...form.register("name")}
              className="w-full"
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
              {...form.register("location")}
              className="w-full"
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
              className="flex-1 bg-farm-green text-white hover:bg-farm-deep"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Farm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
