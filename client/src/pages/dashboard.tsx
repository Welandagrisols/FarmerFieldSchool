import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sprout, Plus, LogOut, Ruler } from "lucide-react";
import { Farm } from "@shared/schema";
import { FarmSidebar } from "@/components/farm-sidebar";
import { GridDesigner } from "@/components/grid-designer";
import { CreateFarmModal } from "@/components/create-farm-modal";
import { AddPlotModal } from "@/components/add-plot-modal";
import { Button } from "@/components/ui/button";
import { localStorageService } from "@/lib/storage";

export default function Dashboard() {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [isCreateFarmModalOpen, setIsCreateFarmModalOpen] = useState(false);
  const [isAddPlotModalOpen, setIsAddPlotModalOpen] = useState(false);

  const { data: farms = [], refetch: refetchFarms } = useQuery({
    queryKey: ['/api/farms'],
    queryFn: () => localStorageService.getFarms(),
  });

  const selectedFarm = farms.find(farm => farm.id === selectedFarmId);

  // Auto-select first farm if none selected
  if (!selectedFarmId && farms.length > 0) {
    setSelectedFarmId(farms[0].id);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 farm-green rounded-lg flex items-center justify-center">
              <Sprout className="text-white w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 font-inter">Farm Layout Planner</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex gap-2">
              <Link href="/projects">
                <Button variant="outline">
                  View All Projects
                </Button>
              </Link>
              <Link href="/survey">
                <Button variant="outline">
                  <Ruler className="h-4 w-4 mr-2" />
                  Survey Tools
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 farm-green rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">F</span>
              </div>
              <span className="text-gray-700 font-medium">Farmer</span>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <FarmSidebar
          farms={farms}
          selectedFarmId={selectedFarmId}
          onSelectFarm={setSelectedFarmId}
          onCreateFarm={() => setIsCreateFarmModalOpen(true)}
          onRefreshFarms={refetchFarms}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {selectedFarm ? (
            <>
              {/* Farm Header */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedFarm.name}</h2>
                    <p className="text-gray-600">{selectedFarm.location}</p>
                    {selectedFarm.notes && (
                      <p className="text-sm text-gray-500 mt-1">{selectedFarm.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button 
                      onClick={() => setIsAddPlotModalOpen(true)}
                      className="bg-farm-green text-white hover:bg-farm-deep"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Plot
                    </Button>
                    <Button 
                      variant="secondary"
                      className="bg-farm-gold text-white hover:bg-yellow-600"
                    >
                      Save Layout
                    </Button>
                  </div>
                </div>
              </div>

              {/* Grid Designer */}
              <GridDesigner farmId={selectedFarmId!} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Sprout className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Farm Selected</h3>
                <p className="text-gray-600 mb-4">Create a farm project to get started</p>
                <Button 
                  onClick={() => setIsCreateFarmModalOpen(true)}
                  className="bg-farm-green text-white hover:bg-farm-deep"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Farm Project
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateFarmModal
        isOpen={isCreateFarmModalOpen}
        onClose={() => setIsCreateFarmModalOpen(false)}
        onSuccess={() => {
          refetchFarms();
          setIsCreateFarmModalOpen(false);
        }}
      />

      {selectedFarmId && (
        <AddPlotModal
          isOpen={isAddPlotModalOpen}
          onClose={() => setIsAddPlotModalOpen(false)}
          farmId={selectedFarmId}
          onSuccess={() => {
            setIsAddPlotModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
