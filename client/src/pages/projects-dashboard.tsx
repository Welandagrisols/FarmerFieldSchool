import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, MapPin, Calendar, User, Trash2, Edit, Eye, Ruler } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateFarmProjectModal } from "@/components/create-farm-project-modal";
import { apiRequest } from "@/lib/queryClient";
import { type Farm } from "@shared/schema";

interface ProjectListItem {
  id: string;
  name: string;
  location: string;
  ownerName: string;
  farmSize: string | null;
  crops: string[] | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function ProjectsDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all farm projects for the authenticated user
  const { data: projects = [], isLoading, error } = useQuery<ProjectListItem[]>({
    queryKey: ["/api/projects"],
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => 
      apiRequest(`/api/projects/${projectId}`, "DELETE"),
    onSuccess: () => {
      // Refresh the projects list after deletion
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your farm projects...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load projects. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Farm Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your farm layouts and project data
          </p>
        </div>
        
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No farm projects yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first farm project to start designing layouts and managing your farming operations.
            </p>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create First Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold mb-2">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <MapPin className="h-3 w-3" />
                      {project.location}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-3 w-3" />
                      {project.ownerName}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Project">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href={`/projects/${project.id}/survey`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Survey Tools">
                        <Ruler className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      title="Delete Project"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Farm Details */}
                {project.farmSize && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Size: {project.farmSize} acres
                    </span>
                  </div>
                )}

                {/* Crops Tags */}
                {project.crops && project.crops.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {project.crops.slice(0, 3).map((crop, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {crop}
                        </Badge>
                      ))}
                      {project.crops.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.crops.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created {project.createdAt ? format(new Date(project.createdAt), 'MMM d, yyyy') : 'Unknown'}
                  </div>
                  {project.updatedAt && project.updatedAt !== project.createdAt && (
                    <div>
                      Updated {format(new Date(project.updatedAt), 'MMM d')}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Link href={`/projects/${project.id}`} className="flex-1">
                    <Button className="w-full" variant="outline">
                      <MapPin className="h-4 w-4 mr-2" />
                      Layout
                    </Button>
                  </Link>
                  <Link href={`/projects/${project.id}/survey`} className="flex-1">
                    <Button className="w-full" variant="outline">
                      <Ruler className="h-4 w-4 mr-2" />
                      Survey
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateFarmProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          // Refresh projects list after creation
          queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        }}
      />
    </div>
  );
}