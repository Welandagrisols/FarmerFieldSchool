import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GridDesigner } from "@/components/grid-designer";
import { AddPlotModal } from "@/components/add-plot-modal";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  location: string;
  ownerName: string;
  notes: string | null;
  farmSize: number | null;
  crops: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export function ProjectLayoutPage() {
  const { id } = useParams();
  const [isAddPlotModalOpen, setIsAddPlotModalOpen] = useState(false);

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['/api/projects', id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farm-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <Link href="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600">{project.location}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setIsAddPlotModalOpen(true)}
                className="bg-farm-green text-white hover:bg-farm-deep"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Plot
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Layout Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-full">
          {/* Project Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Owner:</span>
                <p className="font-medium">{project.ownerName}</p>
              </div>
              {project.farmSize && (
                <div>
                  <span className="text-gray-500">Size:</span>
                  <p className="font-medium">{project.farmSize} acres</p>
                </div>
              )}
              {project.crops && project.crops.length > 0 && (
                <div>
                  <span className="text-gray-500">Crops:</span>
                  <p className="font-medium">{project.crops.join(', ')}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="font-medium">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Grid Designer */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <GridDesigner farmId={id!} />
          </div>
        </div>
      </main>

      {/* Modals */}
      {id && (
        <AddPlotModal
          isOpen={isAddPlotModalOpen}
          onClose={() => setIsAddPlotModalOpen(false)}
          farmId={id}
          onSuccess={() => {
            setIsAddPlotModalOpen(false);
          }}
        />
      )}
    </div>
  );
}