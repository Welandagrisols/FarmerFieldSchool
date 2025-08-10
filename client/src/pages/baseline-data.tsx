import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, BarChart3, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AddSeasonalDataModal } from "@/components/add-seasonal-data-modal";
import { SeasonalDataTable } from "@/components/seasonal-data-table";
import { apiRequest } from "@/lib/queryClient";
import { type Farm } from "@shared/schema";
import { Link } from "wouter";

export function BaselineDataPage() {
  const params = useParams();
  const farmId = params.id;

  const { data: farm, isLoading: farmLoading } = useQuery<Farm>({
    queryKey: ['/api/projects', farmId],
    queryFn: () => apiRequest(`/api/projects/${farmId}`),
    enabled: !!farmId,
  });

  if (farmLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!farm || !farmId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Farm not found or invalid farm ID.</p>
            <div className="flex justify-center mt-4">
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/projects/${farmId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Link>
            </Button>
            <Badge variant="outline">Baseline Data Collection</Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {farm.name} - Baseline Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Collect and analyze historical farming data to establish productivity benchmarks and track improvements over seasons.
          </p>
        </div>
        <AddSeasonalDataModal farmId={farmId} />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{farm.ownerName}</p>
                <p className="text-xs text-gray-500">Farm Owner</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{farm.farmSize || 'N/A'}</p>
                <p className="text-xs text-gray-500">Total Farm Size (Acres)</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{farm.location}</p>
                <p className="text-xs text-gray-500">Location</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{new Date().getFullYear()}</p>
                <p className="text-xs text-gray-500">Current Season</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About Baseline Data Collection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            About Baseline Data Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">What is Baseline Data?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Baseline data captures historical farming information from previous seasons including crop types, land usage, 
                seed varieties, fertilizer applications, and yield results. This data serves as a reference point for measuring 
                productivity improvements and making informed farming decisions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Data We Collect</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Crop types and seed varieties (e.g., DK777, HB 6213)</li>
                <li>• Land area in acres and square meters</li>
                <li>• Basal fertilizers (DAP, NPK 17:17:17, Mavuno planting)</li>
                <li>• Top dressing fertilizers (CAN, Urea)</li>
                <li>• Application amounts in bags and kilograms</li>
                <li>• Final yield data for productivity calculations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seasonal Data Table */}
      <SeasonalDataTable farmId={farmId} />
    </div>
  );
}