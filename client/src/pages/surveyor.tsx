import React from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Map, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SurveyorTool } from "@/components/surveyor-tool";
import { apiRequest } from "@/lib/queryClient";
import { type Farm } from "@shared/schema";

interface RouteParams {
  id: string;
}

export function SurveyorPage() {
  const params = useParams<RouteParams>();
  const [location] = useLocation();
  const farmId = params.id || 'demo-farm';

  // Fetch farm data if we have an ID
  const { data: farm, isLoading } = useQuery<Farm>({
    queryKey: ["/api/projects", farmId],
    enabled: !!params.id,
  });

  const handleSaveMeasurements = async (measurements: any[]) => {
    try {
      // Save measurements to the farm's layout data
      if (params.id) {
        const layoutData = {
          measurements,
          surveyDate: new Date().toISOString(),
        };
        
        await apiRequest(`/api/projects/${farmId}`, "PUT", {
          layoutData: JSON.stringify(layoutData)
        });
      }
      console.log("Measurements saved successfully");
    } catch (error) {
      console.error("Failed to save measurements:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading surveyor tools...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={params.id ? `/projects/${farmId}` : "/projects"}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {params.id ? "Project" : "Projects"}
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Ruler className="h-6 w-6" />
              Farm Surveyor
            </h1>
            {farm && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {farm.name} - {farm.location}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={params.id ? `/projects/${farmId}` : "/"}>
            <Button variant="outline" size="sm">
              <Map className="h-4 w-4 mr-2" />
              Layout Designer
            </Button>
          </Link>
        </div>
      </div>

      {/* Farm Info Card (if we have farm data) */}
      {farm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Owner:</strong> {farm.ownerName}
              </div>
              <div>
                <strong>Location:</strong> {farm.location}
              </div>
              {farm.farmSize && (
                <div>
                  <strong>Farm Size:</strong> {farm.farmSize} acres
                </div>
              )}
              {farm.latitude && farm.longitude && (
                <div>
                  <strong>GPS:</strong> {farm.latitude}, {farm.longitude}
                </div>
              )}
              {farm.crops && farm.crops.length > 0 && (
                <div className="md:col-span-2">
                  <strong>Planned Crops:</strong> {farm.crops.join(', ')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Surveyor Tool */}
      <SurveyorTool 
        farmId={farmId} 
        onSaveMeasurements={handleSaveMeasurements}
      />

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Survey Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>Professional Land Surveying Process:</h4>
            <ol>
              <li><strong>Set Scale:</strong> Enter the scale based on your actual field measurements (meters per pixel)</li>
              <li><strong>Place Reference Points:</strong> Click to place survey markers at key locations (corners, boundaries, structures)</li>
              <li><strong>Create Measurements:</strong> Use the measure tool to calculate distances and angles between points</li>
              <li><strong>Document Findings:</strong> All measurements are automatically recorded with precise coordinates</li>
              <li><strong>Export Data:</strong> Save your survey data for integration with CAD software or regulatory submissions</li>
            </ol>
            
            <h4>Professional Features:</h4>
            <ul>
              <li>Precise coordinate tracking</li>
              <li>Distance and angle calculations</li>
              <li>Multiple point types (markers, corners, reference points)</li>
              <li>Scalable measurements</li>
              <li>Professional data export</li>
              <li>Integration with farm layout data</li>
            </ul>

            <p className="text-sm text-gray-600 mt-4">
              <strong>Note:</strong> For legal boundary surveys, always consult with a licensed professional surveyor. 
              This tool is designed for farm planning and layout purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}