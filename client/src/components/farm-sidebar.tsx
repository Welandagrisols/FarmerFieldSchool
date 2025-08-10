import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Farm } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { localStorageService } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface FarmSidebarProps {
  farms: Farm[];
  selectedFarmId: string | null;
  onSelectFarm: (farmId: string) => void;
  onCreateFarm: () => void;
  onRefreshFarms: () => void;
}

export function FarmSidebar({ 
  farms, 
  selectedFarmId, 
  onSelectFarm, 
  onCreateFarm, 
  onRefreshFarms 
}: FarmSidebarProps) {
  const { toast } = useToast();

  const handleDeleteFarm = async (farmId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this farm? All plots will also be deleted.")) {
      return;
    }

    try {
      const success = localStorageService.deleteFarm(farmId);
      if (success) {
        toast({
          title: "Farm deleted",
          description: "Farm and all its plots have been removed.",
        });
        onRefreshFarms();
        
        // If deleted farm was selected, clear selection
        if (selectedFarmId === farmId) {
          const remainingFarms = farms.filter(f => f.id !== farmId);
          if (remainingFarms.length > 0) {
            onSelectFarm(remainingFarms[0].id);
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to delete farm.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the farm.",
        variant: "destructive",
      });
    }
  };

  const getPlotCount = (farmId: string): number => {
    return localStorageService.getPlotsByFarmId(farmId).length;
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Farm Projects</h2>
          <Button
            size="sm"
            onClick={onCreateFarm}
            className="bg-farm-green text-white hover:bg-farm-deep p-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <Button
          onClick={onCreateFarm}
          className="w-full bg-farm-green text-white hover:bg-farm-deep"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Farm Project
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {farms.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No farm projects yet.</p>
            <p className="text-xs mt-1">Create your first farm to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {farms.map((farm) => {
              const plotCount = getPlotCount(farm.id);
              const isSelected = selectedFarmId === farm.id;
              
              return (
                <div
                  key={farm.id}
                  onClick={() => onSelectFarm(farm.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-farm-light border-l-4 border-farm-green' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{farm.name}</h3>
                  <p className="text-sm text-gray-600">{farm.location}</p>
                  {farm.description && (
                    <p className="text-xs text-gray-500 mt-1">{farm.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs font-medium ${
                      isSelected ? 'text-farm-green' : 'text-gray-500'
                    }`}>
                      {plotCount} plots
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement edit functionality
                        }}
                        className="text-gray-400 hover:text-farm-green p-1"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFarm(farm.id, e)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
