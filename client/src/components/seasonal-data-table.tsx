import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type SeasonalData } from "@shared/schema";
import { TrendingUp, Calendar, Wheat, Package2, Beaker, Calculator, Trash2, Edit3 } from "lucide-react";

interface SeasonalDataTableProps {
  farmId: string;
}

export function SeasonalDataTable({ farmId }: SeasonalDataTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: seasonalData, isLoading, error } = useQuery<SeasonalData[]>({
    queryKey: ['/api/farms', farmId, 'seasonal-data'],
    queryFn: () => apiRequest(`/api/farms/${farmId}/seasonal-data`),
  });

  const deleteSeasonalDataMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/seasonal-data/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'seasonal-data'] });
      toast({
        title: "Success",
        description: "Seasonal data has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete seasonal data. Please try again.",
      });
      console.error("Error deleting seasonal data:", error);
    },
  });

  const formatNumber = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '-' : num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const calculateProductivityPercentage = (current: SeasonalData, comparison: SeasonalData): number => {
    const currentProd = parseFloat(current.productivityKgsPerAcre || '0');
    const comparisonProd = parseFloat(comparison.productivityKgsPerAcre || '0');
    if (comparisonProd === 0) return 0;
    return ((currentProd - comparisonProd) / comparisonProd) * 100;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Baseline Seasonal Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <TrendingUp className="h-5 w-5" />
            Baseline Seasonal Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Failed to load seasonal data. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const seasons = seasonalData || [];

  if (seasons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Baseline Seasonal Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No seasonal data recorded yet.</p>
            <p className="text-sm">Add baseline data for previous seasons to track productivity improvements.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedSeasons = [...seasons].sort((a, b) => b.year - a.year);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Baseline Seasonal Data ({seasons.length} seasons)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Season</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Crop & Variety</TableHead>
                <TableHead>Land Area</TableHead>
                <TableHead>Fertilizer Usage</TableHead>
                <TableHead>Yield</TableHead>
                <TableHead>Productivity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSeasons.map((season, index) => {
                const previousSeason = sortedSeasons[index + 1];
                const productivityChange = previousSeason ? calculateProductivityPercentage(season, previousSeason) : null;
                
                return (
                  <TableRow key={season.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">{season.seasonName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{season.year}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wheat className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{season.cropGrown}</div>
                          <div className="text-xs text-gray-500">{season.seedVariety}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatNumber(season.landAreaAcres)} acres</div>
                        <div className="text-gray-500">{formatNumber(season.landAreaM2)} m²</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        {season.basalFertilizerType && (
                          <div className="flex items-center gap-1">
                            <Beaker className="h-3 w-3" />
                            <span>{season.basalFertilizerType}: {formatNumber(season.basalFertilizerAmountBags)} bags</span>
                          </div>
                        )}
                        {season.topDressingFertilizerType && (
                          <div className="flex items-center gap-1">
                            <Beaker className="h-3 w-3" />
                            <span>{season.topDressingFertilizerType}: {formatNumber(season.topDressingFertilizerAmountBags)} bags</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4" />
                        <div className="text-sm">
                          <div>{formatNumber(season.yieldBags)} bags</div>
                          <div className="text-gray-500">{formatNumber(season.yieldKgs)} kgs</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calculator className="h-3 w-3" />
                          <span>{formatNumber(season.productivityKgsPerAcre)} kg/acre</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatNumber(season.productivityKgsPerM2)} kg/m²
                        </div>
                        {productivityChange !== null && (
                          <Badge 
                            variant={productivityChange >= 0 ? "default" : "destructive"} 
                            className="text-xs"
                          >
                            {productivityChange >= 0 ? '+' : ''}{productivityChange.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Edit seasonal data"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete seasonal data"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Seasonal Data</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the seasonal data for "{season.seasonName} ({season.year})"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSeasonalDataMutation.mutate(season.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Statistics */}
        {seasons.length > 1 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(seasons.reduce((sum, s) => sum + parseFloat(s.landAreaAcres || '0'), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Acres Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(seasons.reduce((sum, s) => sum + parseFloat(s.yieldKgs || '0'), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Yield (Kgs)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(
                  seasons.length > 0 
                    ? seasons.reduce((sum, s) => sum + parseFloat(s.productivityKgsPerAcre || '0'), 0) / seasons.length
                    : 0
                )}
              </div>
              <div className="text-sm text-gray-600">Avg. Productivity (Kg/Acre)</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}